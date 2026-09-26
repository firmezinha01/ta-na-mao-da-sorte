'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, Flame, Calendar, Sparkles, ChevronDown } from 'lucide-react';
import { Sorteio } from '@/types';
import { sounds } from '@/lib/sound';
import { getNextDrawTargetDate } from '@/lib/drawTime';

interface JackpotBannerProps {
  sorteio: Sorteio;
  serverTimeOffset?: number;
  targetTimestamp?: number;
  targetLabelDisplay?: string;
  soldCount?: number;
  totalCombinations?: number;
  onScrollToGrid: () => void;
  onOpenLiveDraw: () => void;
  onAutoTriggerDraw?: () => void;
}

export const JackpotBanner: React.FC<JackpotBannerProps> = ({
  sorteio,
  serverTimeOffset = 0,
  targetTimestamp,
  targetLabelDisplay,
  onScrollToGrid,
  onOpenLiveDraw,
  onAutoTriggerDraw
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(9999);
  const [isLastMinuteAlert, setIsLastMinuteAlert] = useState(false);
  const [targetLabel, setTargetLabel] = useState('19:00h');
  const hasTriggeredRef = useRef(false);

  // Reseta o gatilho quando o sorteio ou targetTimestamp mudar
  useEffect(() => {
    hasTriggeredRef.current = false;
  }, [sorteio?.id, targetTimestamp]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      // ⏱️ SINCRONIZAÇÃO ABSOLUTA: usa o tempo real do servidor corrigido pelo offset
      const synchronizedNow = Date.now() + serverTimeOffset;
      const target = targetTimestamp || getNextDrawTargetDate().getTime();

      if (targetLabelDisplay) {
        setTargetLabel(targetLabelDisplay);
      } else {
        const targetDate = new Date(target);
        const targetH = String(targetDate.getHours()).padStart(2, '0');
        const targetM = String(targetDate.getMinutes()).padStart(2, '0');
        setTargetLabel(`${targetH}:${targetM}h`);
      }

      const diff = Math.max(0, target - synchronizedNow);
      const totalSec = Math.floor(diff / 1000);
      setTotalSecondsLeft(totalSec);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });

      // Quando faltar 1 minuto (<= 60 segundos) e ainda não zerou
      if (totalSec <= 60 && totalSec > 0) {
        setIsLastMinuteAlert(true);
        // Beep sonoro sincronizado a cada segundo (mais agudo nos últimos 10 segundos!)
        sounds.playCountdownBeep(totalSec <= 10);
      } else {
        setIsLastMinuteAlert(false);
      }

      // Quando o cronômetro ZERA (diff === 0) -> Dispara o Sorteio Automático APENAS se o sorteio não foi finalizado!
      if (totalSec === 0 && !hasTriggeredRef.current && sorteio.status !== 'finalizado') {
        hasTriggeredRef.current = true;
        sounds.playWinFanfare();
        if (onAutoTriggerDraw) {
          onAutoTriggerDraw();
        } else {
          onOpenLiveDraw();
        }
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [serverTimeOffset, targetTimestamp, targetLabelDisplay, onAutoTriggerDraw, onOpenLiveDraw]);

  const isAccumulated = sorteio.acumulado || sorteio.premio > 500;
  const isSunday = sorteio.eh_domingo;

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900 via-emerald-950/80 to-slate-950 border border-emerald-500/30 p-3 sm:p-5 md:p-6 lg:p-6 shadow-2xl shadow-emerald-950/60 my-2 sm:my-3">
      
      {/* Luz de fundo decorativa */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-64 sm:h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* Badge de Destaque */}
        {isAccumulated ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1.5 sm:mb-2 animate-pulse">
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 shrink-0" />
            <span>🔥 PRÊMIO ACUMULADO! NÃO PERCA! 🔥</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
            <span>Sorteio Oficial Diário • Transmissão ao Vivo</span>
          </div>
        )}

        {/* Alerta de Último Minuto (Faltando <= 60 segundos com som e pisca-pisca) */}
        {isLastMinuteAlert && (
          <div className="w-full max-w-xl my-2 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-2xl shadow-red-950 border-2 border-yellow-300 animate-pulse">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black tracking-wide">
              <span className="text-xl animate-spin">🚨</span>
              <span>ATENÇÃO! O SORTEIO COMEÇA EM {totalSecondsLeft} SEGUNDOS!</span>
            </div>
            <p className="text-[11px] text-yellow-200 mt-0.5 font-semibold">
              O sorteio iniciará automaticamente na tela assim que o cronômetro zerar!
            </p>
          </div>
        )}

        {/* Título do Prêmio */}
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-emerald-400/90 mb-0.5">
          {isAccumulated ? 'Grande Prêmio Acumulado de Hoje' : 'Premiação de Hoje'}
        </p>

        {/* Valor do Prêmio em destaque */}
        <div className="flex items-baseline justify-center gap-1 sm:gap-1.5 my-0.5 sm:my-1">
          <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-emerald-400">R$</span>
          <span className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(245,158,11,0.35)]">
            {sorteio.premio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Aviso de Domingo ou Regra do Acúmulo */}
        <div className="max-w-xl text-[10px] sm:text-xs text-slate-300 mb-2 sm:mb-2.5 bg-slate-900/60 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl border border-slate-700/50">
          {isSunday ? (
            <p className="text-amber-300 font-bold flex flex-col sm:flex-row items-center justify-center gap-1">
              <span>🌟 DOMINGO DA SORTE:</span>
              <span className="text-slate-200 font-normal">A roleta gira até sair um vencedor garantido dentre os bilhetes e zerar o acumulativo!</span>
            </p>
          ) : (
            <p>
              Sem ganhador hoje? <strong className="text-amber-300">O prêmio acumula até domingo</strong>, quando a roleta gira até sair vencedor! Milhar por <strong className="text-emerald-300">R$ 2,00</strong>.
            </p>
          )}
        </div>

        {/* Cronômetro Regressivo Sincronizado */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5 mb-2.5 sm:mb-3">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Sorteio de hoje às {targetLabel} em:</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2.5">
            <div className="flex flex-col items-center bg-slate-950/90 border border-emerald-700/50 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 min-w-[50px] sm:min-w-[64px]">
              <span className="text-lg sm:text-2xl lg:text-3xl font-black text-amber-400 font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-semibold">Horas</span>
            </div>
            <span className="text-base sm:text-2xl font-black text-emerald-500 font-mono">:</span>
            <div className="flex flex-col items-center bg-slate-950/90 border border-emerald-700/50 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 min-w-[50px] sm:min-w-[64px]">
              <span className="text-lg sm:text-2xl lg:text-3xl font-black text-amber-400 font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-semibold">Minutos</span>
            </div>
            <span className="text-base sm:text-2xl font-black text-emerald-500 font-mono">:</span>
            <div className={`flex flex-col items-center bg-slate-950/90 border rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 min-w-[50px] sm:min-w-[64px] ${
              isLastMinuteAlert ? 'border-red-500 animate-pulse bg-red-950/40' : 'border-emerald-700/50'
            }`}>
              <span className={`text-lg sm:text-2xl lg:text-3xl font-black font-mono ${
                isLastMinuteAlert ? 'text-red-400 animate-bounce' : 'text-amber-400'
              }`}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-semibold">Segundos</span>
            </div>
          </div>
        </div>

        {/* Botão de Ação Principal */}
        <div className="flex items-center justify-center w-full max-w-sm">
          <button
            onClick={onScrollToGrid}
            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95"
          >
            <span>Escolher Milhares (R$ 2 cada)</span>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
          </button>
        </div>

        {/* Indicadores de Destaque para o Jogador */}
        <div className="grid grid-cols-2 gap-2 mt-2 sm:mt-2.5 w-full max-w-sm text-[9px] sm:text-[11px]">
          <div className="bg-slate-950/50 p-1.5 sm:p-2 rounded-xl border border-emerald-950 text-center">
            <p className="text-slate-400 text-[9px]">Modalidade</p>
            <p className="text-[11px] sm:text-xs font-bold text-amber-400">Milhar Exata (4 dígitos)</p>
          </div>
          <div className="bg-slate-950/50 p-1.5 sm:p-2 rounded-xl border border-emerald-950 text-center">
            <p className="text-slate-400 text-[9px]">Sorteio Oficial</p>
            <p className="text-[11px] sm:text-xs font-bold text-emerald-400">Diário ao Vivo ({targetLabel})</p>
          </div>
        </div>

      </div>
    </div>
  );
};
