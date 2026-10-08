import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [verificationUrl, setVerificationUrl] = useState(null);
  const [resetUrl, setResetUrl] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    setVerificationUrl(null);
    setResetUrl(null);
    setErro('');

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação.');
      }

      setMensagem(data.message || 'Se o e-mail estiver cadastrado, as instruções foram processadas no back-end.');
      if (data.verificationUrl) setVerificationUrl(data.verificationUrl);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={KeyRound}
      title="Recuperar Senha"
      subtitle="Informe seu e-mail cadastrado"
      footer={
        <>
          Lembrou a senha?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Voltar ao login</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {mensagem && (
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-foreground">
            <p className="font-medium">{mensagem}</p>
            <p className="text-[11px] text-muted-foreground">
              Verifique a janela do <strong>Flora - Back-end</strong> para visualizar o link gerado.
            </p>
            {verificationUrl && (
              <a
                href={verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 hover:underline"
              >
                Abrir link de confirmação emitido <ArrowRight className="h-3 w-3" />
              </a>
            )}
            {resetUrl && (
              <a
                href={resetUrl}
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                Redefinir senha agora <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {erro && <p className="text-xs text-destructive">{erro}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processando...' : 'Enviar Instruções'}
        </Button>
      </form>
    </AuthLayout>
  );
}
