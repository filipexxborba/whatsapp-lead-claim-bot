import { useEffect, useState } from 'react'
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
import type { ClaimedContact } from '../../../shared/types'

const AUTO_REFRESH_INTERVAL_MS = 60_000

function formatPhone(jid: string): string {
  return jid.split('@')[0]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

export function Leads(): React.JSX.Element {
  const [contacts, setContacts] = useState<ClaimedContact[]>([])
  const [loading, setLoading] = useState(true)

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
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
              {contacts.map((contact) => (
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
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum lead reservado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
