'use client';

import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  CreditCard, 
  Users, 
  Ticket, 
  Trophy, 
  Flame, 
  RefreshCcw, 
  ShieldAlert, 
  Sparkles,
  CheckCircle,
  ExternalLink,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Bilhete, Sorteio, Usuario } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sorteio: Sorteio;
  soldTickets: Bilhete[];
  usuarios: Usuario[];
  testMode: boolean;
  onToggleTestMode: () => void;
  onGenerateQuickSales: (count: number) => void;
  onResetData: () => void;
  onAdjustPrize: (newPrize: number) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  sorteio,
  soldTickets,
  usuarios,
  testMode,
  onToggleTestMode,
  onGenerateQuickSales,
  onResetData,
  onAdjustPrize
}) => {
  const [customPrize, setCustomPrize] = useState(sorteio.premio.toString());
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const totalRevenue = soldTickets.length * 2.00;

  const handleUpdatePrize = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customPrize);
    if (!isNaN(val) && val >= 500) {
      onAdjustPrize(val);
      setSuccessMsg(`Prêmio atualizado para R$ ${val.toFixed(2)}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-200 flex items-center justify-center border border-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  Painel de Controle & Administração
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Gerenciamento
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Métricas, simulações de vendas, configuração de Pix e banco de dados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bilhetes Vendidos</span>
              </div>
              <div className="text-xl font-black text-white font-mono">
                {soldTickets.length} <span className="text-xs text-slate-500 font-sans">/ 10.000</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-green-400" />
                <span>Arrecadação</span>
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Participantes</span>
              </div>
              <div className="text-xl font-black text-cyan-400 font-mono">
                {usuarios.length}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Prêmio Atual</span>
              </div>
              <div className="text-xl font-black text-amber-400 font-mono">
                {sorteio.premio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          {/* Status dos Serviços (Mercado Pago, Supabase, WhatsApp) */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Status das Integrações do Sistema
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mercado Pago Pix</span>
                  <span className="font-bold text-amber-400">{testMode ? 'Sandbox (Modo Teste)' : 'Produção'}</span>
                </div>
                <button
                  onClick={onToggleTestMode}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px]"
                >
                  Alternar
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Banco Supabase</span>
                  <span className={`font-bold ${isSupabaseConfigured ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {isSupabaseConfigured ? 'Conectado SQL' : 'Local / Offline Store'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">WhatsApp Engine</span>
                  <span className="font-bold text-green-400">Ativo (Simulador / Web)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ajustar Prêmio Acumulado */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Gerenciar Valor do Prêmio
            </h4>
            <form onSubmit={handleUpdatePrize} className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">R$</span>
                <input
                  type="number"
                  step="50"
                  min="500"
                  value={customPrize}
                  onChange={(e) => setCustomPrize(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
              >
                Salvar Prêmio
              </button>
            </form>
            {successMsg && (
              <p className="text-xs text-emerald-400 mt-2 font-semibold">{successMsg}</p>
            )}
          </div>

          {/* Ações de Teste Rápido */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Ações Rápidas de Simulação
            </h4>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onGenerateQuickSales(10)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Gerar 10 Vendas de Teste</span>
              </button>

              <button
                onClick={() => onGenerateQuickSales(50)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Gerar 50 Vendas de Teste</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Deseja realmente resetar todos os dados para o estado inicial padrão?')) {
                    onResetData();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800 text-xs font-bold text-red-300 transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetar Dados</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Fechar Painel
          </button>
        </div>

      </div>
    </div>
  );
};
