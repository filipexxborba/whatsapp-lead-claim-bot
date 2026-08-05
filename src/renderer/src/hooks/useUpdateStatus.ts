import { useEffect, useState } from 'react'
import type { UpdateStatusPayload } from '../../../shared/types'

export function useUpdateStatus(): UpdateStatusPayload {
  const [status, setStatus] = useState<UpdateStatusPayload>({ status: 'idle' })

  useEffect(() => {
    window.api.updater.getStatus().then(setStatus)
    const unsubscribe = window.api.updater.onStatusChanged(setStatus)
    return unsubscribe
  }, [])

  return status
}
