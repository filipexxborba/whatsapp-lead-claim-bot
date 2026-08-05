import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { StatTile } from '@/components/StatTile'
import { LeadsChart } from '@/components/LeadsChart'
import { OnboardingChecklist } from '@/components/OnboardingChecklist'
import type { DashboardStats } from '../../../shared/types'

export function Dashboard({
  onNavigate
}: Readonly<{
  onNavigate: (page: 'groups' | 'triggers' | 'templates') => void
}>): React.JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    window.api.dashboard.getStats().then(setStats)
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      {stats && <OnboardingChecklist stats={stats} onNavigate={onNavigate} />}

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Leads totais" value={stats.totalLeads} />
          <StatTile label="Leads hoje" value={stats.leadsToday} />
          <StatTile
            label="DMs pendentes"
            value={stats.messagesPending}
            hint={`${stats.messagesSent} enviadas`}
          />
          <StatTile
            label="Grupos ativos"
            value={stats.activeGroups}
            hint={`de ${stats.totalGroups} monitorados`}
          />
        </div>
      )}

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Leads nos últimos 7 dias</CardTitle>
            <CardDescription>Quantidade de pessoas reservadas por dia.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsChart data={stats.leadsByDay} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
