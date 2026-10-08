import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../lib/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
    }
  }, [user]);

  const handleAtualizar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMensagem('');
    try {
      setMensagem('Perfil atualizado com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>

      <div className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <p className="text-xs text-muted-foreground">E-mail</p>
          <p className="font-medium text-foreground">{user?.email || 'admin@flora.com'}</p>
        </div>

        <form onSubmit={handleAtualizar} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome Completo</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          {mensagem && <p className="text-xs text-emerald-600 font-medium">{mensagem}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </div>
    </div>
  );
}
