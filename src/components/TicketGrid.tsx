'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Dices, 
  Check, 
  X, 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Bilhete } from '@/types';
import { sounds } from '@/lib/sound';
import { isSalesCutoffActive } from '@/lib/drawTime';

interface TicketGridProps {
  soldTickets: Bilhete[];
  myTickets: Bilhete[];
  selectedNumbers: string[];
  onToggleNumber: (num: string) => void;
  onSelectMultiple: (nums: string[]) => void;
  onClearSelection: () => void;
  onCheckout: () => void;
}

const PAGE_SIZE = 100; // 100 números por página para máxima velocidade e fluidez visual

export const TicketGrid: React.FC<TicketGridProps> = ({
  soldTickets,
  myTickets,
  selectedNumbers,
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

  // Estado de busca e navegação
  const [searchTerm, setSearchTerm] = useState('');
  const [groupIndex, setGroupIndex] = useState(0); // 0 a 9 (grupos de 1.000: 0000-0999, 1000-1999, etc.)
  const [pageIndex, setPageIndex] = useState(0); // Páginas de 100 dentro do grupo (0 a 9)
  const [filterType, setFilterType] = useState<'all' | 'available' | 'my' | 'sold'>('all');

  // Mapeamentos em Map / Set para consulta O(1) instantânea
  const soldSet = useMemo(() => {
    return new Set(soldTickets.map(b => b.numero_milhar));
  }, [soldTickets]);

  const mySet = useMemo(() => {
    return new Set(myTickets.map(b => b.numero_milhar));
  }, [myTickets]);

  const selectedSet = useMemo(() => {
    return new Set(selectedNumbers);
  }, [selectedNumbers]);

  // Lista de grupos de 1.000 (0000-0999, 1000-1999, etc.)
  const groups = [
    { label: '0000 - 0999', start: 0, end: 999 },
    { label: '1000 - 1999', start: 1000, end: 1999 },
    { label: '2000 - 2999', start: 2000, end: 2999 },
    { label: '3000 - 3999', start: 3000, end: 3999 },
    { label: '4000 - 4999', start: 4000, end: 4999 },
    { label: '5000 - 5999', start: 5000, end: 5999 },
    { label: '6000 - 6999', start: 6000, end: 6999 },
    { label: '7000 - 7999', start: 7000, end: 7999 },
    { label: '8000 - 8999', start: 8000, end: 8999 },
    { label: '9000 - 9999', start: 9000, end: 9999 },
  ];

  // Cálculo dos números visíveis baseado em busca e filtros
  const visibleNumbers = useMemo(() => {
    const cleanSearch = searchTerm.trim();

    // Se o usuário digitou uma busca específica
    if (cleanSearch) {
      const results: string[] = [];
      for (let i = 0; i < 10000; i++) {
        const numStr = i.toString().padStart(4, '0');
        if (numStr.includes(cleanSearch)) {
          const isSold = soldSet.has(numStr);
          const isMy = mySet.has(numStr);

          if (filterType === 'available' && isSold) continue;
          if (filterType === 'my' && !isMy) continue;
          if (filterType === 'sold' && !isSold) continue;

          results.push(numStr);
          if (results.length >= 200) break; // Limite de visualização na busca para não travar
        }
      }
      return results;
    }

    // Navegação padrão por Grupos de 1.000 e Páginas de 100
    const startRange = groupIndex * 1000 + pageIndex * PAGE_SIZE;
    const endRange = startRange + PAGE_SIZE;

    const results: string[] = [];
    for (let i = startRange; i < endRange && i < 10000; i++) {
      const numStr = i.toString().padStart(4, '0');
      const isSold = soldSet.has(numStr);
      const isMy = mySet.has(numStr);

      if (filterType === 'available' && isSold) continue;
      if (filterType === 'my' && !isMy) continue;
      if (filterType === 'sold' && !isSold) continue;

      results.push(numStr);
    }

    return results;
  }, [searchTerm, groupIndex, pageIndex, filterType, soldSet, mySet]);

  // Função Surpresinha (Gerador da Sorte de milhares aleatórios não vendidos)
  const handleSurpresinha = (quantity: number) => {
    sounds.playClick();
    const availablePool: string[] = [];

    for (let i = 0; i < 10000; i++) {
      const numStr = i.toString().padStart(4, '0');
      if (!soldSet.has(numStr) && !selectedSet.has(numStr)) {
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
    if (soldSet.has(numStr)) return;
    sounds.playClick();
    onToggleNumber(numStr);
  };

  const totalAmount = selectedNumbers.length * 2.00;

  return (
    <section id="ticket-grid-section" className="w-full my-6 sm:my-8 scroll-mt-20 sm:scroll-mt-24 pb-20 sm:pb-8">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bilhetes Disponíveis de 0000 a 9999</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            Escolha suas Milhares da Sorte
          </h2>
          <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
            Toque no número desejado para reservar e pagar via Pix. R$ 2,00 por milhar.
          </p>
        </div>

        {/* Gerador Surpresinha */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-slate-900/90 border border-emerald-800/40 p-1.5 sm:p-2 rounded-2xl w-full md:w-auto">
          <div className="flex items-center gap-1 px-1.5 text-xs font-semibold text-emerald-300">
            <Dices className="w-4 h-4 text-amber-400" />
            <span>Surpresinha:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSurpresinha(1)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 transition-colors"
              title="Escolher 1 número aleatório"
            >
              +1
            </button>
            <button
              onClick={() => handleSurpresinha(3)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 transition-colors"
              title="Escolher 3 números aleatórios"
            >
              +3
            </button>
            <button
              onClick={() => handleSurpresinha(5)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 transition-colors"
              title="Escolher 5 números aleatórios"
            >
              +5
            </button>
            <button
              onClick={() => handleSurpresinha(10)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white shadow-sm transition-all"
              title="Escolher 10 números aleatórios"
            >
              +10
            </button>
          </div>
        </div>
      </div>

      {/* Aviso de Vendas Encerradas das 18:55 às 19:05 */}
      {isCutoff && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 mb-4 flex items-center gap-3 text-amber-300 text-xs sm:text-sm animate-pulse">
          <Clock className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <strong className="block text-white font-bold">Vendas encerradas para o sorteio de hoje (às 18:55h)</strong>
            <span>O sorteio oficial acontece às 19:00h! A nova rodada de vendas abrirá logo após a apuração.</span>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900/70 border border-emerald-900/40 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/70" />
            <input
              type="text"
              placeholder="Buscar milhar (ex: 1234)"
              maxLength={4}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value.replace(/\D/g, ''));
                setPageIndex(0);
              }}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-950 border border-emerald-900/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Abas de Filtro de Status */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'available'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Disponíveis
            </button>
            <button
              onClick={() => setFilterType('my')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'my'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Meus ({myTickets.length})
            </button>
            <button
              onClick={() => setFilterType('sold')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'sold'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Vendidos
            </button>
          </div>

          {/* Indicador de Legenda Visual em telas grandes */}
          <div className="hidden lg:flex items-center gap-3 ml-auto text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-950 border border-emerald-600" />
              <span>Livre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 border border-amber-300" />
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-600 border border-cyan-400" />
              <span>Meu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-800/80 border border-slate-700" />
              <span>Vendido</span>
            </div>
          </div>

        </div>

        {/* Grupos de Milhares (0000-0999, etc.) - desativa se estiver buscando */}
        {!searchTerm && (
          <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Grupo:
              </span>
              {groups.map((grp, idx) => (
                <button
                  key={grp.label}
                  onClick={() => {
                    setGroupIndex(idx);
                    setPageIndex(0);
                  }}
                  className={`px-2 py-1 rounded-lg font-mono text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap ${
                    groupIndex === idx
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {grp.label}
                </button>
              ))}
            </div>

            {/* Sub-paginação dentro do grupo (páginas de 100) */}
            <div className="flex items-center justify-between mt-2.5 text-xs text-slate-400">
              <button
                disabled={pageIndex === 0}
                onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 text-[11px] sm:text-xs"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Voltar 100</span>
              </button>

              <span className="font-mono text-emerald-400 font-semibold text-[11px] sm:text-xs">
                {groupIndex * 1000 + pageIndex * PAGE_SIZE} a {groupIndex * 1000 + (pageIndex + 1) * PAGE_SIZE - 1}
              </span>

              <button
                disabled={pageIndex >= 9}
                onClick={() => setPageIndex(p => Math.min(9, p + 1))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 text-[11px] sm:text-xs"
              >
                <span>Mais 100</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Grade de Milhares - 4 a 5 colunas em celular, até 10 em desktop */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2.5">
        {visibleNumbers.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-sm font-semibold">Nenhum bilhete encontrado com esses filtros.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          visibleNumbers.map((numStr) => {
            const isSold = soldSet.has(numStr);
            const isMy = mySet.has(numStr);
            const isSelected = selectedSet.has(numStr);

            let buttonClass = 'bg-slate-950/80 hover:bg-emerald-950/60 border-emerald-900/60 text-emerald-200 hover:border-emerald-500 shadow-sm';
            
            if (isSelected) {
              buttonClass = 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-105 z-10';
            } else if (isMy) {
              buttonClass = 'bg-cyan-950/90 border-cyan-500 text-cyan-300 shadow-sm cursor-default';
            } else if (isSold) {
              buttonClass = 'bg-slate-900/50 border-slate-800/80 text-slate-600 line-through cursor-not-allowed';
            }

            return (
              <button
                key={numStr}
                disabled={isSold}
                onClick={() => handleNumberClick(numStr)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 sm:p-2.5 rounded-xl border text-xs sm:text-base font-mono font-bold transition-all duration-150 transform active:scale-95 min-h-[42px] sm:min-h-[48px] ${buttonClass}`}
                title={
                  isSelected
                    ? `Milhar ${numStr} selecionado para compra`
                    : isMy
                    ? `Milhar ${numStr} já comprado por você!`
                    : isSold
                    ? `Milhar ${numStr} já vendido`
                    : `Comprar milhar ${numStr} por R$ 2,00`
                }
              >
                <span>{numStr}</span>

                {/* Badges de Estado */}
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-950 text-amber-400 rounded-full flex items-center justify-center text-[9px] border border-amber-400">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </span>
                )}
                {isMy && (
                  <span className="text-[8px] font-sans font-bold tracking-tight text-cyan-400 uppercase">
                    Meu
                  </span>
                )}
                {isSold && (
                  <span className="absolute -top-1 -right-1 text-slate-600">
                    <Lock className="w-2 h-2" />
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Barra Flutuante de Carrinho / Checkout Pix (Acima da BottomNav no celular) */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 max-w-3xl mx-auto z-40 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="bg-slate-950/95 backdrop-blur-md border-2 border-emerald-500 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black flex items-center justify-between gap-2 sm:gap-4">
            
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
