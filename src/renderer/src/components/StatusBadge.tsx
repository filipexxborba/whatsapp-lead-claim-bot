import { Badge } from '@/components/ui/badge'
import type { BotStatus } from '../../../shared/types'

const STATUS_CONFIG: Record<
  BotStatus,
  { label: string; variant: 'success' | 'secondary' | 'destructive' | 'default' }
> = {
  connected: { label: 'Conectado', variant: 'success' },
  paused: { label: 'Pausado', variant: 'secondary' },
  connecting: { label: 'Conectando...', variant: 'default' },
  waiting_qr: { label: 'Aguardando QR Code', variant: 'default' },
  error: { label: 'Erro', variant: 'destructive' },
  disconnected: { label: 'Desconectado', variant: 'secondary' }
}

export function StatusBadge({ status }: { status: BotStatus }): React.JSX.Element {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
