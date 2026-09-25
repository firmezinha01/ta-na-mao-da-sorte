'use client';

import React from 'react';
import { 
  Ticket, 
  Trophy 
} from 'lucide-react';

interface BottomNavProps {
  onScrollToGrid: () => void;
  onOpenMyTickets: () => void;
  onOpenLiveDraw: () => void;
  myTicketsCount: number;
  onOpenRules?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onScrollToGrid,
  onOpenMyTickets,
  onOpenLiveDraw,
  myTicketsCount
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-emerald-900/60 px-4 py-2 sm:hidden transition-all shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        
        {/* 1. Milhares */}
        <button
          onClick={onScrollToGrid}
          className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-emerald-400 active:scale-95 transition-all w-24"
        >
          <span className="text-xl">🍀</span>
          <span className="text-[11px] font-bold mt-0.5">Milhares</span>
        </button>

        {/* 2. SORTEIO 19H (Central em Destaque) */}
        <button
          onClick={onOpenLiveDraw}
          className="flex flex-col items-center justify-center -mt-5 active:scale-90 transition-all group w-28"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-900/50 border-2 border-amber-300 animate-pulse">
            <Trophy className="w-6 h-6 text-yellow-300 fill-yellow-300/30" />
          </div>
          <span className="text-[10px] font-black text-amber-400 mt-1 uppercase tracking-tight">
            SORTEIO 19H
          </span>
        </button>

        {/* 3. Meus Bilhetes */}
        <button
          onClick={onOpenMyTickets}
          className="relative flex flex-col items-center justify-center p-2 text-slate-400 hover:text-cyan-400 active:scale-95 transition-all w-24"
        >
          <div className="relative">
            <Ticket className="w-5 h-5 text-cyan-400" />
            {myTicketsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                {myTicketsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold mt-0.5">Meus Bilhetes</span>
        </button>

      </div>
    </nav>
  );
};
