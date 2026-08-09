import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function LaunchAtLoginCard(): React.JSX.Element {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.system.getLaunchAtLogin().then(setEnabled)
  }, [])

  async function handleChange(value: boolean): Promise<void> {
    const previous = enabled
    setEnabled(value)
    setSaving(true)
    try {
      await window.api.system.setLaunchAtLogin(value)
    } catch (err) {
      console.error(err)
      setEnabled(previous)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicialização</CardTitle>
        <CardDescription>
          Abre o app sozinho (minimizado na bandeja) quando o computador liga — importante pra não
          deixar o bot esquecido offline depois de um reinício.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Switch
            id="launch-at-login"
            checked={enabled ?? false}
            disabled={enabled === null || saving}
            onCheckedChange={handleChange}
          />
          <Label htmlFor="launch-at-login">Abrir automaticamente ao ligar o computador</Label>
        </div>
      </CardContent>
    </Card>
  )
}
