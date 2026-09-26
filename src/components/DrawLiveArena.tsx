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
  MessageCircle,
  Clock
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
    girosDomingo?: string[];
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

  // ⏱️ REGRA DO CLIENTE: Fechar automaticamente o modal após 1 minuto (60 segundos)
  const [autoCloseSeconds, setAutoCloseSeconds] = useState<number>(60);

  useEffect(() => {
    if (!drawFinished || !isOpen) {
      setAutoCloseSeconds(60);
      return;
    }
    const timer = setInterval(() => {
      setAutoCloseSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [drawFinished, isOpen, onClose]);

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

    // 🌟 REGRA ESPECIAL DE DOMINGO (4 GIROS NA TELA):
    // Giros 1, 2 e 3: Não houve ganhador nesta rodada, vamos girar novamente!
    // Giro 4: Cai na milhar vencedora, toca fanfarra, envia WhatsApp e libera o prêmio!
    if (isSunday && (drawResult.girosDomingo || drawResult.ganhador)) {
      const serverSpins = drawResult.girosDomingo && drawResult.girosDomingo.length === 4
        ? drawResult.girosDomingo
        : null;

      const soldNumbers = new Set(soldTickets.map(b => b.numero_milhar));
      soldNumbers.add(drawResult.milhar);

      // Executa os 3 primeiros giros sem ganhador (utilizando os números idênticos enviados pelo servidor)
      for (let round = 1; round <= 3; round++) {
        let dummyNumber = serverSpins
          ? serverSpins[round - 1]
          : String(Math.floor(Math.random() * 10000)).padStart(4, '0');

        // Gira os 4 tambores até o número dummy oficial
        await spinDrumsToTarget(dummyNumber);

        // Som de alerta e banner de aviso
        sounds.playAccumulatedBell();
        setSundayRetryNotice(`Milhar ${dummyNumber} não foi comprada! Não houve ganhador na ${round}ª rodada.`);
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
      }

      // 4º Giro Triunfal: Gira e cai na milhar vencedora oficial garantida!
      await spinDrumsToTarget(drawResult.milhar);
    } else {
      // Sorteio diário padrão (Segunda a Sábado): gira uma única vez diretamente para a milhar oficial
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl md:max-w-2xl bg-gradient-to-b from-slate-900 via-emerald-950/90 to-slate-950 border-2 border-emerald-500/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-950 p-3 sm:p-5 md:p-6 overflow-hidden my-auto max-h-[94vh] flex flex-col justify-between">
        
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Título e Badge */}
        <div className="text-center mb-2 sm:mb-3 pt-0.5 sm:pt-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] sm:text-[11px] font-black uppercase tracking-wider mb-1 sm:mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>Sorteio Oficial das 19:00h</span>
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Arena da Sorte ao Vivo
          </h2>
          <p className="text-[10px] sm:text-xs text-emerald-300/80 mt-0.5">
            {isSpinning ? 'Sorteando os algarismos oficiais...' : 'Resultado Oficial do Sorteio'}
          </p>
        </div>

        {/* Premiação em Jogo */}
        <div className="bg-slate-950/80 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-emerald-900/60 mb-2 sm:mb-3 text-center max-w-sm sm:max-w-md mx-auto w-full">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {sorteio.acumulado ? 'Prêmio Acumulado em Disputa' : 'Prêmio em Disputa'}
          </span>
          <div className="text-xl sm:text-3xl md:text-4xl font-black text-amber-400">
            {formattedPrize}
          </div>
          {sorteio.eh_domingo && (
            <p className="text-[9px] sm:text-[10px] font-bold text-amber-300 mt-0.5 flex items-center justify-center gap-1">
              <Crown className="w-3 h-3" />
              <span>Domingo da Sorte: Sai ganhador garantido!</span>
            </p>
          )}
        </div>

        {/* ALERTA DE DOMINGO: "NÃO HOUVE GANHADOR, VAMOS GIRAR NOVAMENTE!" */}
        {sundayRetryNotice && (
          <div className="mb-2 sm:mb-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white border-2 border-yellow-300 shadow-xl animate-pulse text-center">
            <div className="flex items-center justify-center gap-2 font-black text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-200 shrink-0" />
              <span>{sundayRetryNotice}</span>
            </div>
            <div className="mt-1 text-[11px] sm:text-xs font-extrabold text-yellow-100 flex items-center justify-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-yellow-300" />
              <span>Regra de Domingo: Não houve ganhador, vamos girar novamente em {sundayCountdown}s!</span>
            </div>
          </div>
        )}

        {/* OS 4 TAMBORES / DIGIT ROLLERS */}
        <div className="flex items-center justify-center gap-1.5 xs:gap-2.5 sm:gap-3.5 my-2 sm:my-3">
          {['Milhar', 'Centena', 'Dezena', 'Unidade'].map((label, index) => {
            const digit = digits[index];
            const isActive = activeDrum === index;
            const isLocked = digit !== '-' && !isActive;

            return (
              <div key={label} className="flex flex-col items-center flex-1 max-w-[68px] sm:max-w-[84px] md:max-w-[92px]">
                <div
                  className={`w-full h-15 xs:h-18 sm:h-22 md:h-24 rounded-xl sm:rounded-2xl flex items-center justify-center font-mono font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl border-2 transition-all duration-200 shadow-lg ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-105 shadow-amber-500/30 animate-pulse'
                      : isLocked
                      ? 'bg-slate-950 border-emerald-400 text-emerald-300 shadow-emerald-900/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-600'
                  }`}
                >
                  <span>{digit}</span>
                </div>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* FEEDBACK DO RESULTADO QUANDO FINALIZADO */}
        {drawFinished && (
          <div className="mt-2 sm:mt-3 mb-2 sm:mb-3 animate-in fade-in zoom-in duration-300">
            {resultWinner ? (
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-amber-400/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-lg shadow-amber-500/20">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] sm:text-xs font-black uppercase mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>TEMOS UM GANHADOR!</span>
                </div>
                
                <h3 className="text-base sm:text-xl md:text-2xl font-black text-white">
                  {resultWinner.nome_completo}
                </h3>
                
                <p className="text-[11px] sm:text-xs font-mono text-emerald-400 mt-0.5">
                  WhatsApp: <strong className="text-white">{maskPhoneNumber(resultWinner.whatsapp)}</strong>
                </p>

                <div className="mt-2 text-[11px] sm:text-xs text-slate-300 bg-slate-950/80 py-1 px-3 rounded-lg inline-block border border-slate-800">
                  Milhar Premiada: <span className="font-mono font-bold text-amber-400 text-sm sm:text-base">{finalMilhar || digits.join('')}</span> • Prêmio: <span className="font-bold text-emerald-400">{formattedPrize}</span>
                </div>

                <div className="mt-2.5 p-2 rounded-lg bg-green-950/60 border border-green-700/50 flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] sm:text-xs text-green-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] shadow transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Abrir Conversa</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/90 border-2 border-amber-500/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-lg">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-black uppercase mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>ACUMULOU!</span>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-white">
                  Nenhum bilhete com a milhar <span className="text-amber-400 font-mono font-black">{finalMilhar || digits.join('')}</span> foi comprado hoje.
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                  O prêmio acumulou mais <strong className="text-emerald-400">R$ 500,00</strong> para o sorteio de amanhã às 19:00h!
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  Os bilhetes anteriores foram zerados e todos os 10.000 números já estão liberados para novas compras.
                </p>
              </div>
            )}
          </div>
        )}

        {/* BOTÃO PARA FECHAR E PARAR (COM TIMER DE 1 MINUTO) */}
        <div className="flex flex-col items-center justify-center pt-2 sm:pt-3 border-t border-emerald-900/50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all active:scale-95"
          >
            <span>Fechar e Acompanhar Próxima Rodada</span>
          </button>
          {drawFinished && (
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] sm:text-xs text-slate-400 font-semibold">
              <Clock className="w-3 h-3 text-amber-400 animate-spin" />
              <span>Esta tela fechará automaticamente em <strong className="text-amber-400 font-mono font-bold text-xs sm:text-sm">{autoCloseSeconds}s</strong></span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
