'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { JackpotBanner } from '@/components/JackpotBanner';
import { TicketGrid } from '@/components/TicketGrid';
import { PixCheckoutModal } from '@/components/PixCheckoutModal';
import { DrawLiveArena } from '@/components/DrawLiveArena';
import { MyTicketsModal } from '@/components/MyTicketsModal';
import { WhatsAppNotificationCenter } from '@/components/WhatsAppNotificationCenter';
import { RulesModal } from '@/components/RulesModal';
import { AdminPanel } from '@/components/AdminPanel';
import { AppStore } from '@/lib/storage';
import { Bilhete, Mensagem, Sorteio, Usuario } from '@/types';
import { 
  ShieldCheck, 
  Lock, 
  HelpCircle, 
  MessageSquare, 
  Sparkles, 
  Trophy, 
  HeartHandshake,
  CheckCircle2,
  Phone
} from 'lucide-react';

export default function Home() {
  // Estados da aplicação inicializados com o AppStore
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([]);
  const [sorteio, setSorteio] = useState<Sorteio | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [testMode, setTestMode] = useState<boolean>(true);

  // Seleção de bilhetes
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  // Estados dos Modais
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLiveDrawOpen, setIsLiveDrawOpen] = useState(false);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);
  const [isWhatsAppHubOpen, setIsWhatsAppHubOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Carrega os dados na montagem do componente
  const loadData = useCallback(() => {
    setUsuarios(AppStore.getUsuarios());
    setBilhetes(AppStore.getBilhetes());
    setSorteio(AppStore.getSorteio());
    setMensagens(AppStore.getMensagens());
    setCurrentUser(AppStore.getCurrentUser());
    setTestMode(AppStore.isTestMode());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bilhetes pertencentes ao usuário logado ou da sessão
  const myTickets = currentUser 
    ? bilhetes.filter(b => b.usuario_id === currentUser.id)
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

  // Executa o sorteio das 19h
  const handleExecuteDraw = async (options?: { forcedWinnerMilhar?: string; isSunday?: boolean }) => {
    const result = await AppStore.executeDraw(options);
    loadData();
    return result;
  };

  // Inicia um novo ciclo de sorteio
  const handleStartNewCycle = () => {
    AppStore.startNewDrawCycle();
    loadData();
  };

  // Disparo em massa de lembrete diário
  const handleTriggerDailyReminder = async () => {
    await AppStore.broadcastDailyReminder();
    loadData();
  };

  // Alterna Modo de Teste
  const handleToggleTestMode = () => {
    const nextState = !testMode;
    AppStore.setTestMode(nextState);
    setTestMode(nextState);
  };

  // Gerador rápido de vendas para testes
  const handleGenerateQuickSales = (count: number) => {
    const soldSet = new Set(bilhetes.map(b => b.numero_milhar));
    const availablePool: string[] = [];

    for (let i = 0; i < 10000; i++) {
      const numStr = i.toString().padStart(4, '0');
      if (!soldSet.has(numStr)) availablePool.push(numStr);
    }

    const sampleUsers = [
      { nome_completo: 'Carlos Eduardo Mendes', cpf: '123.456.789-00', whatsapp: '11987654321' },
      { nome_completo: 'Mariana Silva Santos', cpf: '234.567.890-11', whatsapp: '21976543210' },
      { nome_completo: 'Roberto Oliveira Lima', cpf: '345.678.901-22', whatsapp: '31985432109' },
      { nome_completo: 'Fernanda Costa Ribeiro', cpf: '456.789.012-33', whatsapp: '41994321098' },
      { nome_completo: 'Lucas Gabriel Moreira', cpf: '567.890.123-44', whatsapp: '19998877665' },
      { nome_completo: 'Juliana Aparecida Souza', cpf: '678.901.234-55', whatsapp: '81987651234' }
    ];

    for (let i = 0; i < count && availablePool.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availablePool.length);
      const picked = availablePool[randomIndex];
      availablePool.splice(randomIndex, 1);

      const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      AppStore.purchaseTickets([picked], randomUser);
    }

    loadData();
  };

  // Reset total dos dados
  const handleResetData = () => {
    AppStore.resetToDefault();
    loadData();
  };

  // Ajuste do prêmio
  const handleAdjustPrize = (newPrize: number) => {
    const current = AppStore.getSorteio();
    current.premio = newPrize;
    localStorage.setItem('tanamao_sorteio_v1', JSON.stringify(current));
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
        onOpenWhatsAppHub={() => setIsWhatsAppHubOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenLiveDraw={() => setIsLiveDrawOpen(true)}
        myTicketsCount={myTickets.length}
        unreadMessagesCount={mensagens.length}
        currentUser={currentUser}
        testMode={testMode}
        onToggleTestMode={handleToggleTestMode}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Banner do Prêmio & Contador Regressivo para as 19h */}
        <JackpotBanner
          sorteio={sorteio}
          soldCount={bilhetes.length}
          totalCombinations={10000}
          onScrollToGrid={handleScrollToGrid}
          onOpenLiveDraw={() => setIsLiveDrawOpen(true)}
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
        <section className="my-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-emerald-950 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base mb-1">Pagamento Pix Mercado Pago</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              QR Code e código copia e cola gerados via Mercado Pago com confirmação instantânea dos seus bilhetes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-emerald-950 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base mb-1">Sorteio Diário às 19:00h</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Prêmio garantido de R$ 500 ou acumulado até domingo, quando a roleta gira sucessivamente até premiar um bilhete!
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-emerald-950 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base mb-1">Notificações no seu WhatsApp</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lembretes antes das 19h, resultado do sorteio com nome e final do celular, e mensagem exclusiva ao vencedor.
            </p>
          </div>
        </section>

      </main>

      {/* Rodapé Oficial */}
      <footer className="w-full bg-slate-950 border-t border-emerald-950/80 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍀</span>
            <span className="font-extrabold text-white">Tá Na Mão da SORTE</span>
            <span className="text-slate-600">•</span>
            <span>Bingo & Loteria Digital</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsRulesOpen(true)} className="hover:text-emerald-400 transition-colors">
              Regulamento
            </button>
            <button onClick={() => setIsWhatsAppHubOpen(true)} className="hover:text-green-400 transition-colors">
              WhatsApp
            </button>
            <button onClick={() => setIsAdminOpen(true)} className="hover:text-amber-400 transition-colors">
              Painel Admin
            </button>
          </div>

          <p className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} Tá Na Mão da SORTE. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* MODAL 1: Checkout Pix (Mercado Pago + Modo de Teste) */}
      <PixCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedNumbers={selectedNumbers}
        currentUser={currentUser}
        testMode={testMode}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* MODAL 2: Arena do Sorteio das 19h ao Vivo */}
      <DrawLiveArena
        isOpen={isLiveDrawOpen}
        onClose={() => setIsLiveDrawOpen(false)}
        sorteio={sorteio}
        soldTickets={bilhetes}
        usuarios={usuarios}
        onExecuteDraw={handleExecuteDraw}
        onStartNewCycle={handleStartNewCycle}
      />

      {/* MODAL 3: Meus Bilhetes Comprados */}
      <MyTicketsModal
        isOpen={isMyTicketsOpen}
        onClose={() => setIsMyTicketsOpen(false)}
        myTickets={myTickets}
        currentUser={currentUser}
        currentSorteio={sorteio}
      />

      {/* MODAL 4: Central de Notificações do WhatsApp */}
      <WhatsAppNotificationCenter
        isOpen={isWhatsAppHubOpen}
        onClose={() => setIsWhatsAppHubOpen(false)}
        mensagens={mensagens}
        onTriggerDailyReminder={handleTriggerDailyReminder}
        registeredUsersCount={usuarios.length}
      />

      {/* MODAL 5: Regras e Como Funciona */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* MODAL 6: Painel de Controle / Administração */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        sorteio={sorteio}
        soldTickets={bilhetes}
        usuarios={usuarios}
        testMode={testMode}
        onToggleTestMode={handleToggleTestMode}
        onGenerateQuickSales={handleGenerateQuickSales}
        onResetData={handleResetData}
        onAdjustPrize={handleAdjustPrize}
      />

    </div>
  );
}
