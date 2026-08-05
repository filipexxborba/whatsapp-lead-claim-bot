import { app, ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type { SupabaseConfig, Trigger, MessageTemplate, AppPreferences } from '../shared/types'
import {
  getSupabaseConfig,
  setSupabaseConfig,
  hasSupabaseConfig,
  getPreferences,
  setPreferences
} from './configStore'
import { resetSupabaseClient } from './supabaseClient'
import * as db from './supabaseClient'
import { bot } from './bot'
import { updateManager } from './autoUpdater'

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.getSupabaseConfig, () => getSupabaseConfig())
  ipcMain.handle(IPC_CHANNELS.hasSupabaseConfig, () => hasSupabaseConfig())
  ipcMain.handle(IPC_CHANNELS.setSupabaseConfig, (_event, config: SupabaseConfig) => {
    setSupabaseConfig(config)
    resetSupabaseClient()
  })
  ipcMain.handle(IPC_CHANNELS.testSupabaseConfig, (_event, config: SupabaseConfig) =>
    db.testSupabaseConnection(config)
  )

  ipcMain.handle(IPC_CHANNELS.botGetStatus, () => bot.getStatus())
  ipcMain.handle(IPC_CHANNELS.botStart, () => bot.start())
  ipcMain.handle(IPC_CHANNELS.botPause, () => bot.pause())
  ipcMain.handle(IPC_CHANNELS.botResume, () => bot.resume())
  ipcMain.handle(IPC_CHANNELS.botLogout, () => bot.logout())

  bot.on('status', (status) => {
    getMainWindow()?.webContents.send(IPC_CHANNELS.botStatusChanged, status)
  })

  ipcMain.handle(IPC_CHANNELS.listGroups, () => db.listGroups())
  ipcMain.handle(IPC_CHANNELS.toggleGroup, (_event, jid: string, active: boolean) =>
    db.toggleGroup(jid, active)
  )

  ipcMain.handle(IPC_CHANNELS.listTriggers, () => db.listTriggers())
  ipcMain.handle(IPC_CHANNELS.upsertTrigger, (_event, trigger: Partial<Trigger>) =>
    db.upsertTrigger(trigger)
  )
  ipcMain.handle(IPC_CHANNELS.deleteTrigger, (_event, id: string) => db.deleteTrigger(id))

  ipcMain.handle(IPC_CHANNELS.listTemplates, () => db.listTemplates())
  ipcMain.handle(IPC_CHANNELS.upsertTemplate, (_event, template: Partial<MessageTemplate>) =>
    db.upsertTemplate(template)
  )
  ipcMain.handle(IPC_CHANNELS.deleteTemplate, (_event, id: string) => db.deleteTemplate(id))

  ipcMain.handle(IPC_CHANNELS.listClaimedContacts, () => db.listClaimedContacts())

  ipcMain.handle(IPC_CHANNELS.getDashboardStats, () => db.getDashboardStats())
  ipcMain.handle(IPC_CHANNELS.listAuditLog, () => db.listAuditLog())

  ipcMain.handle(IPC_CHANNELS.getPreferences, () => getPreferences())
  ipcMain.handle(IPC_CHANNELS.setPreferences, (_event, preferences: Partial<AppPreferences>) =>
    setPreferences(preferences)
  )

  ipcMain.handle(IPC_CHANNELS.getAppVersion, () => app.getVersion())
  ipcMain.handle(IPC_CHANNELS.updaterGetStatus, () => updateManager.getStatus())
  ipcMain.handle(IPC_CHANNELS.updaterCheckNow, () => updateManager.checkNow())
  ipcMain.handle(IPC_CHANNELS.updaterInstallNow, () => updateManager.installNow())

  updateManager.on('status', (status) => {
    getMainWindow()?.webContents.send(IPC_CHANNELS.updaterStatusChanged, status)
  })
}
