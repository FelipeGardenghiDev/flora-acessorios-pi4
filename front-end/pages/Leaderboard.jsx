import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

const medalClass = ['bg-[#ffd166]/20 text-[#b8860b]', 'bg-secondary text-secondary-foreground', 'bg-[#ff8db8]/15 text-[#ff8db8]'];

export default function Leaderboard() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/leaderboard');
        const data = await res.json();
        setRanking(data || []);
      } catch (error) {
        console.error('Erro ao carregar o leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarLeaderboard();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando ranking...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ranking de Vendedores</h1>

      {ranking.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhuma venda registrada ainda para calcular o ranking.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ranking.map((item, idx) => (
            <div key={item.nome} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-heading text-lg font-bold ${medalClass[idx] || 'bg-muted text-muted-foreground'}`}>
                {idx < 3 ? <Trophy className="h-6 w-6" /> : `#${idx + 1}`}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-base font-bold text-foreground">{item.nome}</p>
                <p className="text-xs text-muted-foreground">Total em Vendas</p>
                <p className="font-heading text-lg font-extrabold text-primary">R$ {Number(item.total).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
