import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import type { Trigger } from '../../../shared/types'

export function Triggers(): React.JSX.Element {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [matchType, setMatchType] = useState<'exact' | 'contains'>('exact')

  async function load(): Promise<void> {
    setTriggers(await window.api.triggers.list())
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Electron IPC on mount
    void load()
  }, [])

  async function handleCreate(): Promise<void> {
    if (!text.trim()) return
    await window.api.triggers.upsert({ text: text.trim(), match_type: matchType, active: true })
    setText('')
    setMatchType('exact')
    setOpen(false)
    await load()
  }

  async function handleToggle(trigger: Trigger, active: boolean): Promise<void> {
    await window.api.triggers.upsert({ ...trigger, active })
    await load()
  }

  async function handleDelete(id: string): Promise<void> {
    await window.api.triggers.delete(id)
    await load()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mensagens gatilho</CardTitle>
              <CardDescription>
                Quando alguém mandar uma dessas mensagens num grupo ativo, o bot reage e manda a DM.
                Comece com &quot;EU QUERO&quot; e adicione outras quando quiser.
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Novo gatilho</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo gatilho</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="trigger-text">Texto</Label>
                    <Input
                      id="trigger-text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="EU QUERO"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="trigger-match">Tipo de correspondência</Label>
                    <select
                      id="trigger-match"
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      value={matchType}
                      onChange={(e) => setMatchType(e.target.value as 'exact' | 'contains')}
                    >
                      <option value="exact">Exata (mensagem igual ao texto)</option>
                      <option value="contains">Contém (texto em qualquer parte da mensagem)</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Texto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-24 text-right">Ativo</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {triggers.map((trigger) => (
                <TableRow key={trigger.id}>
                  <TableCell className="font-medium">{trigger.text}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {trigger.match_type === 'exact' ? 'Exata' : 'Contém'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={trigger.active}
                      onCheckedChange={(checked) => handleToggle(trigger, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(trigger.id)}>
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
