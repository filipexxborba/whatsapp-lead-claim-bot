import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import type { AuditAction, AuditEntityType, AuditLogEntry } from '../../../shared/types'

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  group: 'Grupo',
  trigger: 'Gatilho',
  template: 'Template',
  blacklist: 'Blacklist'
}

const ACTION_LABELS: Record<AuditAction, string> = {
  created: 'Criado',
  updated: 'Atualizado',
  deleted: 'Excluído'
}

const ACTION_VARIANTS: Record<AuditAction, 'success' | 'outline' | 'destructive'> = {
  created: 'success',
  updated: 'outline',
  deleted: 'destructive'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return '—'
  return JSON.stringify(value)
}

export function Audit(): React.JSX.Element {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function load(): Promise<void> {
    setLoading(true)
    const data = await window.api.audit.list()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Electron IPC on mount
    void load()
  }, [])

  const isInitialLoading = loading && entries.length === 0

  let content: React.JSX.Element
  if (isInitialLoading) {
    content = <p className="text-sm text-muted-foreground">Carregando...</p>
  } else if (entries.length === 0) {
    content = <p className="text-sm text-muted-foreground">Nenhum registro de auditoria ainda.</p>
  } else {
    content = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Antes</TableHead>
            <TableHead>Depois</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap">{formatDate(entry.created_at)}</TableCell>
              <TableCell>
                <Badge variant="outline">{ENTITY_LABELS[entry.entity_type]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={ACTION_VARIANTS[entry.action]}>{ACTION_LABELS[entry.action]}</Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <pre className="max-h-24 overflow-auto text-xs break-all whitespace-pre-wrap text-muted-foreground">
                  {formatJson(entry.before)}
                </pre>
              </TableCell>
              <TableCell className="max-w-xs">
                <pre className="max-h-24 overflow-auto text-xs break-all whitespace-pre-wrap">
                  {formatJson(entry.after)}
                </pre>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-8">
            <div>
              <CardTitle>Auditoria</CardTitle>
              <CardDescription>
                Histórico de mudanças em grupos, gatilhos, templates e blacklist — o que era antes e
                o que passou a ser.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={load} disabled={loading} className="shrink-0">
              {loading && <Loader2 className="animate-spin" />}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    </div>
  )
}
