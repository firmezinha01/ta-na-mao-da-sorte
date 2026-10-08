'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Dices, 
  Check, 
  X, 
  Lock, 
  ShoppingCart,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trash2,
  Ticket
} from 'lucide-react';
import { Bilhete, Usuario } from '@/types';
import { sounds } from '@/lib/sound';
import { isSalesCutoffActive } from '@/lib/drawTime';

interface TicketGridProps {
  soldTickets: Bilhete[];
  reservedTickets?: string[];
  myTickets: Bilhete[];
  selectedNumbers: string[];
  currentUser: Usuario | null;
  onRequireLogin: (reason?: string) => void;
  onToggleNumber: (num: string) => void;
  onSelectMultiple: (nums: string[]) => void;
  onClearSelection: () => void;
  onCheckout: () => void;
}

export const TicketGrid: React.FC<TicketGridProps> = ({
  soldTickets,
  reservedTickets = [],
  myTickets,
  selectedNumbers,
  currentUser,
  onRequireLogin,
  onToggleNumber,
  onSelectMultiple,
  onClearSelection,
  onCheckout
}) => {
  // Estado de bloqueio das vendas (18:55 às 19:05)
  const [isCutoff, setIsCutoff] = useState(false);

  useEffect(() => {
    const check = () => setIsCutoff(isSalesCutoffActive());
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Campo de busca da milhar desejada (ex: 1234)
  const [searchTerm, setSearchTerm] = useState('');

  // Mapeamentos em Map / Set para consulta O(1) instantânea
  const soldSet = useMemo(() => {
    return new Set(soldTickets.map(b => b.numero_milhar));
  }, [soldTickets]);

  const reservedSet = useMemo(() => {
    return new Set(reservedTickets || []);
  }, [reservedTickets]);

  const mySet = useMemo(() => {
    return new Set(myTickets.map(b => b.numero_milhar));
  }, [myTickets]);

  const selectedSet = useMemo(() => {
    return new Set(selectedNumbers);
  }, [selectedNumbers]);

  // Função Surpresinha (Gerador da Sorte de milhares aleatórios não vendidos e não reservados)
  const handleSurpresinha = (quantity: number) => {
    if (!currentUser) {
      onRequireLogin('Para gerar bilhetes da Surpresinha, preencha seu Nome, CPF e WhatsApp antes.');
      return;
    }
    sounds.playClick();
    const availablePool: string[] = [];

    for (let i = 0; i < 10000; i++) {
      const numStr = i.toString().padStart(4, '0');
      if (!soldSet.has(numStr) && !reservedSet.has(numStr) && !selectedSet.has(numStr)) {
        availablePool.push(numStr);
      }
    }

    if (availablePool.length === 0) {
      alert('Não há mais números disponíveis para este sorteio!');
      return;
    }

    const picked: string[] = [];
    for (let i = 0; i < quantity && availablePool.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availablePool.length);
      picked.push(availablePool[randomIndex]);
      availablePool.splice(randomIndex, 1);
    }

    onSelectMultiple([...selectedNumbers, ...picked]);
  };

  const handleNumberClick = (numStr: string) => {
    if (soldSet.has(numStr) || reservedSet.has(numStr)) return;
    if (!currentUser) {
      onRequireLogin(`Para escolher a milhar ${numStr}, preencha seu Nome, CPF e WhatsApp antes.`);
      return;
    }
    sounds.playClick();
    onToggleNumber(numStr);
  };

  const totalAmount = selectedNumbers.length * 2.00;

  // Análise da milhar digitada no campo de busca
  const cleanSearch = searchTerm.trim().replace(/\D/g, '').slice(0, 4);
  const isCompleteMilhar = cleanSearch.length === 4;

  const isSold = isCompleteMilhar && soldSet.has(cleanSearch);
  const isReserved = isCompleteMilhar && reservedSet.has(cleanSearch) && !isSold;
  const isMy = isCompleteMilhar && mySet.has(cleanSearch);
  const isSelected = isCompleteMilhar && selectedSet.has(cleanSearch);
  const isAvailable = isCompleteMilhar && !isSold && !isReserved;

  return (
    <section id="ticket-grid-section" className="w-full my-6 sm:my-8 scroll-mt-20 sm:scroll-mt-24 pb-20 sm:pb-8">
      
      {/* Aviso quando o usuário ainda não entrou */}
      {!currentUser && (
        <div className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-2 border-emerald-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl shadow-emerald-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <UserCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>Identificação Obrigatória para Escolher Números</span>
              </p>
              <p className="text-xs text-slate-300">
                Preencha seu <strong>Nome, CPF e WhatsApp</strong> para liberar a escolha das milhares e garantir seu prêmio de R$ 500,00.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRequireLogin('Informe seus dados para poder selecionar suas milhares da sorte.')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer text-center"
          >
            Entrar / Preencher Dados →
          </button>
        </div>
      )}

      {/* Aviso de Vendas Encerradas das 18:55 às 19:05 */}
      {isCutoff && (
        <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 mb-5 flex items-center gap-3.5 text-amber-300 text-xs sm:text-sm animate-pulse shadow-xl">
          <Clock className="w-6 h-6 shrink-0 text-amber-400" />
          <div>
            <strong className="block text-white font-bold text-sm sm:text-base">Vendas encerradas para o sorteio de hoje (às 18:55h)</strong>
            <span>O sorteio oficial acontece às 19:00h! A nova rodada de vendas abrirá logo após a apuração com o prêmio de R$ 500,00.</span>
          </div>
        </div>
      )}

      {/* CARD PRINCIPAL SUPER DESTACADO: BUSCAR MILHAR */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 sm:border-3 border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.25)] p-5 sm:p-8 mb-6">
        
        {/* Glow decorativo de fundo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* Badge de Destaque */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-xs sm:text-sm font-black uppercase tracking-wider mb-2 sm:mb-3 shadow-md">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>🎯 ESCOLHA SEU NÚMERO DA SORTE (0000 A 9999)</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-1 sm:mb-2">
            Buscar Milhar Desejada
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mb-5 sm:mb-6">
            Digite abaixo os <strong>4 dígitos da milhar</strong> que você quer concorrer (ex: <strong>1234</strong>, <strong>0582</strong>, <strong>7777</strong>). O sistema informa instantaneamente se ela está <strong>disponível</strong> ou <strong>indisponível</strong>.
          </p>

          {/* CAMPO DE DIGITAÇÃO SUPER DESTACADO */}
          <div className="w-full max-w-md bg-slate-950/90 rounded-3xl p-4 sm:p-6 border-2 border-emerald-500/70 shadow-2xl shadow-emerald-950/80 mb-5">
            <label className="block text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider mb-2.5">
              👇 DIGITE SUA MILHAR AQUI (4 DÍGITOS):
            </label>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Ex: 1234"
                className="w-full text-center text-4xl sm:text-6xl font-mono font-black tracking-[0.35em] sm:tracking-[0.45em] py-4 sm:py-5 px-4 bg-slate-900 border-2 sm:border-3 border-emerald-400 rounded-2xl text-amber-300 placeholder-slate-700 focus:outline-none focus:border-amber-300 focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-inner"
                autoFocus={false}
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Limpar número"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Visualizador dos 4 Dígitos */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-3">
              {[0, 1, 2, 3].map((idx) => {
                const char = cleanSearch[idx];
                return (
                  <div
                    key={idx}
                    className={`py-2 rounded-xl border font-mono font-black text-lg sm:text-2xl text-center transition-all ${
                      char
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-600'
                    }`}
                  >
                    {char || '•'}
                  </div>
                );
              })}
            </div>

          </div>

          {/* PAINEL DE STATUS DA MILHAR DIGITADA */}
          {isCompleteMilhar ? (
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
              
              {/* CASO 1: INDISPONÍVEL (JÁ VENDIDA) */}
              {isSold && (
                <div className="bg-red-950/70 border-2 border-red-500/80 rounded-2xl p-4 sm:p-5 text-center space-y-2 shadow-xl shadow-red-950/50">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/40">
                    <Lock className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-white">
                    Milhar {cleanSearch}
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs uppercase tracking-wider">
                    ❌ INDISPONÍVEL (JÁ VENDIDA)
                  </div>
                  <p className="text-xs text-red-200 leading-relaxed">
                    Esta milhar já foi comprada por outro participante para o sorteio de hoje às 19:00h.
                  </p>
                  <p className="text-[11px] text-red-300 font-semibold pt-1">
                    💡 Digite outro número da sua sorte acima ou use a Surpresinha abaixo!
                  </p>
                </div>
              )}

              {/* CASO 2: INDISPONÍVEL (RESERVADA NO PIX) */}
              {isReserved && (
                <div className="bg-amber-950/70 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 text-center space-y-2 shadow-xl shadow-amber-950/50">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-white">
                    Milhar {cleanSearch}
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    ⏳ RESERVADA (AGUARDANDO PIX)
                  </div>
                  <p className="text-xs text-amber-200 leading-relaxed">
                    Esta milhar está temporariamente reservada no Pix por outro participante (validade de 15 minutos).
                  </p>
                  <p className="text-[11px] text-amber-300 font-semibold pt-1">
                    Se o pagamento não for realizado, ela será liberada novamente. Enquanto isso, escolha outro número!
                  </p>
                </div>
              )}

              {/* CASO 3: JÁ COMPRADA PELO PRÓPRIO PARTICIPANTE */}
              {isMy && (
                <div className="bg-cyan-950/70 border-2 border-cyan-400 rounded-2xl p-4 sm:p-5 text-center space-y-2 shadow-xl shadow-cyan-950/50">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 mx-auto flex items-center justify-center border border-cyan-500/40">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-white">
                    Milhar {cleanSearch}
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    🍀 ESTA MILHAR JÁ É SUA!
                  </div>
                  <p className="text-xs text-cyan-200 leading-relaxed">
                    Você já comprou e garantiu esta milhar para concorrer ao prêmio de R$ 500,00 de hoje às 19:00h!
                  </p>
                </div>
              )}

              {/* CASO 4: DISPONÍVEL PARA COMPRA! */}
              {isAvailable && (
                <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-2 sm:border-3 border-emerald-400 rounded-3xl p-5 sm:p-6 text-center space-y-3 shadow-2xl shadow-emerald-950">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40 shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  
                  <div>
                    <div className="font-mono text-3xl sm:text-4xl font-black text-amber-300 drop-shadow-md">
                      Milhar {cleanSearch}
                    </div>
                    <div className="inline-block mt-1 px-3.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-md">
                      ✅ MILHAR DISPONÍVEL!
                    </div>
                  </div>

                  <p className="text-xs text-emerald-200 font-semibold">
                    Valor: apenas <strong className="text-white text-sm">R$ 2,00</strong> no Pix
                  </p>

                  <button
                    onClick={() => handleNumberClick(cleanSearch)}
                    disabled={isCutoff}
                    className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all transform active:scale-95 shadow-xl cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/40 border-2 border-yellow-200'
                        : 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 hover:from-emerald-300 hover:to-green-400 text-slate-950 shadow-emerald-500/40 border-2 border-emerald-300'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>Milhar {cleanSearch} Selecionada! (Toque para Remover)</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>Adicionar Milhar {cleanSearch} ao Pedido (R$ 2,00)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          ) : cleanSearch.length > 0 ? (
            <div className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2">
              ⏳ Digite mais {4 - cleanSearch.length} número(s) para verificar a milhar de 4 dígitos.
            </div>
          ) : (
            <div className="text-[11px] sm:text-xs text-slate-400 bg-slate-950/50 rounded-xl px-4 py-2 border border-slate-800">
              💡 Dica: Você pode escolher qualquer combinação de 4 números (ex: seu ano de nascimento, final da placa, etc.).
            </div>
          )}

        </div>
      </div>

      {/* GERADOR DE SURPRESINHA (OPÇÃO RÁPIDA) */}
      <div className="bg-slate-900/80 border border-emerald-900/40 rounded-3xl p-4 sm:p-6 mb-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Não tem um número em mente? Gere uma Surpresinha
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                O sistema sorteia milhares aleatórias que estão 100% disponíveis para compra.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            <button
              onClick={() => handleSurpresinha(1)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/40 transition-colors shadow-sm"
              title="Escolher 1 milhar aleatória"
            >
              +1 Milhar
            </button>
            <button
              onClick={() => handleSurpresinha(3)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/40 transition-colors shadow-sm"
              title="Escolher 3 milhares aleatórias"
            >
              +3 Milhares
            </button>
            <button
              onClick={() => handleSurpresinha(5)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/40 transition-colors shadow-sm"
              title="Escolher 5 milhares aleatórias"
            >
              +5 Milhares
            </button>
            <button
              onClick={() => handleSurpresinha(10)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white shadow-md transition-all"
              title="Escolher 10 milhares aleatórias"
            >
              +10 Milhares
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO: SEUS BILHETES ESCOLHIDOS (CARRINHO) */}
      {selectedNumbers.length > 0 && (
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-4 sm:p-6 mb-6 shadow-2xl shadow-emerald-950 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  Seus Bilhetes Escolhidos ({selectedNumbers.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  R$ 2,00 por milhar • Concorrendo a R$ 500,00 às 19:00h
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total:</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <button
                onClick={onClearSelection}
                className="p-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
                title="Limpar todos os bilhetes selecionados"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chips dos números selecionados */}
          <div className="flex flex-wrap gap-2 pt-3.5 mb-4">
            {selectedNumbers.map((num) => (
              <span
                key={num}
                onClick={() => handleNumberClick(num)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/50 font-mono font-bold text-sm sm:text-base cursor-pointer hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition-colors shadow-sm group"
                title={`Clique para remover a milhar ${num}`}
              >
                <span>{num}</span>
                <X className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
              </span>
            ))}
          </div>

          {/* Botão de Finalização da Compra */}
          <button
            onClick={onCheckout}
            disabled={isCutoff}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-xl cursor-pointer ${
              isCutoff
                ? 'bg-amber-600/70 text-amber-100 cursor-not-allowed opacity-90'
                : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-emerald-500/40 border-2 border-emerald-300'
            }`}
          >
            {isCutoff ? (
              <span>Vendas Encerradas às 18:55 (Sorteio 19h)</span>
            ) : (
              <>
                <span>Pagar Pix:</span>
                <span className="font-black">
                  {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>
      )}

      {/* SEÇÃO: MEUS BILHETES COMPRADOS NA RODADA ATIVA */}
      {myTickets.length > 0 && (
        <div className="bg-slate-900/60 border border-cyan-500/40 rounded-3xl p-4 sm:p-5 text-center sm:text-left mb-6">
          <div className="flex items-center gap-2 mb-2 text-cyan-300 font-bold text-xs sm:text-sm">
            <Ticket className="w-4 h-4" />
            <span>Seus bilhetes comprados para hoje ({myTickets.length}):</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {myTickets.map((t) => (
              <span
                key={t.id || t.numero_milhar}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 font-mono font-bold text-xs"
              >
                {t.numero_milhar}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* BARRA FLUTUANTE DE CHECKOUT NO CELULAR (QUANDO HOUVER NÚMEROS SELECIONADOS) */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 max-w-3xl mx-auto z-40 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="bg-slate-950/95 backdrop-blur-md border-2 border-emerald-400 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black flex items-center justify-between gap-2 sm:gap-4">
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white">
                  <span>{selectedNumbers.length} {selectedNumbers.length === 1 ? 'bilhete' : 'bilhetes'}</span>
                  <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(R$ 2,00 cada)</span>
                </div>
                <div className="flex items-center gap-1 overflow-hidden truncate mt-0.5">
                  {selectedNumbers.slice(0, 3).map(num => (
                    <span
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] sm:text-xs font-mono font-bold"
                    >
                      {num}
                      <X className="w-2.5 h-2.5" />
                    </span>
                  ))}
                  {selectedNumbers.length > 3 && (
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">
                      +{selectedNumbers.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClearSelection}
                className="px-2 py-1.5 text-xs text-slate-400 hover:text-white transition-colors hidden sm:block"
              >
                Limpar
              </button>

              <button
                onClick={onCheckout}
                disabled={isCutoff}
                className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-black text-xs sm:text-base transition-all transform active:scale-95 ${
                  isCutoff
                    ? 'bg-amber-600/70 text-amber-100 cursor-not-allowed opacity-90 shadow-none'
                    : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                }`}
              >
                {isCutoff ? (
                  <span>Vendas Encerradas às 18:55 (Sorteio 19h)</span>
                ) : (
                  <>
                    <span>Pagar Pix:</span>
                    <span className="font-extrabold">
                      {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
