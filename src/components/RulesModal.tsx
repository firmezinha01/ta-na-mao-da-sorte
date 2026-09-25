'use client';

import React from 'react';
import { X, HelpCircle, Ticket, Trophy, Flame, QrCode, Phone, CheckCircle, Crown } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-900/50 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                Como Funciona o Tá Na Mão da SORTE
              </h3>
              <p className="text-xs text-emerald-300/80">
                Regulamento e regras do sorteio digital
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
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
          
          <div className="flex items-start gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <Ticket className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">1. Compra de Milhares por R$ 2,00</strong>
              O sistema gera automaticamente as combinações únicas sem repetição, cada participante pode escolher e comprar quantos bilhetes desejar por apenas R$ 2,00 cada.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <QrCode className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">2. Pagamento Instantâneo via Pix (Mercado Pago)</strong>
              Ao escolher os números, o pagamento é feito via QR Code ou Pix Copia e Cola integrado ao Mercado Pago com validação automática. Em seguida, o participante cadastra seu nome completo, CPF e WhatsApp para vinculação oficial.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <Trophy className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">3. Sorteios Diários às 19:00h</strong>
              Todos os dias pontualmente às 19h o sorteio inicia automaticamente. O gerador sorteia 4 algarismos (milhar, centena, dezena e unidade) até formar o número vencedor. A premiação base é de <strong>R$ 500,00 fixos</strong> por sorteio.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">4. Regra do Prêmio Acumulado</strong>
              Caso a milhar sorteada não tenha sido comprada por nenhum participante, o prêmio acumula para o dia seguinte (+ R$ 500,00).
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gradient-to-r from-purple-950/40 to-slate-950 p-3.5 rounded-2xl border border-purple-500/40">
            <Crown className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 text-sm block">5. Domingo da Sorte (Sai ou Sai!)</strong>
              Aos domingos, se houver prêmio acumulado, a roleta gira sucessivamente até sair uma milhar efetivamente comprada por um participante! O acumulado é então pago integralmente ao vencedor e o valor é zerado.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <Phone className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">6. Notificações Automáticas no WhatsApp</strong>
              • Antes das 19h: lembrete com chamada para garantir o bilhete.<br/>
              • Após o sorteio: divulgação do resultado para todos (exibindo o primeiro nome e os 4 dígitos finais do celular do vencedor).<br/>
              • Para o ganhador: mensagem exclusiva de parabéns com instruções para receber o PIX!
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
          >
            Entendido, Quero Participar!
          </button>
        </div>

      </div>
    </div>
  );
};
