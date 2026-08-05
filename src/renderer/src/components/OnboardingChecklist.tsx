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
  const items: { id: ConfigPage; title: string; description: string; done: boolean }[] = [
    {
      id: 'groups',
      title: 'Selecione os grupos monitorados',
      description: 'O bot só reage em grupos marcados como ativos na aba Grupos.',
      done: stats.activeGroups > 0
    },
    {
      id: 'triggers',
      title: 'Ative um gatilho',
      description: 'Define qual palavra ou frase o bot reconhece nas mensagens do grupo.',
      done: stats.activeTriggers > 0
    },
    {
      id: 'templates',
      title: 'Ative um template de mensagem',
      description: 'É a mensagem enviada no PV para quem for abordado.',
      done: stats.hasActiveTemplate
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
            key={item.id}
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
                onClick={() => onNavigate(item.id)}
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
