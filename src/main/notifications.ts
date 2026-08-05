import { BrowserWindow, Notification } from 'electron'
import { getPreferences } from './configStore'
import type { NotificationPreferences } from '../shared/types'

type NotificationKind = keyof NotificationPreferences

const TITLES: Record<NotificationKind, string> = {
  leadClaimed: 'Novo lead reservado',
  messageSent: 'Mensagem enviada',
  botError: 'Problema no bot'
}

export function formatPhone(jid: string): string {
  return jid.split('@')[0]
}

/** Só notifica quando ligado nas preferências e a janela não está em primeiro plano. */
export function notify(
  kind: NotificationKind,
  body: string,
  getMainWindow: () => BrowserWindow | null
): void {
  if (!getPreferences().notifications[kind]) return
  if (!Notification.isSupported()) return

  const win = getMainWindow()
  if (win?.isFocused()) return

  const notification = new Notification({ title: TITLES[kind], body })
  notification.on('click', () => {
    win?.show()
    win?.focus()
  })
  notification.show()
}
