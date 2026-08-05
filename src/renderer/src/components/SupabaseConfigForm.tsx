import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function SupabaseConfigForm({
  initialUrl = '',
  initialAnonKey = '',
  saveLabel,
  onSaved
}: Readonly<{
  initialUrl?: string
  initialAnonKey?: string
  saveLabel: string
  onSaved: () => void
}>): React.JSX.Element {
  const [url, setUrl] = useState(initialUrl)
  const [anonKey, setAnonKey] = useState(initialAnonKey)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  function validate(): boolean {
    if (!url.trim() || !anonKey.trim()) {
      setError('Preencha a URL e a chave anônima do projeto Supabase.')
      return false
    }
    setError(null)
    return true
  }

  async function handleTest(): Promise<void> {
    setTestResult(null)
    if (!validate()) return
    setTesting(true)
    try {
      const result = await window.api.config.test({ url: url.trim(), anonKey: anonKey.trim() })
      setTestResult(result)
    } catch (err) {
      setTestResult({ ok: false, message: (err as Error).message })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave(): Promise<void> {
    if (!validate()) return
    setSaving(true)
    try {
      await window.api.config.set({ url: url.trim(), anonKey: anonKey.trim() })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="supabase-url">Project URL</Label>
        <Input
          id="supabase-url"
          placeholder="https://xxxxxxxx.supabase.co"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="supabase-key">Anon key</Label>
        <Input
          id="supabase-key"
          type="password"
          placeholder="eyJhbGciOi..."
          value={anonKey}
          onChange={(e) => setAnonKey(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {testResult && (
        <p className={cn('text-sm', testResult.ok ? 'text-emerald-600' : 'text-destructive')}>
          {testResult.ok ? 'Conexão bem-sucedida.' : testResult.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleTest} disabled={testing}>
          {testing ? 'Testando...' : 'Testar conexão'}
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : saveLabel}
        </Button>
      </div>
    </div>
  )
}
