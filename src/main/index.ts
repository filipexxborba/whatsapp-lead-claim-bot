import { app, dialog, ipcMain, nativeTheme, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { updateManager } from './autoUpdater'
import { getPreferences } from './configStore'
import { IPC_CHANNELS } from '../shared/types'

const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000

// Sem isso, um erro não tratado ao iniciar mata o processo em silêncio — quem
// abriu o app com duplo clique só vê a janela "piscar" e fechar, sem nenhuma
// pista do que aconteceu.
function reportFatalError(context: string, err: unknown): void {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err)
  dialog.showErrorBox('Lead Claim Bot — erro ao iniciar', `${context}\n\n${message}`)
}

process.on('uncaughtException', (err) => reportFatalError('Erro inesperado', err))
process.on('unhandledRejection', (err) => reportFatalError('Erro inesperado (promise)', err))

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

app.whenReady().then(async () => {
  try {
    electronApp.setAppUserModelId('com.h2oinnovation.whatsapp-lead-claim-bot')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Registrado cedo (não dentro de ipcHandlers.ts, carregado sob demanda depois)
    // porque o preload precisa ler o tema de forma síncrona antes do primeiro
    // paint, pra não piscar o tema errado por uma fração de segundo.
    nativeTheme.themeSource = getPreferences().theme
    ipcMain.on(IPC_CHANNELS.themeGetResolvedSync, (event) => {
      event.returnValue = nativeTheme.shouldUseDarkColors
    })
    nativeTheme.on('updated', () => {
      mainWindow?.webContents.send(
        IPC_CHANNELS.themeResolvedChanged,
        nativeTheme.shouldUseDarkColors
      )
    })

    // Carregados só agora (não no topo do arquivo): tray e ipcHandlers puxam o
    // Baileys, que é pesado pra carregar. Assim a janela já aparece antes, e se
    // essa parte falhar, cai no catch abaixo em vez de matar o processo antes de
    // qualquer coisa aparecer na tela.
    createWindow()

    const [{ createTray }, { registerIpcHandlers }] = await Promise.all([
      import('./tray'),
      import('./ipcHandlers')
    ])
    createTray(() => mainWindow)
    registerIpcHandlers(() => mainWindow)

    updateManager.init()
    updateManager.checkNow()
    setInterval(() => updateManager.checkNow(), UPDATE_CHECK_INTERVAL_MS)

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
      else mainWindow?.show()
    })
  } catch (err) {
    reportFatalError('Falha ao inicializar', err)
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

// O app fica na bandeja mesmo com todas as janelas fechadas, em qualquer
// plataforma, para o bot continuar escutando os grupos em segundo plano.
app.on('window-all-closed', () => {
  // Intencionalmente vazio: não chamamos app.quit() aqui.
})
