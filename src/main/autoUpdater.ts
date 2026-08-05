import { EventEmitter } from 'node:events'
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import pino from 'pino'
import type { UpdateStatusPayload } from '../shared/types'

const logger = pino({ level: 'warn' })

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = false

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
      this.setStatus({ status: 'error', errorMessage: err.message })
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
    autoUpdater.quitAndInstall()
  }
}

export const updateManager = new UpdateManager()
