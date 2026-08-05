import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './configStore'
import type {
  WhatsAppGroup,
  Trigger,
  MessageTemplate,
  ClaimedContact,
  SupabaseConfig,
  ConnectionTestResult,
  DashboardStats
} from '../shared/types'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client

  const config = getSupabaseConfig()
  if (!config) {
    throw new Error('Configuração do Supabase ainda não foi definida.')
  }

  client = createClient(config.url, config.anonKey)
  return client
}

export function resetSupabaseClient(): void {
  client = null
}

export async function testSupabaseConnection(
  config: SupabaseConfig
): Promise<ConnectionTestResult> {
  try {
    const testClient = createClient(config.url, config.anonKey)
    const { error } = await testClient
      .from('whatsapp_groups')
      .select('*', { count: 'exact', head: true })

    if (error) {
      const detail = error.hint ? `${error.message} (${error.hint})` : error.message
      return { ok: false, message: detail }
    }

    return { ok: true, message: 'Conexão bem-sucedida.' }
  } catch (err) {
    return { ok: false, message: (err as Error).message }
  }
}

function startOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function buildLeadsByDay(
  rangeStart: Date,
  rows: { claimed_at: string }[]
): { date: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = startOfDay(new Date(row.claimed_at)).toDateString()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const days: { date: string; count: number }[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(rangeStart)
    day.setDate(day.getDate() + i)
    days.push({ date: day.toISOString(), count: counts.get(day.toDateString()) ?? 0 })
  }
  return days
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabase()

  const todayStart = startOfDay(new Date())
  const rangeStart = new Date(todayStart)
  rangeStart.setDate(rangeStart.getDate() - 6)

  const [
    totalLeadsRes,
    leadsTodayRes,
    messagesSentRes,
    activeGroupsRes,
    totalGroupsRes,
    recentLeadsRes,
    activeTriggersRes,
    activeTemplatesRes
  ] = await Promise.all([
    supabase.from('claimed_contacts').select('*', { count: 'exact', head: true }),
    supabase
      .from('claimed_contacts')
      .select('*', { count: 'exact', head: true })
      .gte('claimed_at', todayStart.toISOString()),
    supabase
      .from('claimed_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('message_sent', true),
    supabase.from('whatsapp_groups').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('whatsapp_groups').select('*', { count: 'exact', head: true }),
    supabase
      .from('claimed_contacts')
      .select('claimed_at')
      .gte('claimed_at', rangeStart.toISOString()),
    supabase.from('triggers').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase
      .from('message_templates')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
  ])

  for (const res of [
    totalLeadsRes,
    leadsTodayRes,
    messagesSentRes,
    activeGroupsRes,
    totalGroupsRes,
    recentLeadsRes,
    activeTriggersRes,
    activeTemplatesRes
  ]) {
    if (res.error) throw res.error
  }

  const totalLeads = totalLeadsRes.count ?? 0
  const messagesSent = messagesSentRes.count ?? 0

  return {
    totalLeads,
    leadsToday: leadsTodayRes.count ?? 0,
    messagesSent,
    messagesPending: totalLeads - messagesSent,
    activeGroups: activeGroupsRes.count ?? 0,
    totalGroups: totalGroupsRes.count ?? 0,
    activeTriggers: activeTriggersRes.count ?? 0,
    hasActiveTemplate: (activeTemplatesRes.count ?? 0) > 0,
    leadsByDay: buildLeadsByDay(rangeStart, recentLeadsRes.data ?? [])
  }
}

// --- Groups ---

export async function syncDiscoveredGroups(groups: { jid: string; name: string }[]): Promise<void> {
  if (groups.length === 0) return
  const supabase = getSupabase()
  const { error } = await supabase.from('whatsapp_groups').upsert(
    groups.map((g) => ({ jid: g.jid, name: g.name, updated_at: new Date().toISOString() })),
    { onConflict: 'jid', ignoreDuplicates: false }
  )
  if (error) throw error
}

export async function listGroups(): Promise<WhatsAppGroup[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('whatsapp_groups').select('*').order('name')
  if (error) throw error
  return data as WhatsAppGroup[]
}

export async function toggleGroup(jid: string, active: boolean): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('whatsapp_groups').update({ active }).eq('jid', jid)
  if (error) throw error
}

export async function listActiveGroupJids(): Promise<Set<string>> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('whatsapp_groups').select('jid').eq('active', true)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.jid as string))
}

// --- Triggers ---

export async function listTriggers(): Promise<Trigger[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('triggers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Trigger[]
}

export async function upsertTrigger(trigger: Partial<Trigger>): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('triggers').upsert(trigger)
  if (error) throw error
}

export async function deleteTrigger(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('triggers').delete().eq('id', id)
  if (error) throw error
}

export async function listActiveTriggers(): Promise<Trigger[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('triggers').select('*').eq('active', true)
  if (error) throw error
  return data as Trigger[]
}

// --- Templates ---

export async function listTemplates(): Promise<MessageTemplate[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as MessageTemplate[]
}

export async function upsertTemplate(template: Partial<MessageTemplate>): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('message_templates').upsert(template)
  if (error) throw error
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('message_templates').delete().eq('id', id)
  if (error) throw error
}

export async function setActiveTemplate(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error: deactivateError } = await supabase
    .from('message_templates')
    .update({ active: false })
    .neq('id', id)
  if (deactivateError) throw deactivateError

  const { error } = await supabase.from('message_templates').update({ active: true }).eq('id', id)
  if (error) throw error
}

export async function getActiveTemplate(): Promise<MessageTemplate | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('active', true)
    .maybeSingle()
  if (error) throw error
  return data as MessageTemplate | null
}

// --- Claimed contacts ---

export interface ClaimAttempt {
  messageId: string
  phoneJid: string
  groupJid: string
  groupName: string
  triggerText: string
}

/** Retorna true se este era um lead novo (inseriu), false se a mensagem já tinha sido processada. */
export async function claimContact(attempt: ClaimAttempt): Promise<boolean> {
  const supabase = getSupabase()
  const { error, data } = await supabase
    .from('claimed_contacts')
    .insert({
      message_id: attempt.messageId,
      phone_jid: attempt.phoneJid,
      group_jid: attempt.groupJid,
      group_name: attempt.groupName,
      trigger_text: attempt.triggerText
    })
    .select('id')

  if (error) {
    // Código 23505 = violação de unique constraint (message_id já processado)
    if (error.code === '23505') return false
    throw error
  }

  return (data?.length ?? 0) > 0
}

export async function markMessageSent(messageId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('claimed_contacts')
    .update({ message_sent: true })
    .eq('message_id', messageId)
  if (error) throw error
}

export async function listClaimedContacts(limit = 200): Promise<ClaimedContact[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('claimed_contacts')
    .select('*')
    .order('claimed_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as ClaimedContact[]
}
