import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  if (minutes % 1440 === 0) {
    const days = minutes / 1440
    return `${days} dia${days === 1 ? '' : 's'}`
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `${hours} hora${hours === 1 ? '' : 's'}`
  }
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
}

export function MessageCooldownCard(): React.JSX.Element {
  const [minutes, setMinutes] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.preferences
      .get()
      .then((preferences) => setMinutes(preferences.messageCooldownMinutes))
  }, [])

  async function handleSave(): Promise<void> {
    if (minutes === null || !Number.isFinite(minutes) || minutes < 1) return
    setSaved(false)
    await window.api.preferences.set({ messageCooldownMinutes: minutes })
    setSaved(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intervalo entre mensagens</CardTitle>
        <CardDescription>
          Se a mesma pessoa disparar o gatilho de novo, o bot reage do mesmo jeito, mas só manda
          outra DM depois desse tempo desde a última mensagem enviada a ela.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="cooldown-minutes" className="sr-only">
            Minutos
          </Label>
          <Input
            id="cooldown-minutes"
            type="number"
            min={1}
            className="w-24"
            value={minutes ?? ''}
            onChange={(e) => setMinutes(e.target.value === '' ? null : Number(e.target.value))}
          />
          <span className="text-sm text-muted-foreground">
            minutos{minutes ? ` (${formatMinutes(minutes)})` : ''}
          </span>
          <Button size="sm" variant="outline" onClick={handleSave}>
            Salvar
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">
            Um intervalo muito curto faz o mesmo número receber a mesma mensagem várias vezes em
            pouco tempo — é exatamente o padrão que faz o WhatsApp marcar um número como spam e
            baní-lo. O padrão (24h) já é pensado pra ser seguro; diminua por sua conta e risco.
          </p>
        </div>

        {saved && <p className="text-xs text-success">Salvo.</p>}
      </CardContent>
    </Card>
  )
}
