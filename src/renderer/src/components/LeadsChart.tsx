const WEEKDAY_FORMAT = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })

export function LeadsChart({
  data
}: Readonly<{ data: { date: string; count: number }[] }>): React.JSX.Element {
  const max = Math.max(1, ...data.map((d) => d.count))
  const peakIndex = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0)
  const hasLeads = data.some((d) => d.count > 0)

  return (
    <div className="flex h-40 items-end gap-3">
      {data.map((day, i) => {
        const heightPct = day.count > 0 ? Math.max((day.count / max) * 100, 8) : 2
        const label = WEEKDAY_FORMAT.format(new Date(day.date)).replace('.', '')
        return (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-32 w-full items-end justify-center">
              {hasLeads && i === peakIndex && (
                <span className="absolute -top-5 text-xs font-medium text-foreground">
                  {day.count}
                </span>
              )}
              <div
                title={`${day.count} lead${day.count === 1 ? '' : 's'}`}
                className="w-full max-w-8 rounded-t bg-primary/80"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground capitalize">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
