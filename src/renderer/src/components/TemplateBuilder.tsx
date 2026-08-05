import { useMemo, useRef, useState } from 'react'
import { Bold, Italic, Strikethrough, Code, Braces, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog'

const VARIABLE_SAMPLES: Record<string, string> = {
  gatilho: 'EU QUERO'
}

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function renderPreviewHtml(body: string): string {
  const withVars = body.replaceAll(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_match, key: string) => VARIABLE_SAMPLES[key] ?? key
  )
  let html = escapeHtml(withVars)
  html = html.replaceAll(/```([^`]+)```/g, '<code>$1</code>')
  html = html.replaceAll(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
  html = html.replaceAll(/_([^_\n]+)_/g, '<em>$1</em>')
  html = html.replaceAll(/~([^~\n]+)~/g, '<s>$1</s>')
  return html.replaceAll('\n', '<br/>')
}

type Marker = { prefix: string; suffix: string }

const FORMAT_BUTTONS: { icon: typeof Bold; label: string; marker: Marker }[] = [
  { icon: Bold, label: 'Negrito', marker: { prefix: '*', suffix: '*' } },
  { icon: Italic, label: 'Itálico', marker: { prefix: '_', suffix: '_' } },
  { icon: Strikethrough, label: 'Riscado', marker: { prefix: '~', suffix: '~' } },
  { icon: Code, label: 'Monoespaçado', marker: { prefix: '```', suffix: '```' } }
]

export function TemplateBuilder({
  onCreated
}: Readonly<{ onCreated: () => Promise<void> | void }>): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const previewHtml = useMemo(() => renderPreviewHtml(body), [body])
  const isEmpty = body.trim().length === 0

  function reset(): void {
    setName('')
    setBody('')
  }

  function applyToSelection({ prefix, suffix }: Marker): void {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = body.slice(start, end)
    const next = body.slice(0, start) + prefix + selected + suffix + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = selected ? end + prefix.length + suffix.length : start + prefix.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  function insertVariable(token: string): void {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = body.slice(0, start) + token + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + token.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  async function handleCreate(): Promise<void> {
    if (!name.trim() || !body.trim()) return
    setSaving(true)
    try {
      await window.api.templates.upsert({ name: name.trim(), body: body.trim() })
      reset()
      setOpen(false)
      await onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>Novo template</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Construtor de template</DialogTitle>
          <DialogDescription>
            Monte a mensagem que o bot envia no PV e acompanhe o resultado em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-name">Nome</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abordagem padrão"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="template-body">Mensagem</Label>
                <span className="text-xs text-muted-foreground">{body.length} caracteres</span>
              </div>

              <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-1">
                {FORMAT_BUTTONS.map(({ icon: Icon, label, marker }) => (
                  <Button
                    key={label}
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={label}
                    aria-label={label}
                    onClick={() => applyToSelection(marker)}
                  >
                    <Icon />
                  </Button>
                ))}
                <div className="mx-1 h-5 w-px bg-border" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => insertVariable('{{gatilho}}')}
                >
                  <Braces className="size-3.5" />
                  gatilho
                </Button>
              </div>

              <Textarea
                id="template-body"
                ref={textareaRef}
                rows={9}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='Oi! Vi que você chamou "{{gatilho}}" no grupo, vou te passar os detalhes da promoção por aqui :)'
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Selecione um trecho e use os botões acima para formatar, ou insira{' '}
                <code className="rounded bg-muted px-1">{'{{gatilho}}'}</code> para incluir o texto
                que a pessoa mandou no grupo.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Pré-visualização</Label>
            <div className="flex min-h-64 flex-col justify-end rounded-lg bg-[#e5ddd5] p-4 dark:bg-neutral-800">
              {isEmpty ? (
                <p className="text-center text-xs text-muted-foreground">
                  Comece a digitar para ver como a mensagem chega no WhatsApp.
                </p>
              ) : (
                <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm wrap-break-word text-neutral-900 shadow-sm dark:bg-emerald-900 dark:text-emerald-50">
                  <span
                    className="whitespace-pre-wrap"

                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                  <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-neutral-500 dark:text-emerald-200/70">
                    agora
                    <CheckCheck className="size-3.5 text-sky-500" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={saving || !name.trim() || !body.trim()}>
            {saving ? 'Salvando...' : 'Salvar template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
