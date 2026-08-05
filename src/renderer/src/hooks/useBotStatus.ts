import { useEffect, useState } from 'react'
import type { BotStatusPayload } from '../../../shared/types'

export function useBotStatus(): BotStatusPayload {
  const [status, setStatus] = useState<BotStatusPayload>({ status: 'disconnected' })

  useEffect(() => {
    window.api.bot.getStatus().then(setStatus)
    const unsubscribe = window.api.bot.onStatusChanged(setStatus)
    return unsubscribe
  }, [])

  return status
}
