import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../lib/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const res = await signUp(email, password, { nome });
      if (!res.success) {
        throw new Error(res.error?.message || 'Erro ao realizar cadastro.');
      }

      setSuccessInfo(res.data);
    } catch (err) {
      setErro(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Criar Nova Conta"
      subtitle="Preencha os dados para começar"
      footer={
        <>
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Entrar</Link>
        </>
      }
    >
      {successInfo ? (
        <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h3 className="font-heading text-base font-bold text-foreground">Cadastro realizado com sucesso!</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Conforme as orientações do projeto, o link de confirmação foi exibido na janela do <strong>Flora - Back-end</strong>.
          </p>

          {successInfo.verificationUrl && (
            <div className="pt-2">
              <a
                href={successInfo.verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors w-full"
              >
                Confirmar E-mail Agora (Ativação Rápida)
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full text-xs"
            onClick={() => navigate('/login')}
          >
            Ir para a Tela de Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Ex: Mariana Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
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

          {erro && <p className="text-xs text-destructive">{erro}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
