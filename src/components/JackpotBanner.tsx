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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-emerald-950/80 to-slate-950 border border-emerald-500/30 p-4 sm:p-8 md:p-10 shadow-2xl shadow-emerald-950/60 my-4 sm:my-6">
      
      {/* Luz de fundo decorativa */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* Badge de Destaque */}
        {isAccumulated ? (
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] sm:text-sm font-black uppercase tracking-wider mb-3 sm:mb-4 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>🔥 PRÊMIO ACUMULADO! NÃO PERCA! 🔥</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] sm:text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sorteio Oficial Diário • Transmissão ao Vivo</span>
          </div>
        )}

        {/* Alerta de Último Minuto (Faltando <= 60 segundos com som e pisca-pisca) */}
        {isLastMinuteAlert && (
          <div className="w-full max-w-xl my-4 p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-2xl shadow-red-950 border-2 border-yellow-300 animate-pulse">
            <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-black tracking-wide">
              <span className="text-2xl animate-spin">🚨</span>
              <span>ATENÇÃO! O SORTEIO COMEÇA EM {totalSecondsLeft} SEGUNDOS!</span>
            </div>
            <p className="text-xs text-yellow-200 mt-1 font-semibold">
              O sorteio iniciará automaticamente na tela assim que o cronômetro zerar!
            </p>
          </div>
        )}

        {/* Título do Prêmio */}
        <p className="text-[11px] sm:text-sm font-semibold uppercase tracking-widest text-emerald-400/90 mb-1">
          {isAccumulated ? 'Grande Prêmio Acumulado de Hoje' : 'Premiação de Hoje'}
        </p>

        {/* Valor do Prêmio em destaque */}
        <div className="flex items-baseline justify-center gap-1 sm:gap-2 my-1 sm:my-2">
          <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-emerald-400">R$</span>
          <span className="text-4xl xs:text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(245,158,11,0.35)]">
            {sorteio.premio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Aviso de Domingo ou Regra do Acúmulo */}
        <div className="max-w-2xl text-[11px] sm:text-sm text-slate-300 mb-5 sm:mb-6 bg-slate-900/60 backdrop-blur-sm px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-700/50">
          {isSunday ? (
            <p className="text-amber-300 font-bold flex flex-col sm:flex-row items-center justify-center gap-1">
              <span>🌟 DOMINGO DA SORTE:</span>
              <span className="text-slate-200 font-normal">A roleta gira até sair um vencedor garantido dentre os bilhetes e zerar o acumulativo!</span>
            </p>
          ) : (
            <p>
              Sem ganhador hoje? <strong className="text-amber-300">O prêmio acumula até domingo</strong>, quando a roleta gira até sair um vencedor garantido! Milhar por apenas <strong className="text-emerald-300">R$ 2,00</strong>.
            </p>
          )}
        </div>

        {/* Cronômetro Regressivo Sincronizado */}
        <div className="flex flex-col items-center gap-2 mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
            <span>Sorteio de hoje às {targetLabel} em:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4">
            <div className="flex flex-col items-center bg-slate-950/90 border border-emerald-700/50 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-5 sm:py-3 min-w-[56px] sm:min-w-[80px]">
              <span className="text-xl sm:text-4xl font-black text-amber-400 font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-xs text-slate-400 uppercase font-semibold">Horas</span>
            </div>
            <span className="text-xl sm:text-4xl font-black text-emerald-500 font-mono">:</span>
            <div className="flex flex-col items-center bg-slate-950/90 border border-emerald-700/50 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-5 sm:py-3 min-w-[56px] sm:min-w-[80px]">
              <span className="text-xl sm:text-4xl font-black text-amber-400 font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-xs text-slate-400 uppercase font-semibold">Minutos</span>
            </div>
            <span className="text-xl sm:text-4xl font-black text-emerald-500 font-mono">:</span>
            <div className={`flex flex-col items-center bg-slate-950/90 border rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-5 sm:py-3 min-w-[56px] sm:min-w-[80px] ${
              isLastMinuteAlert ? 'border-red-500 animate-pulse bg-red-950/40' : 'border-emerald-700/50'
            }`}>
              <span className={`text-xl sm:text-4xl font-black font-mono ${
                isLastMinuteAlert ? 'text-red-400 animate-bounce' : 'text-amber-400'
              }`}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-xs text-slate-400 uppercase font-semibold">Segundos</span>
            </div>
          </div>
        </div>

        {/* Botão de Ação Principal (Sem o botão Assistir/Simular que foi removido a pedido) */}
        <div className="flex items-center justify-center w-full max-w-md">
          <button
            onClick={onScrollToGrid}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95"
          >
            <span>Escolher Milhares (R$ 2 cada)</span>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
          </button>
        </div>

        {/* Indicadores de Destaque para o Jogador */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md text-[10px] sm:text-xs">
          <div className="bg-slate-950/50 p-2 sm:p-2.5 rounded-xl border border-emerald-950 text-center">
            <p className="text-slate-400">Modalidade</p>
            <p className="text-xs sm:text-base font-bold text-amber-400">Milhar Exata (4 dígitos)</p>
          </div>
          <div className="bg-slate-950/50 p-2 sm:p-2.5 rounded-xl border border-emerald-950 text-center">
            <p className="text-slate-400">Sorteio Oficial</p>
            <p className="text-xs sm:text-base font-bold text-emerald-400">Diário ao Vivo ({targetLabel})</p>
          </div>
        </div>

      </div>
    </div>
  );
};
