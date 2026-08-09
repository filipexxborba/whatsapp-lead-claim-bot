import { EventEmitter } from 'node:events'
import makeWASocket, {
  useMultiFileAuthState as loadMultiFileAuthState,
  DisconnectReason,
  type WASocket,
  type WAMessage
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { whatsAppAuthDir, clearWhatsAppAuth, getPreferences } from './configStore'
import { logger as rootLogger } from './logger'
import {
  syncDiscoveredGroups,
  listActiveGroupJids,
  listActiveTriggers,
  listBlacklistedPhoneNumbers,
  claimContact,
  markMessageSent,
  getLastMessageSentAt
} from './supabaseClient'
import type { BotStatusPayload, Trigger } from '../shared/types'

const logger = rootLogger.child({ module: 'bot' })
// Nível separado (warn) do logger que passamos pro Baileys: os logs internos
// dele em 'info'/'debug' são bem verbosos e não é isso que queremos gravando
// sem parar no arquivo compartilhado.
const baileysLogger = rootLogger.child({ module: 'baileys' }, { level: 'warn' })

export interface LeadClaimedInfo {
  phoneJid: string
  groupName: string
  triggerText: string
}

export interface MessageSentInfo {
  phoneJid: string
  groupName: string
}

export interface ProcessingErrorInfo {
  message: string
}

function extractText(message: WAMessage): string | undefined {
  const m = message.message
  if (!m) return undefined
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.videoMessage?.caption ??
    undefined
  )
}

function matchesTrigger(text: string, triggers: Trigger[]): Trigger | undefined {
  const normalized = text.trim().toLowerCase()
  return triggers.find((trigger) => {
    const triggerText = trigger.text.trim().toLowerCase()
    return trigger.match_type === 'exact'
      ? normalized === triggerText
      : normalized.includes(triggerText)
  })
}

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => vars[key] ?? '')
}

function randomDelayMs(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// Sem backoff, uma queda de conexão persistente (instabilidade de rede, ou o
// próprio WhatsApp recusando temporariamente) vira um loop de reconexão sem
// pausa — o tipo de padrão que piora a situação em vez de esperar ela passar.
const MAX_RECONNECT_DELAY_MS = 60_000

// Teto de mensagens novas (primeiro contato) que o bot manda numa janela de
// tempo, independente do cooldown por número. O cooldown evita repetir a
// mesma pessoa; isso aqui evita uma rajada de dezenas de DMs em minutos
// quando um grupo bomba — o padrão mais comum de denúncia/bloqueio por spam.
const MAX_NEW_MESSAGES_PER_WINDOW = 6
const SEND_WINDOW_MS = 5 * 60_000

class WhatsAppBot extends EventEmitter {
  private socket: WASocket | null = null
  private paused = false
  private status: BotStatusPayload = { status: 'disconnected' }
  private starting = false
  private reconnectAttempts = 0
  private sentTimestamps: number[] = []

  getStatus(): BotStatusPayload {
    return this.status
  }

  private setStatus(payload: BotStatusPayload): void {
    this.status = payload
    this.emit('status', payload)
  }

  async start(): Promise<void> {
    if (this.starting || this.socket) return
    this.starting = true
    this.paused = false

    try {
      const { state, saveCreds } = await loadMultiFileAuthState(whatsAppAuthDir())

      const socket = makeWASocket({
        auth: state,
        logger: baileysLogger,
        printQRInTerminal: false
      })
      this.socket = socket

      socket.ev.on('creds.update', saveCreds)

      socket.ev.on('connection.update', (update) => {
        void this.handleConnectionUpdate(update)
      })

      socket.ev.on('messages.upsert', ({ messages, type }) => {
        if (type !== 'notify') return
        for (const message of messages) {
          void this.handleIncomingMessage(message)
        }
      })
    } catch (err) {
      this.starting = false
      this.setStatus({ status: 'error', errorMessage: (err as Error).message })
      throw err
    }
  }

  private async handleConnectionUpdate(update: {
    connection?: string
    lastDisconnect?: { error?: unknown }
    qr?: string
  }): Promise<void> {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr)
      this.setStatus({ status: 'waiting_qr', qr: qrDataUrl })
    }

    if (connection === 'open') {
      this.starting = false
      this.reconnectAttempts = 0
      const ownNumber = this.socket?.user?.id?.split(':')[0]
      this.setStatus({ status: 'connected', connectedNumber: ownNumber })
      await this.discoverGroups()
    }

    if (connection === 'close') {
      this.starting = false
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      this.socket = null

      if (shouldReconnect && !this.paused) {
        this.reconnectAttempts++
        const delayMs = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** (this.reconnectAttempts - 1))
        logger.warn(
          `Reconectando em ${Math.round(delayMs / 1000)}s (tentativa ${this.reconnectAttempts}).`
        )
        this.setStatus({ status: 'connecting' })
        await sleep(delayMs)
        await this.start()
      } else {
        this.setStatus({ status: 'disconnected' })
      }
    }
  }

  private async discoverGroups(): Promise<void> {
    if (!this.socket) return
    try {
      const groupsMap = await this.socket.groupFetchAllParticipating()
      const groups = Object.values(groupsMap).map((g) => ({ jid: g.id, name: g.subject }))
      await syncDiscoveredGroups(groups)
    } catch (err) {
      logger.warn({ err }, 'Falha ao sincronizar grupos do WhatsApp')
    }
  }

  /** true se o grupo não está ativo ou o remetente está na blacklist — em ambos os casos, ignora a mensagem. */
  private async shouldSkipMessage(groupJid: string, senderPhoneNumber: string): Promise<boolean> {
    const [activeGroupJids, blacklistedNumbers] = await Promise.all([
      listActiveGroupJids(),
      listBlacklistedPhoneNumbers()
    ])
    return !activeGroupJids.has(groupJid) || blacklistedNumbers.has(senderPhoneNumber)
  }

  /** Bloqueia até haver espaço na janela de envio, espaçando rajadas de DMs novas. */
  private async waitForSendSlot(): Promise<void> {
    for (;;) {
      const now = Date.now()
      this.sentTimestamps = this.sentTimestamps.filter((t) => now - t < SEND_WINDOW_MS)
      if (this.sentTimestamps.length < MAX_NEW_MESSAGES_PER_WINDOW) {
        this.sentTimestamps.push(now)
        return
      }
      const waitMs = SEND_WINDOW_MS - (now - this.sentTimestamps[0]) + 250
      logger.info(`Limite de mensagens novas atingido; aguardando ${Math.ceil(waitMs / 1000)}s.`)
      await sleep(waitMs)
    }
  }

  private async handleIncomingMessage(message: WAMessage): Promise<void> {
    if (this.paused) return
    if (!this.socket) return
    if (message.key.fromMe) return

    const groupJid = message.key.remoteJid
    if (!groupJid?.endsWith('@g.us')) return

    const senderJid = message.key.participant
    if (!senderJid) return

    // O WhatsApp identifica remetentes em grupos por um LID (Linked ID) em vez do
    // número de telefone real, por privacidade. Quando disponível, o Baileys expõe
    // o número real em participantAlt — usamos ele só para exibição/registro do
    // lead; o envio da DM continua endereçado ao JID que o WhatsApp resolveu.
    const senderPhoneJid = message.key.participantAlt ?? senderJid

    const text = extractText(message)
    if (!text) return

    try {
      const senderPhoneNumber = senderPhoneJid.split('@')[0]
      if (await this.shouldSkipMessage(groupJid, senderPhoneNumber)) return

      const triggers = await listActiveTriggers()
      const matched = matchesTrigger(text, triggers)
      if (!matched) return

      const messageId = message.key.id
      if (!messageId) return

      const groupMetadata = await this.socket.groupMetadata(groupJid)

      const isNewClaim = await claimContact({
        messageId,
        phoneJid: senderPhoneJid,
        groupJid,
        groupName: groupMetadata.subject,
        triggerText: matched.text
      })
      if (!isNewClaim) return

      const leadInfo: LeadClaimedInfo = {
        phoneJid: senderPhoneJid,
        groupName: groupMetadata.subject,
        triggerText: matched.text
      }
      this.emit('lead-claimed', leadInfo)

      await this.socket.sendMessage(groupJid, {
        react: { text: '👍', key: message.key }
      })

      const template = matched.template
      if (!template) {
        logger.warn(`Gatilho "${matched.text}" não tem template configurado; DM não enviada.`)
        return
      }

      // Evita mandar a mesma DM de novo se a pessoa disparar o gatilho outra vez
      // dentro do intervalo configurado — a reação acima já aconteceu de qualquer
      // forma, só o envio da mensagem respeita esse cooldown.
      const cooldownMinutes = getPreferences().messageCooldownMinutes
      const lastSentAt = await getLastMessageSentAt(senderPhoneJid)
      if (lastSentAt) {
        const elapsedMs = Date.now() - new Date(lastSentAt).getTime()
        if (elapsedMs < cooldownMinutes * 60_000) {
          logger.info(
            `Cooldown ativo para ${senderPhoneJid} (${cooldownMinutes}min); DM não enviada.`
          )
          return
        }
      }

      await this.waitForSendSlot()
      await sleep(randomDelayMs(3000, 8000))

      const body = renderTemplate(template.body, {
        gatilho: matched.text
      })

      await this.socket.sendMessage(senderJid, { text: body })
      await markMessageSent(messageId)

      const sentInfo: MessageSentInfo = {
        phoneJid: senderPhoneJid,
        groupName: groupMetadata.subject
      }
      this.emit('message-sent', sentInfo)
    } catch (err) {
      logger.error({ err }, 'Falha ao processar mensagem recebida')
      const info: ProcessingErrorInfo = { message: (err as Error).message }
      this.emit('processing-error', info)
    }
  }

  pause(): void {
    this.paused = true
    this.setStatus({ status: 'paused' })
  }

  async resume(): Promise<void> {
    this.paused = false
    if (this.socket) {
      const ownNumber = this.socket.user?.id?.split(':')[0]
      this.setStatus({ status: 'connected', connectedNumber: ownNumber })
    } else {
      await this.start()
    }
  }

  async logout(): Promise<void> {
    this.paused = false
    if (this.socket) {
      try {
        await this.socket.logout()
      } catch (err) {
        // A sessão local vai ser limpa de qualquer forma logo abaixo — mesmo se
        // o pedido de logout ao WhatsApp falhar (ex: já estava desconectado),
        // não faz sentido travar aqui e deixar as credenciais velhas no disco.
        logger.warn({ err }, 'Falha ao encerrar sessão no WhatsApp')
      }
      this.socket = null
    }
    // Sem isso, o próximo start() reusa as credenciais salvas (agora inválidas
    // no servidor) e a conexão é rejeitada na hora, sem nunca gerar um QR novo.
    clearWhatsAppAuth()
    this.setStatus({ status: 'disconnected' })
  }
}

export const bot = new WhatsAppBot()
