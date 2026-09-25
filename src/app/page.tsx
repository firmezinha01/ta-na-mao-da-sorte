'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { JackpotBanner } from '@/components/JackpotBanner';
import { TicketGrid } from '@/components/TicketGrid';
import { PixCheckoutModal } from '@/components/PixCheckoutModal';
import { DrawLiveArena } from '@/components/DrawLiveArena';
import { MyTicketsModal } from '@/components/MyTicketsModal';
import { RulesModal } from '@/components/RulesModal';
import { AppStore } from '@/lib/storage';
import { Bilhete, Sorteio, Usuario } from '@/types';
import { 
  ShieldCheck, 
  Trophy, 
  Phone
} from 'lucide-react';

export default function Home() {
  // Estados da aplicação sincronizados com o Servidor / Supabase
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([]);
  const [sorteio, setSorteio] = useState<Sorteio | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [testMode, setTestMode] = useState<boolean>(false);

  // Estados de Sincronização Temporal do Servidor (Zero Descompasso)
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [targetTimestamp, setTargetTimestamp] = useState<number>(0);
  const [targetLabel, setTargetLabel] = useState<string>('19:00h');

  // Seleção de bilhetes
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  // Estados dos Modais
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLiveDrawOpen, setIsLiveDrawOpen] = useState(false);
  const [isAutoDrawStart, setIsAutoDrawStart] = useState(false);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const isInitialLoad = useRef(true);

  // Carrega e sincroniza dados em tempo real com a API central
  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/draw');
      if (res.ok) {
        const data = await res.json();
        const clientNow = Date.now();
        if (data.serverTime) {
          setServerTimeOffset(data.serverTime - clientNow);
        }
        if (data.draw) {
          setSorteio(data.draw);
        }
        if (data.tickets) {
          setBilhetes(data.tickets);
        }
        if (data.schedule) {
          setTargetTimestamp(data.schedule.targetTimestamp);
          setTargetLabel(data.schedule.label);
        }
      }

      // Atualiza lista de participantes da API
      const resPart = await fetch('/api/participants');
      if (resPart.ok) {
        const partData = await resPart.json();
        if (partData.participants) {
          setUsuarios(partData.participants);
        }
      }

      // Usuário salvo localmente no dispositivo
      const localUser = AppStore.getCurrentUser();
      if (localUser) {
        setCurrentUser(localUser);
      }
      setTestMode(AppStore.isTestMode());
    } catch (err) {
      console.warn('Erro ao carregar dados centralizados:', err);
      // Fallback para storage local se offline
      if (isInitialLoad.current) {
        setUsuarios(AppStore.getUsuarios());
        setBilhetes(AppStore.getBilhetes());
        setSorteio(AppStore.getSorteio());
        setCurrentUser(AppStore.getCurrentUser());
      }
    } finally {
      isInitialLoad.current = false;
    }
  }, []);

  // Montagem e polling leve a cada 4 segundos para manter todos os dispositivos 100% sincronizados
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Bilhetes pertencentes ao usuário logado ou da sessão
  const myTickets = currentUser 
    ? bilhetes.filter(b => b.usuario_id === currentUser.id || (currentUser.cpf && b.usuario?.cpf === currentUser.cpf))
    : [];

  // Alterna a seleção de um número
  const handleToggleNumber = (numStr: string) => {
    setSelectedNumbers(prev => {
      if (prev.includes(numStr)) {
        return prev.filter(n => n !== numStr);
      }
      return [...prev, numStr];
    });
  };

  // Seleciona múltiplos números (Surpresinha)
  const handleSelectMultiple = (numbers: string[]) => {
    setSelectedNumbers(numbers);
  };

  // Limpa a seleção
  const handleClearSelection = () => {
    setSelectedNumbers([]);
  };

  // Abre o checkout Pix
  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  // Finaliza o pagamento e cadastra os bilhetes
  const handlePaymentComplete = (userData: { nome_completo: string; cpf: string; whatsapp: string }) => {
    AppStore.purchaseTickets(selectedNumbers, userData);
    loadData();
    setSelectedNumbers([]);
  };

  // Executa o sorteio centralizado no Servidor (100% IDÊNTICO PARA TODOS)
  const handleExecuteDraw = async (options?: { forcedWinnerMilhar?: string; isSunday?: boolean }) => {
    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawId: sorteio?.id,
          forcedWinnerMilhar: options?.forcedWinnerMilhar
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSorteio(data.sorteio);
          loadData();
          return {
            sorteio: data.sorteio,
            milhar: data.milhar,
            ganhador: data.ganhador,
            mensagensGeradas: data.mensagensGeradas || []
          };
        }
      }
    } catch (err) {
      console.error('Erro ao executar sorteio no servidor:', err);
    }

    // Fallback de emergência caso a rede caia
    const localResult = await AppStore.executeDraw(options);
    loadData();
    return localResult;
  };

  // Inicia um novo ciclo de sorteio
  const handleStartNewCycle = async () => {
    try {
      await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'new_cycle' })
      });
    } catch (e) {
      AppStore.startNewDrawCycle();
    }
    loadData();
  };

  // Scroll suave até a tabela de milhares
  const handleScrollToGrid = () => {
    const el = document.getElementById('ticket-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!sorteio) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Navegação Superior */}
      <Header
        onOpenMyTickets={() => setIsMyTicketsOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenLiveDraw={() => {
          setIsAutoDrawStart(false);
          setIsLiveDrawOpen(true);
        }}
        myTicketsCount={myTickets.length}
        currentUser={currentUser}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
        
        {/* Banner do Prêmio & Contador Regressivo Sincronizado */}
        <JackpotBanner
          sorteio={sorteio}
          serverTimeOffset={serverTimeOffset}
          targetTimestamp={targetTimestamp}
          targetLabelDisplay={targetLabel}
          onScrollToGrid={handleScrollToGrid}
          onOpenLiveDraw={() => {
            setIsAutoDrawStart(false);
            setIsLiveDrawOpen(true);
          }}
          onAutoTriggerDraw={() => {
            setIsAutoDrawStart(true);
            setIsLiveDrawOpen(true);
          }}
        />

        {/* Tabela de 10.000 Milhares (0000 a 9999) */}
        <TicketGrid
          soldTickets={bilhetes}
          myTickets={myTickets}
          selectedNumbers={selectedNumbers}
          onToggleNumber={handleToggleNumber}
          onSelectMultiple={handleSelectMultiple}
          onClearSelection={handleClearSelection}
          onCheckout={handleCheckout}
        />

        {/* Seção de Confiança e Como Funciona */}
        <section className="my-10 sm:my-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-emerald-950 flex flex-col items-center text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 sm:mb-4">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-white text-sm sm:text-base mb-1">Pagamento Pix Mercado Pago</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              QR Code e chave copia e cola oficiais do Mercado Pago com confirmação e emissão automática dos bilhetes.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-emerald-950 flex flex-col items-center text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 sm:mb-4">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-white text-sm sm:text-base mb-1">Sorteio Diário às 19:00h</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              Prêmio fixo de R$ 500 ou acumulado até domingo, quando a roleta gira sucessivamente até sair um bilhete premiado!
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-emerald-950 flex flex-col items-center text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center mb-3 sm:mb-4">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-white text-sm sm:text-base mb-1">Notificações no WhatsApp</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              Lembretes antes das 19h, resultado do sorteio com nome e final do celular, e mensagem exclusiva ao vencedor.
            </p>
          </div>
        </section>

      </main>

      {/* Rodapé Oficial (Público e Limpo) */}
      <footer className="w-full bg-slate-950 border-t border-emerald-950/80 py-6 sm:py-8 text-xs text-slate-400 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍀</span>
            <span className="font-extrabold text-white">Tá Na Mão da SORTE</span>
            <span className="text-slate-600">•</span>
            <span>Bingo & Loteria Digital</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <button onClick={handleScrollToGrid} className="hover:text-emerald-400 transition-colors">
              Milhares
            </button>
            <button 
              onClick={() => {
                setIsAutoDrawStart(false);
                setIsLiveDrawOpen(true);
              }} 
              className="hover:text-amber-400 transition-colors font-bold"
            >
              SORTEIO 19H
            </button>
            <button onClick={() => setIsMyTicketsOpen(true)} className="hover:text-cyan-400 transition-colors">
              Meus Bilhetes
            </button>
          </div>

          <p className="text-slate-500 text-[10px] sm:text-[11px]">
            © {new Date().getFullYear()} Tá Na Mão da SORTE. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* BARRA DE NAVEGAÇÃO INFERIOR PARA CELULARES (BOTTOM NAV) */}
      <BottomNav
        onScrollToGrid={handleScrollToGrid}
        onOpenLiveDraw={() => {
          setIsAutoDrawStart(false);
          setIsLiveDrawOpen(true);
        }}
        onOpenMyTickets={() => setIsMyTicketsOpen(true)}
        myTicketsCount={myTickets.length}
      />

      {/* MODAL 1: Checkout Pix (Mercado Pago Oficial) */}
      <PixCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedNumbers={selectedNumbers}
        currentUser={currentUser}
        testMode={testMode}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* MODAL 2: Arena do Sorteio das 19h ao Vivo (Centralizado e Simultâneo) */}
      <DrawLiveArena
        isOpen={isLiveDrawOpen}
        onClose={() => {
          setIsLiveDrawOpen(false);
          setIsAutoDrawStart(false);
          loadData();
        }}
        sorteio={sorteio}
        soldTickets={bilhetes}
        usuarios={usuarios}
        onExecuteDraw={handleExecuteDraw}
        onStartNewCycle={handleStartNewCycle}
        autoStart={isAutoDrawStart}
      />

      {/* MODAL 3: Meus Bilhetes Comprados */}
      <MyTicketsModal
        isOpen={isMyTicketsOpen}
        onClose={() => setIsMyTicketsOpen(false)}
        myTickets={myTickets}
        currentUser={currentUser}
        currentSorteio={sorteio}
      />

      {/* MODAL 4: Regras e Como Funciona */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

    </div>
  );
}
