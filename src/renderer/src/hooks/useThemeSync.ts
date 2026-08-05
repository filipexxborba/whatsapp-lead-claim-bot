import { useEffect } from 'react'

export function useThemeSync(): void {
  useEffect(() => {
    const unsubscribe = window.api.theme.onResolvedChanged((isDark) => {
      document.documentElement.classList.toggle('dark', isDark)
    })
    return unsubscribe
  }, [])
}
