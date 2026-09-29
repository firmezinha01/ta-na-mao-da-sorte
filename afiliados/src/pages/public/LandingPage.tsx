import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Calculator,
  Gift,
  Users,
  Smartphone,
  Coins,
  FileText
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatBRL } from '../../utils/formatters';

export const LandingPage: React.FC = () => {
  // Calculator state
  const [dailyTickets, setDailyTickets] = useState(50);
  const [commissionPct, setCommissionPct] = useState(15);

  // Modals for Terms & Regulations
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Calculation formulas
  const ticketPrice = 2.00;
  const dailyVolume = dailyTickets * ticketPrice;
  const dailyEarnings = dailyVolume * (commissionPct / 100);
  const monthlyEarnings = dailyEarnings * 30;

  const faqs = [
    {
      q: 'Como funciona o Programa de Afiliados do Tá na Mão da Sorte?',
      a: 'Você se cadastra gratuitamente no portal, aguarda a aprovação rápida da sua conta, gera seu link exclusivo de afiliado e divulga nas suas redes sociais, grupos de WhatsApp, Telegram ou amigos. Toda vez que alguém comprar milhares através do seu link, você recebe uma comissão automática calculada em tempo real.'
    },
    {
      q: 'Quanto custa cada milhar e qual o valor da minha comissão?',
      a: 'Cada milhar da sorte custa apenas R$ 2,00 para o participante. A taxa de comissão padrão inicial é de 15% sobre todas as vendas geradas (podendo atingir até 25% para parceiros de alto volume/VIP).'
    },
    {
      q: 'Como e quando recebo meus pagamentos?',
      a: 'Os pagamentos são efetuados diretamente na sua Chave Pix cadastrada. Assim que seu saldo disponível atingir o valor mínimo de R$ 50,00, você pode clicar em "Solicitar Saque" dentro do painel a qualquer momento.'
    },
    {
      q: 'Por quanto tempo o visitante fica vinculado ao meu link?',
      a: 'Nosso sistema utiliza cookies de rastreamento de 30 dias. Isso significa que se uma pessoa clicar no seu link hoje e comprar o bilhete daqui a até 30 dias, a comissão ainda será atribuída e creditada integralmente na sua conta!'
    },
    {
      q: 'Preciso ter canal grande no YouTube ou muitos seguidores no Instagram?',
      a: 'Não! Qualquer pessoa maior de 18 anos pode participar. Você pode divulgar para seu círculo de amigos, grupos de família, contatos no WhatsApp, fóruns ou construir audiência própria.'
    },
    {
      q: 'Posso comprar bilhetes pelo meu próprio link?',
      a: 'Não. Pelas regras de segurança e conformidade do programa, compras próprias não geram comissão e tentativas reiteradas podem levar à suspensão preventiva da conta.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
          {/* Background Glow Accents */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold mb-6 animate-pulse-slow">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Programa Oficial de Afiliados • Tá na Mão da Sorte</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none mb-6">
              Transforme sua audiência em{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                Comissões Diárias no Pix
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Divulgue os sorteios diários da maior loteria e bingo digital do Brasil. Bilhetes acessíveis por apenas <strong className="text-emerald-400">R$ 2,00</strong>, alta conversão e comissão garantida direto na sua conta.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12">
              <Link to="/afiliados/cadastro" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  Quero ser Afiliado 🍀
                </Button>
              </Link>
              <Link to="/afiliados/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
                  Já sou Afiliado
                </Button>
              </Link>
            </div>

            {/* Key Trust Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-900">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">15% a 25%</p>
                <p className="text-xs text-slate-400 mt-1">Comissão por Venda</p>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">R$ 50,00</p>
                <p className="text-xs text-slate-400 mt-1">Saque Mínimo no Pix</p>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">30 Dias</p>
                <p className="text-xs text-slate-400 mt-1">Validade do Cookie</p>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <p className="text-2xl sm:text-3xl font-black text-white font-mono">19:00h</p>
                <p className="text-xs text-slate-400 mt-1">Sorteios Todos os Dias</p>
              </div>
            </div>
          </div>
        </section>

        {/* CALCULATOR SECTION */}
        <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                <Calculator className="w-4 h-4" /> Simulador de Rendimentos
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Quanto você pode faturar como afiliado?
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Arraste os seletores abaixo e veja a projeção dos seus ganhos com bilhetes de R$ 2,00.
              </p>
            </div>

            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-950/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                
                {/* Sliders */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-200">
                        Milhares vendidas por dia:
                      </label>
                      <span className="font-mono text-lg font-black text-emerald-400 bg-emerald-950/60 px-3 py-0.5 rounded-lg border border-emerald-500/30">
                        {dailyTickets} bilhetes
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="1000"
                      step="5"
                      value={dailyTickets}
                      onChange={(e) => setDailyTickets(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>5</span>
                      <span>250</span>
                      <span>500</span>
                      <span>1.000+</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-200">
                        Taxa de comissão:
                      </label>
                      <span className="font-mono text-lg font-black text-amber-400 bg-amber-950/60 px-3 py-0.5 rounded-lg border border-amber-500/30">
                        {commissionPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="25"
                      step="1"
                      value={commissionPct}
                      onChange={(e) => setCommissionPct(Number(e.target.value))}
                      className="w-full accent-amber-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>10% (Iniciante)</span>
                      <span>15% (Padrão)</span>
                      <span>25% (VIP / Parcerias)</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    💡 <em>Exemplo:</em> Vendendo apenas <strong>{dailyTickets} milhares</strong> por dia, seus indicados investem R$ {dailyVolume.toFixed(2)}, gerando retorno previsível creditado diariamente.
                  </p>
                </div>

                {/* Results Box */}
                <div className="bg-slate-950/90 border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 text-center space-y-6">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                      Estimativa de Ganho Diário
                    </span>
                    <span className="text-3xl sm:text-4xl font-mono font-black text-emerald-400">
                      {formatBRL(dailyEarnings)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 block mb-1">
                      Estimativa de Ganho Mensal
                    </span>
                    <span className="text-4xl sm:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                      {formatBRL(monthlyEarnings)}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">
                      Direto na sua Chave Pix, sem taxas abusivas!
                    </p>
                  </div>

                  <Link to="/afiliados/cadastro" className="block">
                    <Button variant="amber" size="lg" className="w-full">
                      Cadastre-se e Comece Agora 🚀
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS / 5 STEPS */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
              Passo a Passo Simples
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Como funciona o programa na prática?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: '1',
                title: 'Faça seu Cadastro',
                desc: 'Preencha o formulário em menos de 2 minutos com seus dados e Chave Pix.',
                icon: Users
              },
              {
                step: '2',
                title: 'Aguarde Aprovação',
                desc: 'Nossa equipe analisa os cadastros para garantir a integridade da plataforma.',
                icon: ShieldCheck
              },
              {
                step: '3',
                title: 'Divulgue seu Link',
                desc: 'Compartilhe seu link exclusivo com QR Code e utilize nossos criativos oficiais.',
                icon: Smartphone
              },
              {
                step: '4',
                title: 'Monitore em Tempo Real',
                desc: 'Acompanhe cliques, vendas de milhares e comissões no painel com gráficos.',
                icon: TrendingUp
              },
              {
                step: '5',
                title: 'Receba no seu Pix',
                desc: 'Solicite seu saque assim que atingir R$ 50,00 e receba rápido no Pix.',
                icon: Coins
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="relative bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center hover:border-emerald-500/40 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="absolute top-3 right-3 text-xs font-mono font-black text-slate-600">
                    0{item.step}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-16 bg-slate-900/40 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Por que se afiliar ao Tá na Mão da Sorte?
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Uma oportunidade sólida com um dos produtos de entretenimento digital de maior conversão do país.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Produto de R$ 2,00 Fácil de Vender</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  O valor do bilhete é acessível para qualquer pessoa. Sorteios diários às 19:00h com prêmio de R$ 500,00 via Pix criam interesse contínuo de compra.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Pagamento Rápido via Pix</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sem burocracias ou prazos extensos de 30 a 60 dias. Seus saques são transferidos diretamente na sua Chave Pix com registro do comprovante End-to-End.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Criativos e Banners Oficiais</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Você não precisa criar nada do zero: acesse nossa biblioteca com vídeos, banners para Stories, posts de Feed e textos persuasivos com seu link integrado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legal / Policy Links Bar */}
          <div className="mt-12 p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => setShowRegModal(true)}
              className="hover:text-emerald-400 underline cursor-pointer"
            >
              Regulamento do Programa
            </button>
            <span>•</span>
            <button
              onClick={() => setShowTermsModal(true)}
              className="hover:text-emerald-400 underline cursor-pointer"
            >
              Termos de Uso
            </button>
            <span>•</span>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-emerald-400 underline cursor-pointer"
            >
              Política de Privacidade (LGPD)
            </button>
          </div>
        </section>

        {/* BOTTOM FINAL CTA */}
        <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-emerald-950/60 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Pronto para começar a faturar?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mb-8">
              Cadastre-se agora mesmo no Programa de Afiliados Tá na Mão da Sorte e receba comissões automáticas no Pix.
            </p>
            <Link to="/afiliados/cadastro">
              <Button size="lg" className="text-base px-8 py-4">
                Criar Minha Conta de Afiliado Gratuitamente 🍀
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* REGULATION MODAL */}
      <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)} title="Regulamento Oficial do Programa de Afiliados">
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-bold text-white text-sm">1. Elegibilidade</h4>
          <p>Podem participar do programa pessoas físicas com mais de 18 anos de idade e pessoas jurídicas devidamente constituídas no Brasil com CPF/CNPJ regularizado perante a Receita Federal.</p>
          <h4 className="font-bold text-white text-sm">2. Aprovação e Conduta</h4>
          <p>O cadastro do afiliado passará por análise cadastral. É expressamente proibida a prática de spam, anúncios enganosos sobre ganhos garantidos nas apostas, e a compra de bilhetes através do próprio link.</p>
          <h4 className="font-bold text-white text-sm">3. Comissionamento</h4>
          <p>As comissões são creditadas de acordo com as vendas de milhares confirmadas via Pix. Em caso de chargeback ou estorno comprovado, a comissão correspondente será cancelada.</p>
        </div>
      </Modal>

      {/* TERMS OF USE MODAL */}
      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Termos de Uso do Portal de Afiliados">
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>Ao utilizar o portal de afiliados Tá na Mão da Sorte, você concorda com todas as diretrizes de integridade, transparência e segurança de dados vigentes.</p>
          <p>A administração se reserva o direito de suspender cadastros que violem regras de uso ético ou utilizem bots/mecanismos sintéticos de cliques.</p>
        </div>
      </Modal>

      {/* PRIVACY MODAL */}
      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Política de Privacidade e Conformidade LGPD">
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>Seus dados pessoais (Nome, CPF/CNPJ, E-mail, Telefone e Chave Pix) são coletados com a finalidade exclusiva de gestão da relação de afiliação e liquidação financeira de pagamentos.</p>
          <p>Em conformidade com a LGPD (Lei nº 13.709/2018), você pode a qualquer momento consultar seus dados cadastrados ou solicitar a exclusão de sua conta pelo painel de perfil.</p>
        </div>
      </Modal>
    </div>
  );
};
