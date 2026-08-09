import { useEffect, useMemo, useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import type { ClaimedContact } from '../../../shared/types'

const AUTO_REFRESH_INTERVAL_MS = 60_000

type StatusFilter = 'all' | 'sent' | 'pending'

function formatPhone(jid: string): string {
  return jid.split('@')[0]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

function csvField(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function exportCsv(contacts: ClaimedContact[]): void {
  const header = ['Telefone', 'Grupo', 'Gatilho', 'Quando', 'DM enviada']
  const rows = contacts.map((contact) =>
    [
      formatPhone(contact.phone_jid),
      contact.group_name,
      contact.trigger_text,
      formatDate(contact.claimed_at),
      contact.message_sent ? 'Sim' : 'Pendente'
    ]
      .map(csvField)
      .join(',')
  )
  // BOM: garante que o Excel abra os acentos em UTF-8 corretamente.
  const csv = '\uFEFF' + [header.map(csvField).join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function Leads(): React.JSX.Element {
  const [contacts, setContacts] = useState<ClaimedContact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  async function load(): Promise<void> {
    setLoading(true)
    const data = await window.api.contacts.list()
    setContacts(data)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Electron IPC on mount
    void load()
    const interval = setInterval(() => void load(), AUTO_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const visibleContacts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return contacts.filter((contact) => {
      if (statusFilter === 'sent' && !contact.message_sent) return false
      if (statusFilter === 'pending' && contact.message_sent) return false
      if (!term) return true
      return (
        formatPhone(contact.phone_jid).includes(term) ||
        contact.group_name?.toLowerCase().includes(term) ||
        contact.trigger_text?.toLowerCase().includes(term)
      )
    })
  }, [contacts, search, statusFilter])

  const isInitialLoading = loading && contacts.length === 0

  let content: React.JSX.Element
  if (isInitialLoading) {
    content = <p className="text-sm text-muted-foreground">Carregando...</p>
  } else if (contacts.length === 0) {
    content = <p className="text-sm text-muted-foreground">Nenhum lead reservado ainda.</p>
  } else {
    content = (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por telefone, grupo ou gatilho..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">Todos</option>
            <option value="sent">DM enviada</option>
            <option value="pending">Pendente</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            disabled={visibleContacts.length === 0}
            onClick={() => exportCsv(visibleContacts)}
          >
            <Download className="size-3.5" />
            Exportar CSV
          </Button>
        </div>

        {visibleContacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lead encontrado para esse filtro.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Telefone</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead className="text-right">DM enviada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{formatPhone(contact.phone_jid)}</TableCell>
                  <TableCell>{contact.group_name}</TableCell>
                  <TableCell>{contact.trigger_text}</TableCell>
                  <TableCell>{formatDate(contact.claimed_at)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={contact.message_sent ? 'success' : 'secondary'}>
                      {contact.message_sent ? 'Sim' : 'Pendente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-8">
            <div>
              <CardTitle>Leads reservados</CardTitle>
              <CardDescription>
                Histórico de quem já foi marcado como seu e recebeu (ou vai receber) a abordagem.
                Atualiza sozinho a cada minuto.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={load} disabled={loading} className="shrink-0">
              {loading && <Loader2 className="animate-spin" />}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{content}</CardContent>
      </Card>
    </div>
  )
}
