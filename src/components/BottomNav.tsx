'use client';

import React from 'react';
import { 
  Sparkles, 
  Ticket, 
  Trophy, 
  MessageSquare, 
  Menu,
  HelpCircle,
  Settings
} from 'lucide-react';

interface BottomNavProps {
  onScrollToGrid: () => void;
  onOpenMyTickets: () => void;
  onOpenLiveDraw: () => void;
  onOpenWhatsAppHub: () => void;
  onOpenMenu: () => void;
  myTicketsCount: number;
  unreadMessagesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onScrollToGrid,
  onOpenMyTickets,
  onOpenLiveDraw,
  onOpenWhatsAppHub,
  onOpenMenu,
  myTicketsCount,
  unreadMessagesCount
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-emerald-900/60 px-2 py-1.5 sm:hidden transition-all shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Início / Bilhetes */}
        <button
          onClick={onScrollToGrid}
          className="flex flex-col items-center justify-center p-1.5 text-slate-400 hover:text-emerald-400 active:scale-95 transition-all"
        >
          <span className="text-lg">🍀</span>
          <span className="text-[10px] font-bold mt-0.5">Milhares</span>
        </button>

        {/* Meus Bilhetes */}
        <button
          onClick={onOpenMyTickets}
          className="relative flex flex-col items-center justify-center p-1.5 text-slate-400 hover:text-cyan-400 active:scale-95 transition-all"
        >
          <Ticket className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-bold mt-0.5">Meus</span>
          {myTicketsCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
              {myTicketsCount}
            </span>
          )}
        </button>

        {/* Botão Central Destacado: Sorteio 19h */}
        <button
          onClick={onOpenLiveDraw}
          className="flex flex-col items-center justify-center -mt-5 active:scale-90 transition-all group"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-900/50 border-2 border-amber-300 animate-pulse">
            <Trophy className="w-6 h-6 text-yellow-300 fill-yellow-300/30" />
          </div>
          <span className="text-[10px] font-black text-amber-400 mt-1 uppercase tracking-tight">
            Sorteio 19h
          </span>
        </button>

        {/* WhatsApp Hub */}
        <button
          onClick={onOpenWhatsAppHub}
          className="relative flex flex-col items-center justify-center p-1.5 text-slate-400 hover:text-green-400 active:scale-95 transition-all"
        >
          <MessageSquare className="w-5 h-5 text-green-400" />
          <span className="text-[10px] font-bold mt-0.5">WhatsApp</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-green-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
              {unreadMessagesCount}
            </span>
          )}
        </button>

        {/* Menu / Mais */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center p-1.5 text-slate-400 hover:text-amber-400 active:scale-95 transition-all"
        >
          <Menu className="w-5 h-5 text-slate-300" />
          <span className="text-[10px] font-bold mt-0.5">Mais</span>
        </button>

      </div>
    </nav>
  );
};
