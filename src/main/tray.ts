import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'
import icon from '../../resources/icon.png?asset'
import { bot } from './bot'

let tray: Tray | null = null

function statusLabel(): string {
  const { status } = bot.getStatus()
  switch (status) {
    case 'connected':
      return 'Conectado — escutando grupos'
    case 'paused':
      return 'Pausado'
    case 'connecting':
      return 'Conectando...'
    case 'waiting_qr':
      return 'Aguardando leitura do QR Code'
    case 'error':
      return 'Erro na conexão'
    default:
      return 'Desconectado'
  }
}

export function createTray(getMainWindow: () => BrowserWindow | null): void {
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon)
  tray.setToolTip('WhatsApp Lead Claim Bot')

  refreshTrayMenu(getMainWindow)
  bot.on('status', () => refreshTrayMenu(getMainWindow))

  tray.on('click', () => {
    const win = getMainWindow()
    if (win) {
      win.show()
      win.focus()
    }
  })
}

function refreshTrayMenu(getMainWindow: () => BrowserWindow | null): void {
  if (!tray) return
  const { status } = bot.getStatus()
  const isPaused = status === 'paused'
  const isRunning = status === 'connected' || status === 'connecting' || status === 'waiting_qr'

  const menu = Menu.buildFromTemplate([
    { label: statusLabel(), enabled: false },
    { type: 'separator' },
    {
      label: isPaused ? 'Retomar' : 'Pausar',
      enabled: isPaused || isRunning,
      click: () => {
        if (isPaused) void bot.resume()
        else bot.pause()
      }
    },
    {
      label: 'Abrir painel',
      click: () => {
        const win = getMainWindow()
        if (win) {
          win.show()
          win.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(menu)
}
