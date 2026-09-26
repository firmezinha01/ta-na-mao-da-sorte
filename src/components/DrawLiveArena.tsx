'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Trophy, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw,
  Crown,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Sorteio, Usuario, Bilhete, Mensagem } from '@/types';
import { sounds } from '@/lib/sound';
import { maskPhoneNumber, getFirstName, generateWhatsAppWebLink, WhatsAppTemplates } from '@/lib/whatsapp';

interface DrawLiveArenaProps {
  isOpen: boolean;
  onClose: () => void;
  sorteio: Sorteio;
  soldTickets: Bilhete[];
  usuarios: Usuario[];
  onExecuteDraw: (options?: { forcedWinnerMilhar?: string; isSunday?: boolean }) => Promise<{
    sorteio: Sorteio;
    ganhador: Usuario | null;
    milhar: string;
    mensagensGeradas: Mensagem[];
  }>;
  onStartNewCycle: () => void;
  autoStart?: boolean;
}

export const DrawLiveArena: React.FC<DrawLiveArenaProps> = ({
  isOpen,
  onClose,
  sorteio,
  soldTickets,
  usuarios,
  onExecuteDraw,
  autoStart
}) => {
  // Estado dos 4 dígitos sorteados (milhar, centena, dezena, unidade)
  const [digits, setDigits] = useState<[string, string, string, string]>(['-', '-', '-', '-']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeDrum, setActiveDrum] = useState<number>(-1); // qual tambor está girando (0 a 3)
  const [resultWinner, setResultWinner] = useState<Usuario | null>(null);
  const [drawFinished, setDrawFinished] = useState(false);
  const [accumulated, setAccumulated] = useState(false);
  const [finalMilhar, setFinalMilhar] = useState('');

  // Estado para regra do Domingo: "não houve ganhador, vamos girar novamente"
  const [sundayRetryNotice, setSundayRetryNotice] = useState<string | null>(null);
  const [sundayCountdown, setSundayCountdown] = useState<number>(0);

  // Trava para executar apenas uma única vez e parar
  const hasTriggeredOnceRef = useRef(false);

  // Inicializa caso o sorteio já tenha acontecido
  useEffect(() => {
    if (sorteio.status === 'finalizado' && sorteio.numeros_sorteados) {
      const chars = sorteio.numeros_sorteados.split('') as [string, string, string, string];
      setDigits(chars);
      setFinalMilhar(sorteio.numeros_sorteados);
      setDrawFinished(true);
      setResultWinner(sorteio.ganhador || null);
      setAccumulated(sorteio.acumulado);
    }
  }, [sorteio]);

  // Se autoStart estiver ativo, executa UMA ÚNICA VEZ e para!
  useEffect(() => {
    if (autoStart && isOpen && !isSpinning && !drawFinished && sorteio.status !== 'finalizado' && !hasTriggeredOnceRef.current) {
      hasTriggeredOnceRef.current = true;
      const timer = setTimeout(() => {
        runDrawAnimation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isOpen, isSpinning, drawFinished, sorteio.status]);

  if (!isOpen) return null;

  // Função para rodar um giro nos 4 tambores até uma milhar alvo
  const spinDrumsToTarget = async (targetMilhar: string) => {
    const targetDigits = targetMilhar.split('');

    for (let drumIdx = 0; drumIdx < 4; drumIdx++) {
      setActiveDrum(drumIdx);
      const spinDuration = 700 + drumIdx * 300;
      const startTime = Date.now();

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          sounds.playRollTick();
          setDigits((prev) => {
            const next = [...prev] as [string, string, string, string];
            next[drumIdx] = Math.floor(Math.random() * 10).toString();
            return next;
          });

          if (Date.now() - startTime >= spinDuration) {
            clearInterval(interval);
            sounds.playDigitLock();
            setDigits((prev) => {
              const next = [...prev] as [string, string, string, string];
              next[drumIdx] = targetDigits[drumIdx];
              return next;
            });
            resolve();
          }
        }, 55);
      });

      await new Promise((r) => setTimeout(r, 150));
    }
    setActiveDrum(-1);
  };

  // Animação oficial do sorteio
  const runDrawAnimation = async (options?: { forcedWinnerMilhar?: string; isSunday?: boolean }) => {
    setIsSpinning(true);
    setDrawFinished(false);
    setResultWinner(null);
    setAccumulated(false);
    setSundayRetryNotice(null);

    // Obtém o resultado oficial do servidor (único para todos os aparelhos)
    const drawResult = await onExecuteDraw(options);
    const isSunday = options?.isSunday ?? sorteio.eh_domingo ?? false;

    // 🌟 REGRA ESPECIAL DE DOMINGO:
    // Se for domingo e houver bilhetes comprados, a roleta mostra o primeiro giro sem ganhador
    // e exibe a mensagem "Não houve ganhador, vamos girar novamente" antes de premiar o vencedor!
    if (isSunday && drawResult.ganhador) {
      // 1. Gera um número aleatório dummy que NÃO foi comprado por ninguém
      const soldNumbers = new Set(soldTickets.map(b => b.numero_milhar));
      let dummyNumber = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      let attempts = 0;
      while (soldNumbers.has(dummyNumber) && attempts < 20) {
        dummyNumber = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        attempts++;
      }

      // Primeiro giro dramático
      await spinDrumsToTarget(dummyNumber);

      // Alerta de que não houve ganhador nesta rodada
      sounds.playAccumulatedBell();
      setSundayRetryNotice(`Milhar ${dummyNumber} não foi comprada!`);
      setSundayCountdown(3);

      // Contagem regressiva de 3 segundos
      await new Promise<void>((resolve) => {
        let count = 3;
        const interval = setInterval(() => {
          count--;
          setSundayCountdown(count);
          sounds.playRollTick();
          if (count <= 0) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });

      setSundayRetryNotice(null);

      // Segundo giro: gira e cai no vencedor oficial garantido!
      await spinDrumsToTarget(drawResult.milhar);
    } else {
      // Sorteio diário padrão: gira uma única vez
      await spinDrumsToTarget(drawResult.milhar);
    }

    // Finaliza o sorteio e TRAVA para não repetir
    setIsSpinning(false);
    setDrawFinished(true);
    setFinalMilhar(drawResult.milhar);
    setResultWinner(drawResult.ganhador);
    setAccumulated(drawResult.sorteio.acumulado);

    // Feedback sonoro e visual
    if (drawResult.ganhador) {
      sounds.playWinFanfare();
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.5 }
      });
    } else {
      sounds.playAccumulatedBell();
    }
  };

  const formattedPrize = sorteio.premio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-emerald-950/90 to-slate-950 border-2 border-emerald-500/50 rounded-3xl shadow-2xl shadow-emerald-950 p-4 sm:p-8 overflow-hidden my-4 sm:my-6">
        
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título e Badge */}
        <div className="text-center mb-4 sm:mb-6 pt-2 sm:pt-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Sorteio Oficial das 19:00h</span>
          </div>
          <h2 className="text-xl sm:text-4xl font-black text-white tracking-tight">
            Arena da Sorte ao Vivo
          </h2>
          <p className="text-[11px] sm:text-sm text-emerald-300/80 mt-0.5">
            {isSpinning ? 'Sorteando os algarismos oficiais...' : 'Resultado Oficial do Sorteio'}
          </p>
        </div>

        {/* Premiação em Jogo */}
        <div className="bg-slate-950/80 rounded-2xl p-3 sm:p-4 border border-emerald-900/60 mb-5 sm:mb-6 text-center max-w-md mx-auto">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            {sorteio.acumulado ? 'Prêmio Acumulado em Disputa' : 'Prêmio em Disputa'}
          </span>
          <div className="text-2xl sm:text-4xl font-black text-amber-400">
            {formattedPrize}
          </div>
          {sorteio.eh_domingo && (
            <p className="text-[10px] sm:text-[11px] font-bold text-amber-300 mt-0.5 flex items-center justify-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Domingo da Sorte: Sai ganhador garantido!</span>
            </p>
          )}
        </div>

        {/* ALERTA DE DOMINGO: "NÃO HOUVE GANHADOR, VAMOS GIRAR NOVAMENTE!" */}
        {sundayRetryNotice && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white border-2 border-yellow-300 shadow-2xl animate-pulse text-center">
            <div className="flex items-center justify-center gap-2 font-black text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-yellow-200 shrink-0" />
              <span>{sundayRetryNotice}</span>
            </div>
            <div className="mt-2 text-xs sm:text-sm font-extrabold text-yellow-100 flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-yellow-300" />
              <span>Regra de Domingo: Não houve ganhador, vamos girar novamente em {sundayCountdown}s!</span>
            </div>
          </div>
        )}

        {/* OS 4 TAMBORES / DIGIT ROLLERS */}
        <div className="flex items-center justify-center gap-1.5 xs:gap-2.5 sm:gap-4 my-4 sm:my-6">
          {['Milhar', 'Centena', 'Dezena', 'Unidade'].map((label, index) => {
            const digit = digits[index];
            const isActive = activeDrum === index;
            const isLocked = digit !== '-' && !isActive;

            return (
              <div key={label} className="flex flex-col items-center flex-1 max-w-[76px] sm:max-w-[96px]">
                <div
                  className={`w-full h-18 xs:h-22 sm:h-36 rounded-xl sm:rounded-2xl flex items-center justify-center font-mono font-black text-3xl xs:text-4xl sm:text-6xl border-2 transition-all duration-200 shadow-xl ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-105 shadow-amber-500/30 animate-pulse'
                      : isLocked
                      ? 'bg-slate-950 border-emerald-400 text-emerald-300 shadow-emerald-900/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-600'
                  }`}
                >
                  <span>{digit}</span>
                </div>
                <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5 sm:mt-2">
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* FEEDBACK DO RESULTADO QUANDO FINALIZADO */}
        {drawFinished && (
          <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 animate-in fade-in zoom-in duration-300">
            {resultWinner ? (
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-6 text-center shadow-xl shadow-amber-500/20">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs sm:text-sm font-black uppercase mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>TEMOS UM GANHADOR!</span>
                </div>
                
                <h3 className="text-xl sm:text-3xl font-black text-white">
                  {resultWinner.nome_completo}
                </h3>
                
                <p className="text-xs sm:text-sm font-mono text-emerald-400 mt-1">
                  WhatsApp: <strong className="text-white">{maskPhoneNumber(resultWinner.whatsapp)}</strong>
                </p>

                <div className="mt-3 text-xs sm:text-sm text-slate-300 bg-slate-950/80 py-2 px-4 rounded-xl inline-block border border-slate-800">
                  Milhar Premiada: <span className="font-mono font-bold text-amber-400 text-base sm:text-lg">{finalMilhar || digits.join('')}</span> • Prêmio: <span className="font-bold text-emerald-400">{formattedPrize}</span>
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-green-950/60 border border-green-700/50 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-green-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Mensagem de parabéns enviada automaticamente para o WhatsApp do ganhador!</span>
                  </div>
                  {resultWinner.whatsapp && (
                    <a
                      href={generateWhatsAppWebLink(
                        resultWinner.whatsapp,
                        WhatsAppTemplates.parabenizacaoGanhador({
                          nomeCompleto: resultWinner.nome_completo,
                          milhar: finalMilhar || digits.join(''),
                          premio: sorteio.premio
                        })
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs shadow transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Abrir Conversa</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/90 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-6 text-center shadow-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-black uppercase mb-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>ACUMULOU!</span>
                </div>
                <h3 className="text-base sm:text-xl font-extrabold text-white">
                  Nenhum bilhete com a milhar <span className="text-amber-400 font-mono font-black">{finalMilhar || digits.join('')}</span> foi comprado hoje.
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2">
                  O prêmio acumulou mais <strong className="text-emerald-400">R$ 500,00</strong> para o sorteio de amanhã às 19:00h!
                </p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                  Os bilhetes anteriores foram zerados e todos os 10.000 números já estão liberados para novas compras.
                </p>
              </div>
            )}
          </div>
        )}

        {/* BOTÃO PARA FECHAR E PARAR (SEM LOOPS) */}
        <div className="flex items-center justify-center pt-3 sm:pt-4 border-t border-emerald-900/50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all active:scale-95"
          >
            <span>Fechar e Acompanhar Próxima Rodada</span>
          </button>
        </div>

      </div>
    </div>
  );
};
