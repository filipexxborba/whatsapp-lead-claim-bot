import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../shared/types'
import type {
  SupabaseConfig,
  WhatsAppGroup,
  Trigger,
  MessageTemplate,
  ClaimedContact,
  BotStatusPayload,
  ConnectionTestResult,
  DashboardStats,
  UpdateStatusPayload,
  AppPreferences,
  AuditLogEntry
} from '../shared/types'

const api = {
  config: {
    get: (): Promise<SupabaseConfig | null> => ipcRenderer.invoke(IPC_CHANNELS.getSupabaseConfig),
    set: (config: SupabaseConfig): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.setSupabaseConfig, config),
    has: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.hasSupabaseConfig),
    test: (config: SupabaseConfig): Promise<ConnectionTestResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.testSupabaseConfig, config)
  },
  preferences: {
    get: (): Promise<AppPreferences> => ipcRenderer.invoke(IPC_CHANNELS.getPreferences),
    set: (preferences: Partial<AppPreferences>): Promise<AppPreferences> =>
      ipcRenderer.invoke(IPC_CHANNELS.setPreferences, preferences)
  },
  bot: {
    start: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.botStart),
    pause: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.botPause),
    resume: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.botResume),
    logout: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.botLogout),
    getStatus: (): Promise<BotStatusPayload> => ipcRenderer.invoke(IPC_CHANNELS.botGetStatus),
    onStatusChanged: (callback: (status: BotStatusPayload) => void): (() => void) => {
      const listener = (_event: unknown, status: BotStatusPayload): void => callback(status)
      ipcRenderer.on(IPC_CHANNELS.botStatusChanged, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.botStatusChanged, listener)
    }
  },
  groups: {
    list: (): Promise<WhatsAppGroup[]> => ipcRenderer.invoke(IPC_CHANNELS.listGroups),
    toggle: (jid: string, active: boolean): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.toggleGroup, jid, active)
  },
  triggers: {
    list: (): Promise<Trigger[]> => ipcRenderer.invoke(IPC_CHANNELS.listTriggers),
    upsert: (trigger: Partial<Trigger>): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.upsertTrigger, trigger),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.deleteTrigger, id)
  },
  templates: {
    list: (): Promise<MessageTemplate[]> => ipcRenderer.invoke(IPC_CHANNELS.listTemplates),
    upsert: (template: Partial<MessageTemplate>): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.upsertTemplate, template),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.deleteTemplate, id)
  },
  contacts: {
    list: (): Promise<ClaimedContact[]> => ipcRenderer.invoke(IPC_CHANNELS.listClaimedContacts)
  },
  dashboard: {
    getStats: (): Promise<DashboardStats> => ipcRenderer.invoke(IPC_CHANNELS.getDashboardStats)
  },
  audit: {
    list: (): Promise<AuditLogEntry[]> => ipcRenderer.invoke(IPC_CHANNELS.listAuditLog)
  },
  updater: {
    getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.getAppVersion),
    getStatus: (): Promise<UpdateStatusPayload> =>
      ipcRenderer.invoke(IPC_CHANNELS.updaterGetStatus),
    checkNow: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.updaterCheckNow),
    installNow: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.updaterInstallNow),
    onStatusChanged: (callback: (status: UpdateStatusPayload) => void): (() => void) => {
      const listener = (_event: unknown, status: UpdateStatusPayload): void => callback(status)
      ipcRenderer.on(IPC_CHANNELS.updaterStatusChanged, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.updaterStatusChanged, listener)
    }
  }
}

export type PreloadApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
