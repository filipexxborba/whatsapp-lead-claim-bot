import { Button } from '@/components/ui/button'
import type { BotStatusPayload } from '../../../shared/types'

export function BotControlButton({
  status
}: Readonly<{ status: BotStatusPayload }>): React.JSX.Element {
  const isPaused = status.status === 'paused'
  const isIdle = status.status === 'disconnected' || status.status === 'error'

  async function handleClick(): Promise<void> {
    if (isPaused) await window.api.bot.resume()
    else if (isIdle) await window.api.bot.start()
    else await window.api.bot.pause()
  }

  let label = 'Pausar'
  if (isPaused) label = 'Retomar'
  else if (isIdle) label = 'Iniciar bot'

  return (
    <Button className="w-full" onClick={handleClick}>
      {label}
    </Button>
  )
}
