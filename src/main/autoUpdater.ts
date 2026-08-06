import { EventEmitter } from 'node:events'
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import pino from 'pino'
import type { UpdateStatusPayload } from '../shared/types'

const logger = pino({ level: 'warn' })

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = false

/**
 * No macOS, o Squirrel.Mac/ShipIt exige assinatura de código válida do
 * desenvolvedor Apple pra trocar o .app no lugar — sem certificado, essa
 * validação falha sempre nesse ponto específico (diferente do Windows, cujo
 * instalador NSIS funciona sem assinatura). Não dá pra contornar isso no
 * código; só troca a mensagem técnica por uma explicação acionável.
 */
function friendlyUpdateErrorMessage(rawMessage: string): string {
  if (/code signature|shipit/i.test(rawMessage)) {
    return 'O macOS bloqueou a atualização automática porque este app ainda não tem assinatura de desenvolvedor Apple válida (exigida pelo próprio sistema). Baixe a versão mais recente manualmente pela página de releases.'
  }
  return rawMessage
}

class UpdateManager extends EventEmitter {
  private status: UpdateStatusPayload = { status: 'idle' }

  getStatus(): UpdateStatusPayload {
    return this.status
  }

  private setStatus(payload: UpdateStatusPayload): void {
    this.status = payload
    this.emit('status', payload)
  }

  init(): void {
    autoUpdater.on('checking-for-update', () => {
      this.setStatus({ status: 'checking' })
    })

    autoUpdater.on('update-available', (info) => {
      this.setStatus({ status: 'available', version: info.version })
    })

    autoUpdater.on('update-not-available', () => {
      this.setStatus({ status: 'not-available' })
    })

    autoUpdater.on('download-progress', (progress) => {
      this.setStatus({ status: 'downloading', progressPercent: Math.round(progress.percent) })
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.setStatus({ status: 'downloaded', version: info.version })
    })

    autoUpdater.on('error', (err) => {
      logger.error({ err }, 'Falha ao verificar/baixar atualização')
      this.setStatus({ status: 'error', errorMessage: friendlyUpdateErrorMessage(err.message) })
    })
  }

  checkNow(): void {
    if (!app.isPackaged) {
      logger.warn('Verificação de atualização ignorada: app não empacotado (modo dev).')
      return
    }
    void autoUpdater.checkForUpdates()
  }

  installNow(): void {
    logger.info('Instalação da atualização solicitada pelo usuário.')
    try {
      // isSilent=false: mostra a UI do instalador (assim dá pra ver algo
      // acontecendo). isForceRunAfter=true: reabre o app depois de instalar —
      // explícito em vez de depender do valor padrão do electron-updater.
      autoUpdater.quitAndInstall(false, true)
    } catch (err) {
      logger.error({ err }, 'quitAndInstall lançou uma exceção')
      this.setStatus({ status: 'error', errorMessage: (err as Error).message })
      return
    }

    // Se o app realmente fechar pra instalar, o processo termina e este timer
    // nunca dispara. Se disparar, quitAndInstall() falhou em silêncio (ex: o
    // instalador baixado sumiu do disco) — sem isso o usuário não via nada.
    setTimeout(() => {
      logger.warn('quitAndInstall não fechou o app a tempo; instalador provavelmente falhou.')
      this.setStatus({
        status: 'error',
        errorMessage:
          'Não foi possível iniciar o instalador. Tente "Verificar atualizações" de novo.'
      })
    }, 5000)
  }
}

export const updateManager = new UpdateManager()
