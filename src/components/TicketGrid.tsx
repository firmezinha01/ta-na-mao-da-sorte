'use client';

import React, { useState, useMemo } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { Bilhete } from '@/types';
import { sounds } from '@/lib/sound';

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

    // Busca até 500 números livres aleatórios para compor a escolha
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

    // Embaralha e seleciona a quantidade solicitada
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
    <section id="ticket-grid-section" className="w-full my-8 scroll-mt-24">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Bilhetes Disponíveis de 0000 a 9999</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Escolha suas Milhares da Sorte
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Clique no número desejado para reservar e pagar via Pix. Compre quantos bilhetes quiser!
          </p>
        </div>

        {/* Gerador Surpresinha */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-800/40 p-1.5 sm:p-2 rounded-2xl">
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-emerald-300">
            <Dices className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Surpresinha:</span>
          </div>
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

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900/70 border border-emerald-900/40 rounded-2xl p-3 sm:p-4 mb-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/70" />
            <input
              type="text"
              placeholder="Buscar milhar (ex: 1234 ou 77)"
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
              Vendidos ({soldTickets.length})
            </button>
          </div>

          {/* Indicador de Legenda Visual */}
          <div className="hidden lg:flex items-center gap-3 ml-auto text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-950 border border-emerald-600" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 border border-amber-300" />
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-600 border border-cyan-400" />
              <span>Meu Bilhete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-800/80 border border-slate-700" />
              <span>Vendido</span>
            </div>
          </div>

        </div>

        {/* Grupos de Milhares (0000-0999, etc.) - desativa se estiver buscando */}
        {!searchTerm && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs no-scrollbar">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Grupos:
              </span>
              {groups.map((grp, idx) => (
                <button
                  key={grp.label}
                  onClick={() => {
                    setGroupIndex(idx);
                    setPageIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-colors whitespace-nowrap ${
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
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
              <button
                disabled={pageIndex === 0}
                onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior (100)</span>
              </button>

              <span className="font-mono text-emerald-400 font-semibold">
                Mostrando {groupIndex * 1000 + pageIndex * PAGE_SIZE} a {groupIndex * 1000 + (pageIndex + 1) * PAGE_SIZE - 1}
              </span>

              <button
                disabled={pageIndex >= 9}
                onClick={() => setPageIndex(p => Math.min(9, p + 1))}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
              >
                <span>Próximo (100)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Grade de Milhares */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-2.5">
        {visibleNumbers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-base font-semibold">Nenhum bilhete encontrado com esses filtros.</p>
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
                className={`relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-sm sm:text-base font-mono font-bold transition-all duration-150 transform active:scale-95 ${buttonClass}`}
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
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-950 text-amber-400 rounded-full flex items-center justify-center text-[10px] border border-amber-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                {isMy && (
                  <span className="text-[9px] font-sans font-bold tracking-tight text-cyan-400 uppercase">
                    Meu
                  </span>
                )}
                {isSold && (
                  <span className="absolute -top-1 -right-1 text-slate-600">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Barra Flutuante de Carrinho / Checkout Pix */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="bg-slate-950/95 backdrop-blur-md border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl shadow-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-extrabold text-base">
                    {selectedNumbers.length} {selectedNumbers.length === 1 ? 'bilhete' : 'bilhetes'}
                  </span>
                  <span className="text-xs text-slate-400">
                    (R$ 2,00 cada)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap max-w-md mt-1">
                  {selectedNumbers.slice(0, 6).map(num => (
                    <span
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      title="Clique para remover"
                    >
                      {num}
                      <X className="w-2.5 h-2.5" />
                    </span>
                  ))}
                  {selectedNumbers.length > 6 && (
                    <span className="text-xs text-slate-400 font-semibold">
                      +{selectedNumbers.length - 6} outros
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={onClearSelection}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Limpar
              </button>

              <button
                onClick={onCheckout}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95"
              >
                <span>Pagar Pix:</span>
                <span className="font-extrabold text-base sm:text-lg">
                  {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
