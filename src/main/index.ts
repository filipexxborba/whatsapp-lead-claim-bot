import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createTray } from './tray'
import { registerIpcHandlers } from './ipcHandlers'
import { updateManager } from './autoUpdater'

const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Fechar a janela só esconde o painel — o bot continua rodando em segundo
  // plano, controlável pelo ícone da bandeja, até o usuário escolher "Sair".
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.h2oinnovation.whatsapp-lead-claim-bot')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  createTray(() => mainWindow)
  registerIpcHandlers(() => mainWindow)

  updateManager.init()
  updateManager.checkNow()
  setInterval(() => updateManager.checkNow(), UPDATE_CHECK_INTERVAL_MS)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

// O app fica na bandeja mesmo com todas as janelas fechadas, em qualquer
// plataforma, para o bot continuar escutando os grupos em segundo plano.
app.on('window-all-closed', () => {
  // Intencionalmente vazio: não chamamos app.quit() aqui.
})
