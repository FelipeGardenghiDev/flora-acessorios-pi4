import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    setErro('');

    try {
      if (!token) {
        throw new Error('Token de redefinição não encontrado na URL.');
      }

      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha.');
      }

      setMensagem(data.message || 'Senha alterada com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErro(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Redefinir Senha"
      subtitle="Escolha uma nova senha para sua conta"
    >
      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres (letra e número)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-[11px] text-muted-foreground">
            A senha precisa ter pelo menos oito caracteres, incluindo uma letra e um número.
          </p>
        </div>

        {mensagem && <p className="text-xs text-emerald-600 font-medium">{mensagem}</p>}
        {erro && <p className="text-xs text-destructive">{erro}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Salvando...' : 'Atualizar Senha'}
        </Button>
      </form>
    </AuthLayout>
  );
}
