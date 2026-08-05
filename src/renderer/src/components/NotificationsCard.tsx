import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { NotificationPreferences } from '../../../shared/types'

const OPTIONS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    key: 'leadClaimed',
    label: 'Novo lead reservado',
    description: 'Quando o bot reage a alguém que mandou o gatilho num grupo.'
  },
  {
    key: 'messageSent',
    label: 'Mensagem enviada',
    description: 'Quando a DM do template realmente sai para o lead.'
  },
  {
    key: 'botError',
    label: 'Bot com problema',
    description: 'Quando a conexão com o WhatsApp cai ou dá erro.'
  }
]

export function NotificationsCard(): React.JSX.Element {
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null)

  useEffect(() => {
    window.api.preferences.get().then((preferences) => setNotifications(preferences.notifications))
  }, [])

  async function handleToggle(key: keyof NotificationPreferences, value: boolean): Promise<void> {
    if (!notifications) return
    const next = { ...notifications, [key]: value }
    setNotifications(next)
    await window.api.preferences.set({ notifications: next })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>
          Avisos do sistema operacional quando o app não está em primeiro plano. Escolha quais você
          quer receber.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {notifications &&
          OPTIONS.map((option) => (
            <div key={option.key} className="flex items-center gap-3">
              <Switch
                id={`notif-${option.key}`}
                checked={notifications[option.key]}
                onCheckedChange={(checked) => handleToggle(option.key, checked)}
              />
              <div>
                <Label htmlFor={`notif-${option.key}`}>{option.label}</Label>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}
