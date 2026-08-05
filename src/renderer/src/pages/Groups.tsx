import { useEffect, useMemo, useState } from 'react'
import { Switch } from '@/components/ui/switch'
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
import type { WhatsAppGroup } from '../../../shared/types'

export function Groups(): React.JSX.Element {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load(): Promise<void> {
    setLoading(true)
    const data = await window.api.groups.list()
    setGroups(data)
    setLoading(false)
  }

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term ? groups.filter((g) => g.name.toLowerCase().includes(term)) : groups
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [groups, search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Electron IPC on mount
    void load()
  }, [])

  async function handleToggle(jid: string, active: boolean): Promise<void> {
    setGroups((prev) => prev.map((g) => (g.jid === jid ? { ...g, active } : g)))
    await window.api.groups.toggle(jid, active)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-8">
            <div>
              <CardTitle>Grupos monitorados</CardTitle>
              <CardDescription>
                Ative apenas os grupos de promoção onde o bot deve reagir e abordar os interessados.
                A lista é preenchida automaticamente quando o WhatsApp conecta.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={load} disabled={loading} className="shrink-0">
              Atualizar lista
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum grupo encontrado ainda. Conecte o bot na aba Painel para descobrir os grupos
              automaticamente.
            </p>
          ) : (
            <>
              <Input
                placeholder="Buscar grupo pelo nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              {visibleGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum grupo encontrado para &quot;{search}&quot;.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="w-32 text-right">Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleGroups.map((group) => (
                      <TableRow key={group.jid}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={group.active}
                            onCheckedChange={(checked) => handleToggle(group.jid, checked)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
