export function StatTile({
  label,
  value,
  hint
}: Readonly<{ label: string; value: string | number; hint?: string }>): React.JSX.Element {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
