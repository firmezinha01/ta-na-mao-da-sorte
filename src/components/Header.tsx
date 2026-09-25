'use client';

import React from 'react';
import { 
  Trophy, 
  Ticket, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Usuario } from '@/types';

interface HeaderProps {
  onOpenMyTickets: () => void;
  onOpenWhatsAppHub: () => void;
  onOpenAdmin: () => void;
  onOpenRules: () => void;
  onOpenLiveDraw: () => void;
  myTicketsCount: number;
  unreadMessagesCount: number;
  currentUser: Usuario | null;
  testMode: boolean;
  onToggleTestMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMyTickets,
  onOpenWhatsAppHub,
  onOpenAdmin,
  onOpenRules,
  onOpenLiveDraw,
  myTicketsCount,
  unreadMessagesCount,
  currentUser,
  testMode,
  onToggleTestMode
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-emerald-900/40 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-20">
          
          {/* Logo e Nome */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-green-800 shadow-lg shadow-emerald-500/25 border border-emerald-300/30 shrink-0">
              <span className="text-xl sm:text-3xl select-none">🍀</span>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping opacity-75" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-base sm:text-2xl tracking-tight bg-gradient-to-r from-emerald-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  Tá Na Mão da SORTE
                </h1>
                {testMode ? (
                  <button 
                    onClick={onToggleTestMode}
                    title="Clique para alternar modo"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>TESTE</span>
                  </button>
                ) : (
                  <button 
                    onClick={onToggleTestMode}
                    title="Clique para alternar modo"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>PRODUÇÃO</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-300/70 font-medium hidden sm:block">
                Bingo & Loteria Digital • Sorteios Diários às 19h • R$ 2,00 a Milhar
              </p>
            </div>
          </div>

          {/* Ações e Navegação */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Botão Sorteio ao Vivo (visível em desktop, no mobile fica em destaque na barra inferior) */}
            <button
              onClick={onOpenLiveDraw}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-md shadow-red-900/30 transition-all transform active:scale-95 animate-pulse"
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" />
              <span>Sorteio 19h</span>
            </button>

            {/* Meus Bilhetes (Desktop) */}
            <button
              onClick={onOpenMyTickets}
              className="hidden sm:flex relative items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-700/50 transition-colors"
              title="Ver meus bilhetes comprados"
            >
              <Ticket className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Meus Bilhetes</span>
              {myTicketsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-full">
                  {myTicketsCount}
                </span>
              )}
            </button>

            {/* WhatsApp Hub (Desktop) */}
            <button
              onClick={onOpenWhatsAppHub}
              className="hidden sm:flex relative p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-700/50 transition-colors items-center gap-1.5"
              title="Central de Mensagens do WhatsApp"
            >
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="hidden lg:inline">WhatsApp</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-slate-950">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Regras (Desktop) */}
            <button
              onClick={onOpenRules}
              className="hidden sm:block p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition-colors"
              title="Como Funciona / Regras"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </button>

            {/* Admin (Desktop e Mobile) */}
            <button
              onClick={onOpenAdmin}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition-colors"
              title="Painel de Administração e Testes"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>

            {/* Usuário Logado */}
            {currentUser && (
              <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-emerald-900/60 text-xs text-emerald-300">
                <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-white uppercase text-[11px]">
                  {currentUser.nome_completo.charAt(0)}
                </div>
                <div className="truncate max-w-[100px]">
                  {currentUser.nome_completo.split(' ')[0]}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
