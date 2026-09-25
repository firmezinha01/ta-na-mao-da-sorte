'use client';

import React from 'react';
import { X, Ticket, Trophy, CheckCircle, Clock, Calendar } from 'lucide-react';
import { Bilhete, Sorteio, Usuario } from '@/types';

interface MyTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myTickets: Bilhete[];
  currentUser: Usuario | null;
  currentSorteio: Sorteio;
}

export const MyTicketsModal: React.FC<MyTicketsModalProps> = ({
  isOpen,
  onClose,
  myTickets,
  currentUser,
  currentSorteio
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-900/50 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                Meus Bilhetes da Sorte
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser ? `Participante: ${currentUser.nome_completo}` : 'Bilhetes salvos no seu dispositivo'}
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
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {myTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Ticket className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="font-bold text-white text-base">Você ainda não comprou bilhetes.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Escolha suas milhares favoritas na tabela principal por apenas R$ 2,00 cada e concorra hoje às 19h!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Total: {myTickets.length} bilhete(s)</span>
                <span>Sorteio diário às 19h</span>
              </div>

              {myTickets.map((bilhete) => {
                const isWinner = currentSorteio.status === 'finalizado' && currentSorteio.numeros_sorteados === bilhete.numero_milhar;

                return (
                  <div
                    key={bilhete.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isWinner
                        ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-950/80 border-slate-800 hover:border-emerald-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 font-mono font-black text-xl text-amber-400">
                          {bilhete.numero_milhar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              Milhar Oficial
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                              <CheckCircle className="w-2.5 h-2.5" />
                              Pix Pago
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Valor: R$ 2,00 • {new Date(bilhete.data_compra).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isWinner ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>PREMIADO!</span>
                          </div>
                        ) : currentSorteio.status === 'finalizado' ? (
                          <span className="text-[11px] font-medium text-slate-500">
                            Não sorteado
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                            <Clock className="w-3 h-3" />
                            <span>Concorrendo 19h</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Prêmio de hoje: R$ {currentSorteio.premio.toFixed(2)}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
