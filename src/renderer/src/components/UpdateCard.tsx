import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useUpdateStatus } from '@/hooks/useUpdateStatus'
import { cn } from '@/lib/utils'

const RELEASES_URL = 'https://github.com/filipexxborba/whatsapp-lead-claim-bot/releases/latest'

function statusLabel(status: ReturnType<typeof useUpdateStatus>): string {
  switch (status.status) {
    case 'checking':
      return 'Verificando atualizações...'
    case 'available':
      return `Nova versão ${status.version ?? ''} encontrada, baixando...`
    case 'downloading':
      return `Baixando atualização... ${status.progressPercent ?? 0}%`
    case 'downloaded':
      return `Atualização ${status.version ?? ''} pronta para instalar.`
    case 'not-available':
      return 'Você já está na versão mais recente.'
    case 'error':
      return status.errorMessage ?? 'Falha ao verificar atualizações.'
    default:
      return 'Nenhuma verificação feita ainda nesta sessão.'
  }
}

export function UpdateCard(): React.JSX.Element {
  const status = useUpdateStatus()
  const [appVersion, setAppVersion] = useState<string | null>(null)
  const isBusy = status.status === 'checking' || status.status === 'downloading'

  useEffect(() => {
    window.api.updater.getAppVersion().then(setAppVersion)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atualizações</CardTitle>
        <CardDescription>
          {appVersion ? `Versão instalada: ${appVersion}` : 'Carregando versão...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p
          className={cn(
            'text-sm',
            status.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {statusLabel(status)}
        </p>
        <div className="flex gap-2">
          {status.status === 'downloaded' ? (
            <Button onClick={() => window.api.updater.installNow()}>
              Reiniciar e atualizar agora
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => window.api.updater.checkNow()}
            >
              Verificar atualizações
            </Button>
          )}
          {status.status === 'error' && (
            <Button variant="outline" asChild>
              <a href={RELEASES_URL} target="_blank" rel="noreferrer">
                Baixar manualmente
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
