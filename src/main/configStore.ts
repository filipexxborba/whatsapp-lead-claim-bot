import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { SupabaseConfig } from '../shared/types'

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
