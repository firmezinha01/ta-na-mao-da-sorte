'use client';

import React from 'react';
import { 
  X, 
  HelpCircle, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Flame,
  User
} from 'lucide-react';
import { Usuario } from '@/types';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRules: () => void;
  onOpenAdmin: () => void;
  testMode: boolean;
  onToggleTestMode: () => void;
  currentUser: Usuario | null;
}

export const MobileMenuModal: React.FC<MobileMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenRules,
  onOpenAdmin,
  testMode,
  onToggleTestMode,
  currentUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-slate-900 border border-emerald-900/60 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍀</span>
            <span className="font-extrabold text-white text-base">Mais Opções</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info se logado */}
        {currentUser && (
          <div className="my-4 p-3.5 rounded-2xl bg-slate-950 border border-emerald-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center font-bold text-white text-base">
              {currentUser.nome_completo.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{currentUser.nome_completo}</p>
              <p className="text-[11px] text-emerald-400 font-mono">WhatsApp: {currentUser.whatsapp}</p>
            </div>
          </div>
        )}

        {/* Lista de Ações */}
        <div className="space-y-2.5 my-4">
          
          {/* Alternar Modo de Teste */}
          <button
            onClick={() => {
              onToggleTestMode();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              {testMode ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <span className="text-xs font-bold text-white block">
                  {testMode ? 'Modo de Teste (Ativo)' : 'Modo de Produção (Ativo)'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {testMode ? 'Transações Pix simuladas sem gastar dinheiro' : 'Chaves oficiais Mercado Pago ativas'}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${testMode ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              Alternar
            </span>
          </button>

          {/* Regras e Como Funciona */}
          <button
            onClick={() => {
              onClose();
              onOpenRules();
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">Como Funciona / Regulamento</span>
              <span className="text-[10px] text-slate-400">Regras do sorteio diário às 19h e prêmio acumulado</span>
            </div>
          </button>

          {/* Painel de Administração */}
          <button
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
          >
            <Settings className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-white block">Painel Administrativo</span>
              <span className="text-[10px] text-slate-400">Métricas, faturamento, simulações de teste e reset</span>
            </div>
          </button>

        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs mt-2"
        >
          Fechar
        </button>

      </div>
    </div>
  );
};
