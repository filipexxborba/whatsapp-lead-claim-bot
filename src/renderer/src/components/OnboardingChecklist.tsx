import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { DashboardStats } from '../../../shared/types'

type ConfigPage = 'groups' | 'triggers' | 'templates'

export function OnboardingChecklist({
  stats,
  onNavigate
}: Readonly<{
  stats: DashboardStats
  onNavigate: (page: ConfigPage) => void
}>): React.JSX.Element {
  const items: {
    key: string
    page: ConfigPage
    title: string
    description: string
    done: boolean
  }[] = [
    {
      key: 'groups',
      page: 'groups',
      title: 'Selecione os grupos monitorados',
      description: 'O bot só reage em grupos marcados como ativos na aba Grupos.',
      done: stats.activeGroups > 0
    },
    {
      key: 'triggers',
      page: 'triggers',
      title: 'Ative um gatilho',
      description: 'Define qual palavra ou frase o bot reconhece nas mensagens do grupo.',
      done: stats.activeTriggers > 0
    },
    {
      key: 'trigger-templates',
      page: 'triggers',
      title: 'Defina o template de cada gatilho ativo',
      description:
        'Cada gatilho envia sua própria mensagem no PV — associe um template a todos os que estiverem ativos, na aba Gatilhos.',
      done: stats.activeTriggers > 0 && stats.activeTriggersMissingTemplate === 0
    }
  ]

  const allDone = items.every((item) => item.done)

  if (allDone) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4">
          <CheckCircle2 className="size-5 shrink-0 text-success" />
          <p className="text-sm">
            Tudo certo! Grupos, gatilhos e template estão configurados e o bot está pronto para
            atender.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primeiros passos</CardTitle>
        <CardDescription>Confira se o bot está pronto para funcionar.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="flex items-start gap-3">
              {item.done ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            {!item.done && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => onNavigate(item.page)}
              >
                Configurar
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
