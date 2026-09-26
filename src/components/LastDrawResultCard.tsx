'use client';

import React from 'react';
import { Trophy, Phone, Award, Flame, Calendar, Sparkles } from 'lucide-react';

export interface LastDrawInfo {
  drawId: string;
  dataSorteio: string;
  milhar: string;
  premio: number;
  acumulou: boolean;
  ganhadorPrimeiroNome?: string;
  ganhadorTelefoneFinal?: string;
  isVisible: boolean;
}

interface LastDrawResultCardProps {
  lastDraw: LastDrawInfo | null;
}

export const LastDrawResultCard: React.FC<LastDrawResultCardProps> = ({ lastDraw }) => {
  if (!lastDraw || !lastDraw.isVisible || !lastDraw.milhar) {
    return null;
  }

  const digits = lastDraw.milhar.padStart(4, '0').split('');
  const hasWinner = Boolean(lastDraw.ganhadorPrimeiroNome);

  // Formata data do sorteio (ex: 25/09 às 19:00h)
  let formattedDate = '';
  try {
    const d = new Date(lastDraw.dataSorteio);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    formattedDate = `${day}/${month} às ${hours}:${minutes}h`;
  } catch {
    formattedDate = 'Sorteio Oficial';
  }

  const formattedPrize = lastDraw.premio.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <div className="w-full my-3 sm:my-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/40 p-3.5 sm:p-5 shadow-xl shadow-emerald-950/40 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Cabeçalho do Card */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
                Resultado do Último Sorteio
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                • {formattedDate}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
              Prêmio disputado: <strong className="text-emerald-400">{formattedPrize}</strong>
            </p>
          </div>
        </div>

        {/* Os 4 dígitos da Milhar Oficial Sorteada */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
            Milhar Oficial Sorteada
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {digits.map((digit, idx) => (
              <div
                key={idx}
                className="w-8 h-10 sm:w-10 sm:h-12 rounded-xl bg-slate-950 border border-amber-400/80 text-amber-300 font-mono font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-amber-500/10"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>

        {/* Informações do Ganhador ou Acúmulo */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          {hasWinner ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3.5 py-1.5 sm:px-4 sm:py-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <span>Ganhador: {lastDraw.ganhadorPrimeiroNome}</span>
              </div>
              <div className="flex items-center justify-center md:justify-end gap-1.5 text-[11px] sm:text-xs text-slate-300 font-mono mt-0.5">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>Tel: (••) •••••-{lastDraw.ganhadorTelefoneFinal || '••••'}</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Milhar Não Comprada</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-200/90 font-medium">
                Prêmio acumulou para o próximo sorteio!
              </p>
            </div>
          )}

          <p className="text-[9px] text-slate-500 mt-1.5">
            Dados salvos até Segunda-feira às 10:00h
          </p>
        </div>

      </div>
    </div>
  );
};
