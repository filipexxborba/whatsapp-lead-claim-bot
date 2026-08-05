import { useEffect, useState } from 'react'
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

type Page = 'dashboard' | 'groups' | 'triggers' | 'templates' | 'leads' | 'settings'

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Painel' },
  { id: 'groups', label: 'Grupos' },
  { id: 'triggers', label: 'Gatilhos' },
  { id: 'templates', label: 'Templates' },
  { id: 'leads', label: 'Leads' },
  { id: 'settings', label: 'Configurações' }
]

function App(): React.JSX.Element {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const status = useBotStatus()

  useEffect(() => {
    window.api.config.has().then(setConfigured)
  }, [])

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
          <p className="text-sm font-semibold">Lead Claim Bot</p>
          <div className="mt-2">
            <StatusBadge status={status.status} />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              className={cn(
                'rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                page === item.id && 'bg-accent font-medium'
              )}
            >
              {item.label}
            </button>
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
        {page === 'settings' && <Settings status={status} />}
      </main>
    </div>
  )
}

export default App
