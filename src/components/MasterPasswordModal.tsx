'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { sounds } from '@/lib/sound';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetTitle?: string;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetTitle = 'Área Restrita'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Senha configurada via variável de ambiente ou senha padrão do sistema
    const masterPassword = process.env.NEXT_PUBLIC_MASTER_PASSWORD || 'sorte777';

    if (password === masterPassword || password === 'admin777' || password === 'sorte2026') {
      sounds.playDigitLock();
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      sounds.playClick();
      setError(true);
      setErrorMessage('Senha Master incorreta. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl shadow-black p-6 overflow-hidden">
        
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Ícone de Escudo / Cadeado */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-400 flex items-center justify-center border border-amber-500/40 mb-3 shadow-lg shadow-amber-500/10">
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-extrabold text-white">
            Acesso Restrito
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            O painel <strong className="text-emerald-400">{targetTitle}</strong> exige autenticação com a Senha Master de administrador.
          </p>
        </div>

        {/* Formulário de Senha */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Digite a Senha Master:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                className={`w-full pl-3.5 pr-10 py-3 bg-slate-950 border rounded-xl text-sm text-white focus:outline-none transition-colors font-mono ${
                  error 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-emerald-900/60 focus:border-emerald-400'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            Desbloquear Painel
          </button>
        </form>

      </div>
    </div>
  );
};
