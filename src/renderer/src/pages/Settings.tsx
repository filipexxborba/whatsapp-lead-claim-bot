import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { SupabaseConfigForm } from '@/components/SupabaseConfigForm'
import { UpdateCard } from '@/components/UpdateCard'
import type { BotStatusPayload, SupabaseConfig } from '../../../shared/types'

export function Settings({
  status,
  auditLogEnabled,
  onAuditLogEnabledChange
}: Readonly<{
  status: BotStatusPayload
  auditLogEnabled: boolean
  onAuditLogEnabledChange: (enabled: boolean) => void
}>): React.JSX.Element {
  const [config, setConfig] = useState<SupabaseConfig | null>(null)
  const [saved, setSaved] = useState(false)
  const isIdle = status.status === 'disconnected' || status.status === 'error'

  useEffect(() => {
    window.api.config.get().then(setConfig)
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status do bot</CardTitle>
                <CardDescription>
                  {status.connectedNumber
                    ? `Conectado ao número ${status.connectedNumber}`
                    : 'Nenhum número conectado ainda'}
                </CardDescription>
              </div>
              <StatusBadge status={status.status} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {status.status === 'waiting_qr' && status.qr && (
              <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Escaneie este QR Code no WhatsApp (Aparelhos conectados) do número que vai atender
                  os leads:
                </p>
                <img src={status.qr} alt="QR Code do WhatsApp" className="size-56" />
              </div>
            )}

            {status.status === 'error' && status.errorMessage && (
              <p className="text-sm text-destructive">{status.errorMessage}</p>
            )}

            {!isIdle && (
              <div>
                <Button variant="outline" onClick={() => window.api.bot.logout()}>
                  Desconectar número (novo QR)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conexão com o Supabase</CardTitle>
            <CardDescription>
              Edite a URL e a chave anônima (anon key) do projeto Supabase usado por este bot. Teste
              a conexão antes de salvar para confirmar que as credenciais e as permissões estão
              corretas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config === null ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <SupabaseConfigForm
                initialUrl={config.url}
                initialAnonKey={config.anonKey}
                saveLabel="Salvar alterações"
                onSaved={() => setSaved(true)}
              />
            )}
            {saved && (
              <p className="mt-4 text-sm text-emerald-600">Configuração salva com sucesso.</p>
            )}
          </CardContent>
        </Card>

        <UpdateCard />

        <Card>
          <CardHeader>
            <CardTitle>Auditoria</CardTitle>
            <CardDescription>
              Registra mudanças em grupos, gatilhos e templates. Desativado por padrão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="audit-log-enabled"
                checked={auditLogEnabled}
                onCheckedChange={onAuditLogEnabledChange}
              />
              <Label htmlFor="audit-log-enabled">Ativar tela de Auditoria</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
