import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { AppPreferences, SupabaseConfig } from '../shared/types'

const configDir = (): string => {
  const dir = join(app.getPath('userData'), 'secure-config')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

const supabaseConfigPath = (): string => join(configDir(), 'supabase.enc')

export function hasSupabaseConfig(): boolean {
  return existsSync(supabaseConfigPath())
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const filePath = supabaseConfigPath()
  if (!existsSync(filePath)) return null

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('A criptografia do sistema operacional não está disponível nesta máquina.')
  }

  const encrypted = readFileSync(filePath)
  const decrypted = safeStorage.decryptString(encrypted)
  return JSON.parse(decrypted) as SupabaseConfig
}

export function setSupabaseConfig(config: SupabaseConfig): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('A criptografia do sistema operacional não está disponível nesta máquina.')
  }

  const encrypted = safeStorage.encryptString(JSON.stringify(config))
  writeFileSync(supabaseConfigPath(), encrypted)
}

export function whatsAppAuthDir(): string {
  const dir = join(app.getPath('userData'), 'whatsapp-auth')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

const DEFAULT_PREFERENCES: AppPreferences = { auditLogEnabled: false }

const preferencesPath = (): string => join(app.getPath('userData'), 'preferences.json')

export function getPreferences(): AppPreferences {
  const filePath = preferencesPath()
  if (!existsSync(filePath)) return DEFAULT_PREFERENCES

  try {
    const stored = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<AppPreferences>
    return { ...DEFAULT_PREFERENCES, ...stored }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function setPreferences(preferences: Partial<AppPreferences>): AppPreferences {
  const next = { ...getPreferences(), ...preferences }
  writeFileSync(preferencesPath(), JSON.stringify(next, null, 2))
  return next
}
