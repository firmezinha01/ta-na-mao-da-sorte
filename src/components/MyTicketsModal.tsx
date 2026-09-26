'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Ticket, 
  Trophy, 
  CheckCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  User,
  Smartphone
} from 'lucide-react';
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
  const [cpfInput, setCpfInput] = useState('');
  const [searchedTickets, setSearchedTickets] = useState<Bilhete[] | null>(null);
  const [searchedUser, setSearchedUser] = useState<Usuario | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Formata o CPF para exibição (000.000.000-00)
  const formatCpf = (digits: string) => {
    let v = digits.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    if (v.length > 3) return v.replace(/(\d{3})(\d{3})/, '$1.$2');
    return v;
  };

  // Busca bilhetes ativos no servidor pelo CPF
  const searchCpfTickets = useCallback(async (rawCpf: string) => {
    const clean = rawCpf.replace(/\D/g, '');
    if (clean.length !== 11) {
      setSearchError('Por favor, informe um CPF válido com 11 dígitos.');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const res = await fetch(`/api/tickets?cpf=${clean}`);
      if (res.ok) {
        const data = await res.json();
        setSearchedUser(data.user || null);

        const serverTickets: Bilhete[] = data.tickets || [];
        // Mescla com bilhetes locais da sessão se houver algum com o mesmo CPF
        const localMatching = myTickets.filter(
          t => t.usuario?.cpf?.replace(/\D/g, '') === clean
        );

        const idSet = new Set(serverTickets.map(t => t.id));
        const merged = [...serverTickets];
        for (const lt of localMatching) {
          if (!idSet.has(lt.id)) {
            merged.push(lt);
            idSet.add(lt.id);
          }
        }

        setSearchedTickets(merged);
        setHasSearched(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setSearchError(err.error || 'Erro ao consultar bilhetes para este CPF.');
      }
    } catch (err) {
      console.error('Erro na consulta por CPF:', err);
      setSearchError('Falha na conexão ao consultar bilhetes. Verifique sua internet.');
    } finally {
      setIsSearching(false);
    }
  }, [myTickets]);

  // Inicializa o modal e busca caso o usuário já tenha CPF
  useEffect(() => {
    if (!isOpen) return;

    if (currentUser?.cpf) {
      const formatted = formatCpf(currentUser.cpf);
      setCpfInput(formatted);
      searchCpfTickets(currentUser.cpf);
    } else if (cpfInput) {
      const clean = cpfInput.replace(/\D/g, '');
      if (clean.length === 11) {
        searchCpfTickets(clean);
      }
    }
  }, [isOpen, currentUser?.cpf, searchCpfTickets]);

  if (!isOpen) return null;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpfInput(formatted);
    const clean = formatted.replace(/\D/g, '');

    if (clean.length === 11) {
      searchCpfTickets(clean);
    } else {
      setSearchError('');
      if (hasSearched) {
        setHasSearched(false);
        setSearchedTickets(null);
        setSearchedUser(null);
      }
    }
  };

  const handleClearCpf = () => {
    setCpfInput('');
    setSearchError('');
    setHasSearched(false);
    setSearchedTickets(null);
    setSearchedUser(null);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCpfTickets(cpfInput);
  };

  const cleanDigits = cpfInput.replace(/\D/g, '');
  const ticketsToDisplay = hasSearched ? (searchedTickets || []) : myTickets;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950 overflow-hidden my-4 sm:my-8 max-h-[92vh] flex flex-col">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-900/50 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                Meus Bilhetes da Sorte
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Consulte todas as suas milhares ativas pelo seu CPF
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

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Seção de Validação e Busca por CPF */}
          <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-emerald-900/60 shadow-inner">
            <form onSubmit={handleManualSearch} className="space-y-2">
              <label className="block text-[11px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Digite seu CPF para consultar seus bilhetes:</span>
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpfInput}
                    onChange={handleCpfChange}
                    maxLength={14}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-700/60 rounded-xl text-white font-mono text-sm sm:text-base focus:outline-none focus:border-emerald-400 placeholder:text-slate-600 tracking-wide"
                  />
                  {cpfInput && (
                    <button
                      type="button"
                      onClick={handleClearCpf}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching || cleanDigits.length !== 11}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shrink-0 shadow-md"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Consultar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status de Validação do CPF */}
              <div className="text-[11px] flex items-center justify-between px-1">
                {cleanDigits.length === 11 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    CPF validado (11 dígitos).
                  </span>
                ) : cleanDigits.length > 0 ? (
                  <span className="text-amber-400 font-medium">
                    Preencha os 11 dígitos do CPF ({cleanDigits.length}/11)
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Digite os 11 números para buscar automaticamente.
                  </span>
                )}
              </div>
            </form>

            {searchError && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Dados do Titular Encontrado */}
          {hasSearched && searchedUser && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                    Participante Titular:
                  </span>
                  <div className="font-extrabold text-white text-xs sm:text-sm">
                    {searchedUser.nome_completo}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    CPF: {formatCpf(searchedUser.cpf)}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Ativo:</span>
                <span className="text-base sm:text-lg font-black text-amber-400">
                  {ticketsToDisplay.length} {ticketsToDisplay.length === 1 ? 'bilhete' : 'bilhetes'}
                </span>
              </div>
            </div>
          )}

          {/* Listagem de Bilhetes Ativos */}
          {isSearching ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-300">Localizando bilhetes vinculados ao seu CPF...</p>
            </div>
          ) : ticketsToDisplay.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Ticket className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-white text-base">
                {hasSearched
                  ? 'Nenhum bilhete ativo encontrado para este CPF.'
                  : 'Nenhum bilhete salvo nesta sessão.'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {hasSearched
                  ? 'Verifique se digitou o CPF corretamente ou adquira seus bilhetes por apenas R$ 2,00 cada!'
                  : 'Digite seu CPF no campo acima para localizar todas as suas milhares ativas no Tá Na Mão da SORTE!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>
                  {hasSearched ? `Bilhetes do CPF (${ticketsToDisplay.length})` : `Bilhetes recentes (${ticketsToDisplay.length})`}
                </span>
                <span className="text-emerald-400 font-bold">Concorrendo hoje às 19:00h</span>
              </div>

              {ticketsToDisplay.map((bilhete) => {
                const isWinner = currentSorteio.status === 'finalizado' && currentSorteio.numeros_sorteados === bilhete.numero_milhar;

                return (
                  <div
                    key={bilhete.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
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
                              Pix Confirmado
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Valor: R$ 2,00 • {new Date(bilhete.data_compra).toLocaleDateString('pt-BR')} às {new Date(bilhete.data_compra).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                            Encerrado nesta rodada
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

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Prêmio de hoje: <strong className="text-emerald-400">R$ {currentSorteio.premio.toFixed(2)}</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
