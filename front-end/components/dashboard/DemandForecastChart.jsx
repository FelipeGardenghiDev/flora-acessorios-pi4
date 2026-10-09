import { TrendingUp, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { buildForecastSeries } from '@/lib/forecast';

export default function DemandForecastChart({ product, records }) {
  const series = buildForecastSeries(records.filter(r => r.product_sku === product.sku), 30, product.sku);
  return (
    <div className="flex h-full min-h-[12rem] w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-heading text-sm font-bold text-foreground">{product.name}</h3>
            <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Sparkles className="h-2.5 w-2.5" /> MLP
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{product.sku} • {product.category}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${series.slope >= 0 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/15 text-destructive'}`}><TrendingUp className={`h-3 w-3 ${series.slope < 0 ? 'rotate-180' : ''}`} />{series.slope >= 0 ? 'Tendência alta' : 'Tendência queda'}</span>
      </div>
      {series.points.length <= 1 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center text-xs text-muted-foreground">Sem dados históricos</div>
      ) : (
        <div className="min-h-0 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={100}>
          <LineChart data={series.points} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={32} />
            <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
            <Line type="monotone" dataKey="actual" name="Histórico Real" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" name="Previsão MLP (t+1..t+7)" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}