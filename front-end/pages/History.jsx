import React, { useState, useEffect } from 'react';

export default function History() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarHistorico() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/historico');
        const data = await res.json();

        const formatado = (data || []).map(v => ({
          ID: v.id,
          VENDEDOR: v.vendedor,
          CATEGORIA: v.categoria,
          NOME: v.produto,
          VALOR: v.valor,
          DATA_VENDA: v.data
        }));

        setHistorico(formatado);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarHistorico();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando histórico...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Histórico de Transações</h1>

      {historico.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum registro encontrado no histórico.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Código</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Vendedor</th>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historico.map(v => (
                  <tr key={v.ID} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{v.ID}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(v.DATA_VENDA).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">{v.VENDEDOR}</td>
                    <td className="px-5 py-3 text-foreground">{v.NOME}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                        {v.CATEGORIA}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-heading font-bold text-foreground">
                      R$ {Number(v.VALOR).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
