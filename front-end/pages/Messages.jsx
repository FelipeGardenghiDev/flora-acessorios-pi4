import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../lib/AuthContext';

export default function Messages() {
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const carregarMensagens = async () => {
    try {
      const res = await fetch('/api/v1/messages');
      const data = await res.json();
      setMensagens(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMensagens();
  }, []);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: novaMensagem.trim(),
          user_name: user?.nome || 'Usuário Flora',
          user_email: user?.email || null
        })
      });

      if (!res.ok) throw new Error('Falha ao enviar mensagem');

      setNovaMensagem('');
      await carregarMensagens();
    } catch (error) {
      alert('Erro ao enviar mensagem: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Central de Mensagens</h1>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
          ) : mensagens.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Nenhuma mensagem recente.</p>
          ) : (
            mensagens.map(m => (
              <div key={m.id} className="rounded-xl border border-border/60 bg-secondary/30 p-3.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{m.user_name}</span>
                  <span>{new Date(m.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="mt-1.5 text-sm text-foreground leading-relaxed">{m.text}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleEnviar} className="flex gap-2 border-t border-border p-3">
          <Input
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Digite uma mensagem ou aviso interno..."
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !novaMensagem.trim()}>
            <Send className="mr-1 h-4 w-4" />
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}
