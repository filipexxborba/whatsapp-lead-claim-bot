import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BotStatusPayload } from '../../../shared/types'

export function BotControlButton({
  status
}: Readonly<{ status: BotStatusPayload }>): React.JSX.Element {
  const [pending, setPending] = useState(false)
  const isPaused = status.status === 'paused'
  const isIdle = status.status === 'disconnected' || status.status === 'error'

  async function handleClick(): Promise<void> {
    setPending(true)
    try {
      if (isPaused) await window.api.bot.resume()
      else if (isIdle) await window.api.bot.start()
      else await window.api.bot.pause()
    } finally {
      setPending(false)
    }
  }

  let label = 'Pausar'
  if (isPaused) label = 'Retomar'
  else if (isIdle) label = 'Iniciar bot'

  return (
    <Button className="w-full" onClick={handleClick} disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? 'Aguarde...' : label}
    </Button>
  )
}
