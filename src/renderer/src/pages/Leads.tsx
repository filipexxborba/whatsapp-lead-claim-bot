import { useEffect, useState } from 'react'
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
import type { ClaimedContact } from '../../../shared/types'

function formatPhone(jid: string): string {
  return jid.split('@')[0]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

export function Leads(): React.JSX.Element {
  const [contacts, setContacts] = useState<ClaimedContact[]>([])

  useEffect(() => {
    window.api.contacts.list().then(setContacts)
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Leads reservados</CardTitle>
          <CardDescription>
            Histórico de quem já foi marcado como seu e recebeu (ou vai receber) a abordagem.
          </CardDescription>
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
