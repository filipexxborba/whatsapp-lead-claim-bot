import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { TemplateBuilder } from '@/components/TemplateBuilder'
import type { MessageTemplate } from '../../../shared/types'

export function Templates(): React.JSX.Element {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])

  async function load(): Promise<void> {
    setTemplates(await window.api.templates.list())
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Electron IPC on mount
    void load()
  }, [])

  async function handleDelete(id: string): Promise<void> {
    await window.api.templates.delete(id)
    await load()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates de mensagem</CardTitle>
              <CardDescription>
                Vincule cada template a um gatilho na aba Gatilhos — cada gatilho envia o template
                que estiver associado a ele. Use{' '}
                <code className="rounded bg-muted px-1">{'{{gatilho}}'}</code> para incluir o texto
                que a pessoa mandou no grupo.
              </CardDescription>
            </div>
            <TemplateBuilder onCreated={load} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {templates.map((template) => (
            <div key={template.id} className="flex flex-col gap-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{template.name}</span>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
                  Remover
                </Button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{template.body}</p>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum template cadastrado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
