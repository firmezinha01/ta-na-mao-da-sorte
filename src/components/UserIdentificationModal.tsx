'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  ShieldCheck, 
  Phone, 
  CreditCard, 
  User, 
  ArrowRight, 
  AlertCircle,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Usuario } from '@/types';
import { sounds } from '@/lib/sound';

interface UserIdentificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario | null;
  onSaveUser: (userData: { nome_completo: string; cpf: string; whatsapp: string }) => void;
  onLogout?: () => void;
  reasonMessage?: string;
}

export const UserIdentificationModal: React.FC<UserIdentificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  onLogout,
  reasonMessage
}) => {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormError('');
      if (currentUser) {
        setNomeCompleto(currentUser.nome_completo || '');
        const cleanCpf = (currentUser.cpf || '').replace(/\D/g, '');
        setCpf(formatCpf(cleanCpf));
        const cleanPhone = (currentUser.whatsapp || '').replace(/\D/g, '');
        setWhatsapp(formatPhone(cleanPhone));
      } else {
        setNomeCompleto('');
        setCpf('');
        setWhatsapp('');
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const formatCpf = (digits: string) => {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const formatPhone = (digits: string) => {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCpf(formatCpf(raw));
    if (formError) setFormError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('55') && raw.length > 11) {
      raw = raw.slice(2);
    }
    raw = raw.slice(0, 11);
    setWhatsapp(formatPhone(raw));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = nomeCompleto.trim();
    if (!cleanName || cleanName.length < 3) {
      setFormError('Por favor, informe seu Nome Completo.');
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setFormError('Por favor, insira um CPF válido com 11 dígitos.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Por favor, insira um WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      // Registra/atualiza o usuário na API central
      await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: cleanName,
          cpf: cleanCpf,
          whatsapp: cleanPhone,
          tickets: []
        })
      });
    } catch (err) {
      console.warn('Erro ao salvar participante:', err);
    } finally {
      setIsSubmitting(false);
    }

    sounds.playClick();
    onSaveUser({
      nome_completo: cleanName,
      cpf: cleanCpf,
      whatsapp: cleanPhone
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950 overflow-hidden my-4">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-900/50 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/25 shrink-0">
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>{currentUser ? 'Meus Dados de Participante' : 'Entrar no Aplicativo'}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-[11px] text-emerald-400 font-semibold">
                Tá Na Mão da SORTE • Identificação Oficial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Motivo (quando o usuário tenta escolher número antes de entrar) */}
        {reasonMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{reasonMessage}</span>
          </div>
        )}

        {/* Informação Obrigatória sobre Pagamento do Prêmio */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed">
            <p className="font-bold text-white mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Identificação Obrigatória para Premiação</span>
            </p>
            <p className="text-[11px] text-slate-300">
              O preenchimento do seu <strong>Nome Completo</strong>, <strong>CPF</strong> e <strong>WhatsApp</strong> é obrigatório para você escolher seus números. É através destes dados que faremos o pagamento imediato via Pix caso você seja o grande ganhador!
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nome Completo *</span>
            </label>
            <input
              type="text"
              required
              autoFocus={!currentUser}
              placeholder="Ex: João da Silva Santos"
              value={nomeCompleto}
              onChange={(e) => {
                setNomeCompleto(e.target.value);
                if (formError) setFormError('');
              }}
              className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-medium"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>CPF (apenas números) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              maxLength={14}
              className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp com DDD *</span>
            </label>
            <input
              type="tel"
              required
              placeholder="(00) 00000-0000"
              value={whatsapp}
              onChange={handlePhoneChange}
              maxLength={15}
              className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Enviaremos o lembrete oficial e mensagem imediata caso seu bilhete seja premiado.
            </p>
          </div>

          {/* Mensagem de Erro */}
          {formError && (
            <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Botão Salvar / Entrar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-700 hover:from-emerald-400 hover:to-green-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{currentUser ? 'Atualizar Meus Dados e Continuar' : 'Entrar e Escolher Números'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Opção de Sair / Trocar Usuário se já estiver conectado */}
          {currentUser && onLogout && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair / Trocar de Participante</span>
            </button>
          )}

        </form>

      </div>
    </div>
  );
};
