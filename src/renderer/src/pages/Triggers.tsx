import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
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
import type { MessageTemplate, Trigger } from '../../../shared/types'

export function Triggers(): React.JSX.Element {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [matchType, setMatchType] = useState<'exact' | 'contains'>('exact')
  const [templateId, setTemplateId] = useState('')
  const [templateFeedback, setTemplateFeedback] = useState<Record<string, 'success' | 'error'>>({})

  async function load(): Promise<void> {
    const [triggersData, templatesData] = await Promise.all([
      window.api.triggers.list(),
      window.api.templates.list()
    ])
    setTriggers(triggersData)
    setTemplates(templatesData)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Electron IPC on mount
    void load()
  }, [])

  async function handleCreate(): Promise<void> {
    if (!text.trim() || !templateId) return
    await window.api.triggers.upsert({
      text: text.trim(),
      match_type: matchType,
      active: true,
      template_id: templateId
    })
    setText('')
    setMatchType('exact')
    setTemplateId('')
    setOpen(false)
    await load()
  }

  async function handleToggle(trigger: Trigger, active: boolean): Promise<void> {
    await window.api.triggers.upsert({ ...trigger, active })
    await load()
  }

  async function handleTemplateChange(trigger: Trigger, newTemplateId: string): Promise<void> {
    try {
      await window.api.triggers.upsert({ ...trigger, template_id: newTemplateId || null })
      await load()
      setTemplateFeedback((prev) => ({ ...prev, [trigger.id]: 'success' }))
    } catch (err) {
      console.error(err)
      setTemplateFeedback((prev) => ({ ...prev, [trigger.id]: 'error' }))
    } finally {
      setTimeout(() => {
        setTemplateFeedback((prev) => {
          const next = { ...prev }
          delete next[trigger.id]
          return next
        })
      }, 2500)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    await window.api.triggers.delete(id)
    await load()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-8">
            <div>
              <CardTitle>Mensagens gatilho</CardTitle>
              <CardDescription>
                Quando alguém mandar uma dessas mensagens num grupo ativo, o bot reage e manda o
                template vinculado a esse gatilho. Você pode ter vários gatilhos ativos ao mesmo
                tempo, cada um com seu próprio template.
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0" disabled={templates.length === 0}>
                  Novo gatilho
                </Button>
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
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="trigger-template">Template enviado no PV</Label>
                    <select
                      id="trigger-template"
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                    >
                      <option value="">Selecione um template...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!text.trim() || !templateId}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Cadastre um template na aba Templates antes de criar um gatilho — todo gatilho precisa
              de um template vinculado.
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Texto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Template</TableHead>
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                        value={trigger.template_id ?? ''}
                        onChange={(e) => handleTemplateChange(trigger, e.target.value)}
                      >
                        <option value="">Nenhum template ⚠️</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      {templateFeedback[trigger.id] === 'success' && (
                        <CheckCircle2
                          className="size-4 shrink-0 text-success"
                          aria-label="Template salvo"
                        />
                      )}
                      {templateFeedback[trigger.id] === 'error' && (
                        <XCircle
                          className="size-4 shrink-0 text-destructive"
                          aria-label="Falha ao salvar o template"
                        />
                      )}
                    </div>
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
