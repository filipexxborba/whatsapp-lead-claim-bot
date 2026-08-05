export type BotStatus =
  'disconnected' | 'waiting_qr' | 'connecting' | 'connected' | 'paused' | 'error'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export interface WhatsAppGroup {
  jid: string
  name: string
  active: boolean
}

export interface Trigger {
  id: string
  text: string
  match_type: 'exact' | 'contains'
  active: boolean
  template_id: string | null
  template?: MessageTemplate | null
  created_at?: string
}

export interface MessageTemplate {
  id: string
  name: string
  body: string
  created_at?: string
}

export interface ClaimedContact {
  id: string
  phone_jid: string
  group_jid: string
  group_name: string
  trigger_text: string
  message_sent: boolean
  message_sent_at?: string | null
  claimed_at: string
}

export interface BotStatusPayload {
  status: BotStatus
  connectedNumber?: string
  qr?: string
  errorMessage?: string
}

export interface ConnectionTestResult {
  ok: boolean
  message: string
}

export interface NotificationPreferences {
  leadClaimed: boolean
  messageSent: boolean
  botError: boolean
}

export type ThemePreference = 'system' | 'light' | 'dark'

export interface AppPreferences {
  auditLogEnabled: boolean
  notifications: NotificationPreferences
  theme: ThemePreference
  /** Intervalo mínimo (minutos) antes de mandar outra DM pro mesmo número. */
  messageCooldownMinutes: number
}

export type AuditEntityType = 'group' | 'trigger' | 'template'
export type AuditAction = 'created' | 'updated' | 'deleted'

export interface AuditLogEntry {
  id: string
  entity_type: AuditEntityType
  entity_id: string
  action: AuditAction
  before: unknown
  after: unknown
  created_at: string
}

export interface DashboardStats {
  totalLeads: number
  leadsToday: number
  messagesSent: number
  messagesPending: number
  activeGroups: number
  totalGroups: number
  activeTriggers: number
  activeTriggersMissingTemplate: number
  leadsByDay: { date: string; count: number }[]
}

export type UpdateStatus =
  'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateStatusPayload {
  status: UpdateStatus
  version?: string
  progressPercent?: number
  errorMessage?: string
}

export const IPC_CHANNELS = {
  getSupabaseConfig: 'config:get-supabase',
  setSupabaseConfig: 'config:set-supabase',
  hasSupabaseConfig: 'config:has-supabase',
  testSupabaseConfig: 'config:test-supabase',

  getPreferences: 'preferences:get',
  setPreferences: 'preferences:set',

  themeGetResolvedSync: 'theme:get-resolved-sync',
  themeResolvedChanged: 'theme:resolved-changed',

  getDashboardStats: 'dashboard:get-stats',
  listAuditLog: 'audit:list',

  getAppVersion: 'updater:get-app-version',
  updaterGetStatus: 'updater:get-status',
  updaterCheckNow: 'updater:check-now',
  updaterInstallNow: 'updater:install-now',
  updaterStatusChanged: 'updater:status-changed',

  botStart: 'bot:start',
  botPause: 'bot:pause',
  botResume: 'bot:resume',
  botLogout: 'bot:logout',
  botGetStatus: 'bot:get-status',
  botStatusChanged: 'bot:status-changed',

  listGroups: 'groups:list',
  toggleGroup: 'groups:toggle',

  listTriggers: 'triggers:list',
  upsertTrigger: 'triggers:upsert',
  deleteTrigger: 'triggers:delete',

  listTemplates: 'templates:list',
  upsertTemplate: 'templates:upsert',
  deleteTemplate: 'templates:delete',

  listClaimedContacts: 'contacts:list'
} as const
