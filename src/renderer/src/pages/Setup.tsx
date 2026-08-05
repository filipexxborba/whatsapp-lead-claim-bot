import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { SupabaseConfigForm } from '@/components/SupabaseConfigForm'

export function Setup({ onSaved }: { onSaved: () => void }): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Conectar ao Supabase</CardTitle>
          <CardDescription>
            Cole a URL e a chave anônima (anon key) do seu projeto Supabase. Esses dados ficam
            salvos apenas nesta máquina, criptografados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupabaseConfigForm saveLabel="Salvar e continuar" onSaved={onSaved} />
        </CardContent>
      </Card>
    </div>
  )
}
