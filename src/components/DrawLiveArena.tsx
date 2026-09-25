'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Trophy, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Crown,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Sorteio, Usuario, Bilhete, Mensagem } from '@/types';
import { sounds } from '@/lib/sound';
import { maskPhoneNumber, getFirstName } from '@/lib/whatsapp';

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
}

export const DrawLiveArena: React.FC<DrawLiveArenaProps> = ({
  isOpen,
  onClose,
  sorteio,
  soldTickets,
  usuarios,
  onExecuteDraw,
  onStartNewCycle
}) => {
  // Estado dos 4 dígitos sorteados (milhar, centena, dezena, unidade)
  const [digits, setDigits] = useState<[string, string, string, string]>(['-', '-', '-', '-']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeDrum, setActiveDrum] = useState<number>(-1); // qual tambor está girando (0 a 3)
  const [resultWinner, setResultWinner] = useState<Usuario | null>(null);
  const [drawFinished, setDrawFinished] = useState(false);
  const [accumulated, setAccumulated] = useState(false);
  const [sundaySpinCount, setSundaySpinCount] = useState(0);
  const [lastDispatchedMessages, setLastDispatchedMessages] = useState<Mensagem[]>([]);

  // Inicializa caso o sorteio já tenha acontecido
  useEffect(() => {
    if (sorteio.status === 'finalizado' && sorteio.numeros_sorteados) {
      const chars = sorteio.numeros_sorteados.split('') as [string, string, string, string];
      setDigits(chars);
      setDrawFinished(true);
      setResultWinner(sorteio.ganhador || null);
      setAccumulated(sorteio.acumulado);
    } else {
      setDigits(['-', '-', '-', '-']);
      setDrawFinished(false);
      setResultWinner(null);
      setAccumulated(false);
    }
  }, [sorteio]);

  if (!isOpen) return null;

  // Animação dramática de sorteio algarismo por algarismo
  const runDrawAnimation = async (options?: { forcedWinnerMilhar?: string; isSunday?: boolean }) => {
    setIsSpinning(true);
    setDrawFinished(false);
    setResultWinner(null);
    setAccumulated(false);

    // Chama a lógica de backend / store para obter o resultado oficial
    const drawResult = await onExecuteDraw(options);
    const targetDigits = drawResult.milhar.split('');

    // Rola cada tambor sequencialmente (milhar -> centena -> dezena -> unidade)
    for (let drumIdx = 0; drumIdx < 4; drumIdx++) {
      setActiveDrum(drumIdx);

      // Falso giro rápido gerando números aleatórios
      const spinDuration = 900 + drumIdx * 400; // Cada tambor demora um pouco mais aumentando a tensão!
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
        }, 60);
      });

      // Pequena pausa dramática antes do próximo algarismo
      await new Promise((r) => setTimeout(r, 200));
    }

    setActiveDrum(-1);
    setIsSpinning(false);
    setDrawFinished(true);
    setResultWinner(drawResult.ganhador);
    setAccumulated(drawResult.sorteio.acumulado);
    setLastDispatchedMessages(drawResult.mensagensGeradas);

    if (drawResult.ganhador) {
      sounds.playWinFanfare();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
    } else {
      sounds.playAccumulatedBell();
    }
  };

  const formattedPrize = sorteio.premio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-emerald-950/90 to-slate-950 border-2 border-emerald-500/50 rounded-3xl shadow-2xl shadow-emerald-950 p-6 sm:p-8 overflow-hidden my-6">
        
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título e Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider mb-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Sorteio Oficial das 19:00h</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Arena da Sorte ao Vivo
          </h2>
          <p className="text-xs sm:text-sm text-emerald-300/80 mt-1">
            4 algarismos sorteados um a um até formar a milhar vencedora (0000 a 9999)
          </p>
        </div>

        {/* Premiação em Jogo */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-emerald-900/60 mb-8 text-center max-w-md mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {sorteio.acumulado ? 'Prêmio Acumulado em Disputa' : 'Prêmio em Disputa'}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-amber-400">
            {formattedPrize}
          </div>
          {sorteio.eh_domingo && (
            <p className="text-[11px] font-bold text-amber-300 mt-1 flex items-center justify-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Domingo da Sorte: Sai ganhador garantido!</span>
            </p>
          )}
        </div>

        {/* OS 4 TAMBORES / DIGIT ROLLERS */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 my-6">
          {['Milhar', 'Centena', 'Dezena', 'Unidade'].map((label, index) => {
            const digit = digits[index];
            const isActive = activeDrum === index;
            const isLocked = digit !== '-' && !isActive;

            return (
              <div key={label} className="flex flex-col items-center">
                <div
                  className={`w-16 h-24 sm:w-24 sm:h-36 rounded-2xl flex items-center justify-center font-mono font-black text-4xl sm:text-6xl border-2 transition-all duration-200 shadow-xl ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-105 shadow-amber-500/30 animate-pulse'
                      : isLocked
                      ? 'bg-slate-950 border-emerald-400 text-emerald-300 shadow-emerald-900/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-600'
                  }`}
                >
                  <span>{digit}</span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* FEEDBACK DO RESULTADO */}
        {drawFinished && (
          <div className="mt-6 mb-6 animate-in fade-in zoom-in duration-300">
            {resultWinner ? (
              // TEMOS UM GANHADOR!
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-amber-400/80 rounded-2xl p-5 text-center shadow-xl shadow-amber-500/20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>TEMOS UM GANHADOR!</span>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {getFirstName(resultWinner.nome_completo)}
                </h3>
                
                <p className="text-sm font-mono text-emerald-400 mt-1">
                  Telefone: <strong className="text-white">{maskPhoneNumber(resultWinner.whatsapp)}</strong>
                </p>

                <div className="mt-3 text-xs text-slate-300 bg-slate-950/80 py-2 px-4 rounded-xl inline-block border border-slate-800">
                  Bilhete Premiado: <span className="font-mono font-bold text-amber-400 text-base">{digits.join('')}</span> • Prêmio: <span className="font-bold text-emerald-400">{formattedPrize}</span>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mensagem de parabenização enviada automaticamente no WhatsApp!</span>
                </div>
              </div>
            ) : (
              // NÃO HOUVE GANHADOR -> ACUMULOU
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-5 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase mb-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>ACUMULOU!</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Nenhum bilhete com a milhar {digits.join('')} foi comprado hoje.
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  O prêmio acumulou mais R$ 500,00 e o próximo sorteio será amanhã às 19:00h!
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Notificação de acúmulo disparada no WhatsApp para os cadastrados.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOTÕES DE CONTROLE E SIMULAÇÃO */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-emerald-900/50">
          
          {/* Botão de Rodar Sorteio */}
          {!drawFinished ? (
            <button
              onClick={() => runDrawAnimation()}
              disabled={isSpinning}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-base shadow-xl shadow-red-900/40 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isSpinning ? 'Sorteando Dígitos...' : 'Iniciar Sorteio (Simular 19:00)'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onStartNewCycle();
                setDrawFinished(false);
                setDigits(['-', '-', '-', '-']);
                setResultWinner(null);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Preparar Próximo Sorteio Diário</span>
            </button>
          )}

          {/* Testes Especiais para Validação das Regras */}
          {!isSpinning && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Forçar Sorteio com Ganhador (para ver a celebração e mensagem) */}
              {soldTickets.length > 0 && !drawFinished && (
                <button
                  onClick={() => {
                    const randomSold = soldTickets[Math.floor(Math.random() * soldTickets.length)].numero_milhar;
                    runDrawAnimation({ forcedWinnerMilhar: randomSold });
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors"
                  title="Garante que sairá uma das milhares vendidas para testar o fluxo de vencedor"
                >
                  ⚡ Testar Ganhador
                </button>
              )}

              {/* Simular Domingo da Sorte (Roleta até sair um vencedor) */}
              {!drawFinished && (
                <button
                  onClick={() => runDrawAnimation({ isSunday: true })}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors"
                  title="Simula a regra especial de domingo onde a roleta gira até sair ganhador"
                >
                  👑 Domingo da Sorte
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
