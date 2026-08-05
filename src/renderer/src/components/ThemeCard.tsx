import { useEffect, useState } from 'react'
import { Monitor, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ThemePreference } from '../../../shared/types'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon }
]

export function ThemeCard(): React.JSX.Element {
  const [theme, setTheme] = useState<ThemePreference | null>(null)

  useEffect(() => {
    window.api.preferences.get().then((preferences) => setTheme(preferences.theme))
  }, [])

  async function handleChange(value: ThemePreference): Promise<void> {
    setTheme(value)
    await window.api.preferences.set({ theme: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>Escolha o tema da interface. Por padrão segue o sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="inline-flex rounded-md border p-1">
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={theme === value ? 'default' : 'ghost'}
              className={cn('gap-1.5', theme !== value && 'text-muted-foreground')}
              onClick={() => handleChange(value)}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
