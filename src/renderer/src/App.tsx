import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Zap,
  MessageSquareText,
  Target,
  Settings as SettingsIcon,
  ScrollText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBotStatus } from '@/hooks/useBotStatus'
import { StatusBadge } from '@/components/StatusBadge'
import { BotControlButton } from '@/components/BotControlButton'
import { Setup } from '@/pages/Setup'
import { Dashboard } from '@/pages/Dashboard'
import { Groups } from '@/pages/Groups'
import { Triggers } from '@/pages/Triggers'
import { Templates } from '@/pages/Templates'
import { Leads } from '@/pages/Leads'
import { Settings } from '@/pages/Settings'
import { Audit } from '@/pages/Audit'
import appIcon from '@/assets/icon.png'

type Page = 'dashboard' | 'groups' | 'triggers' | 'templates' | 'leads' | 'settings' | 'audit'

interface NavItem {
  id: Page
  label: string
  icon: LucideIcon
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Geral',
    items: [
      { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
      { id: 'leads', label: 'Leads', icon: Target }
    ]
  },
  {
    label: 'Configuração do bot',
    items: [
      { id: 'groups', label: 'Grupos', icon: Users },
      { id: 'triggers', label: 'Gatilhos', icon: Zap },
      { id: 'templates', label: 'Templates', icon: MessageSquareText }
    ]
  },
  {
    label: 'Sistema',
    items: [{ id: 'settings', label: 'Configurações', icon: SettingsIcon }]
  }
]

function App(): React.JSX.Element {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [auditLogEnabled, setAuditLogEnabled] = useState(false)
  const status = useBotStatus()

  useEffect(() => {
    window.api.config.has().then(setConfigured)
    window.api.preferences
      .get()
      .then((preferences) => setAuditLogEnabled(preferences.auditLogEnabled))
  }, [])

  async function handleAuditLogEnabledChange(enabled: boolean): Promise<void> {
    setAuditLogEnabled(enabled)
    if (!enabled && page === 'audit') setPage('dashboard')
    await window.api.preferences.set({ auditLogEnabled: enabled })
  }

  const navGroups = NAV_GROUPS.map((group) =>
    group.label === 'Sistema' && auditLogEnabled
      ? {
          ...group,
          items: [...group.items, { id: 'audit' as const, label: 'Auditoria', icon: ScrollText }]
        }
      : group
  )

  if (configured === null) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!configured) {
    return <Setup onSaved={() => setConfigured(true)} />
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 flex-col border-r bg-card">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <img src={appIcon} alt="" className="size-8 rounded-lg" />
            <p className="text-sm font-semibold">Lead Claim Bot</p>
          </div>
          <div className="mt-2">
            <StatusBadge status={status.status} />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPage(item.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                      page === item.id && 'bg-accent font-medium'
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="border-t p-2">
          <BotControlButton status={status} />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'groups' && <Groups />}
        {page === 'triggers' && <Triggers />}
        {page === 'templates' && <Templates />}
        {page === 'leads' && <Leads />}
        {page === 'settings' && (
          <Settings
            status={status}
            auditLogEnabled={auditLogEnabled}
            onAuditLogEnabledChange={handleAuditLogEnabledChange}
          />
        )}
        {page === 'audit' && auditLogEnabled && <Audit />}
      </main>
    </div>
  )
}

export default App
