import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/authService';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Preencha seu e-mail/CPF e a senha.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await login(identifier, password);
    setIsLoading(false);

    if (res.success) {
      const clean = identifier.trim().toLowerCase();
      if (res.user?.role === 'admin' || clean === 'admin@tanamaodasorte.com.br' || clean === 'admin' || clean === 'adm') {
        navigate('/afiliados/admin');
      } else {
        navigate('/afiliados/dashboard');
      }
    } else {
      setError(res.error || 'Credenciais inválidas. Verifique os dados digitados.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setIsForgotLoading(true);
    const res = await AuthService.requestPasswordReset(forgotEmail);
    setIsForgotLoading(false);

    if (res.success) {
      setForgotStatus({ type: 'success', message: res.message });
    } else {
      setForgotStatus({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1 max-w-md mx-auto px-4 py-12 flex flex-col justify-center w-full">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-green-800 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <span className="text-2xl select-none">🍀</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Área do Afiliado
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Entre para acompanhar cliques, conversões e solicitar saques Pix.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40">
          
          {error && (
            <div className="mb-6 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-red-300 text-xs leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="E-mail ou CPF"
              placeholder="seuemail@exemplo.com ou 000.000.000-00"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Senha de Acesso"
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStatus({ type: 'idle', message: '' });
                    setForgotEmail(identifier.includes('@') ? identifier : '');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 bg-slate-950 border-slate-700 cursor-pointer"
              />
              <span className="text-xs text-slate-300">Permanecer conectado neste navegador</span>
            </label>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm py-3.5"
            >
              Entrar no Painel 🍀
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Ainda não é um parceiro afiliado?{' '}
              <Link to="/afiliados/cadastro" className="text-emerald-400 font-bold hover:underline">
                Cadastre-se Gratuitamente
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Recuperação de Senha"
      >
        {forgotStatus.type === 'success' ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">E-mail Enviado!</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {forgotStatus.message}
            </p>
            <Button
              variant="secondary"
              onClick={() => setShowForgotModal(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Digite o e-mail cadastrado na sua conta de afiliado. Enviaremos um link seguro para você redefinir sua senha.
            </p>

            {forgotStatus.type === 'error' && (
              <p className="text-xs text-red-400 font-medium">
                {forgotStatus.message}
              </p>
            )}

            <Input
              label="Seu E-mail Cadastrado"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForgotModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isForgotLoading}
                className="flex-1"
              >
                Enviar Instruções
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
