import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog'
import type { BlacklistedNumber } from '../../../shared/types'

export function Blacklist(): React.JSX.Element {
  const [numbers, setNumbers] = useState<BlacklistedNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load(): Promise<void> {
    setLoading(true)
    setNumbers(await window.api.blacklist.list())
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Electron IPC on mount
    void load()
  }, [])

  function resetForm(): void {
    setPhoneNumber('')
    setNote('')
    setError(null)
  }

  async function handleCreate(): Promise<void> {
    if (!phoneNumber.trim()) return
    setSaving(true)
    setError(null)
    try {
      await window.api.blacklist.add(phoneNumber.trim(), note.trim() || null)
      resetForm()
      setOpen(false)
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setDeletingId(id)
    try {
      await window.api.blacklist.delete(id)
      await load()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-8">
            <div>
              <CardTitle>Números bloqueados</CardTitle>
              <CardDescription>
                Números nessa lista nunca recebem reação nem mensagem no PV, mesmo que mandem um
                gatilho num grupo ativo.
              </CardDescription>
            </div>
            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next)
                if (!next) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button className="shrink-0">Bloquear número</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bloquear número</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="blacklist-phone">Número</Label>
                    <Input
                      id="blacklist-phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="5511999999999"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="blacklist-note">Observação (opcional)</Label>
                    <Input
                      id="blacklist-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Motivo do bloqueio"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={saving || !phoneNumber.trim()}>
                    {saving && <Loader2 className="animate-spin" />}
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading && numbers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-20 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numbers.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.phone_number}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.note ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === entry.id}
                          onClick={() => handleDelete(entry.id)}
                        >
                          {deletingId === entry.id && <Loader2 className="animate-spin" />}
                          {deletingId === entry.id ? 'Removendo...' : 'Remover'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {numbers.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum número bloqueado ainda.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
