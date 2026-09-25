'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  PartyPopper,
  Sparkles,
  Phone,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PixPaymentData, Usuario } from '@/types';
import { sounds } from '@/lib/sound';

interface PixCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  currentUser: Usuario | null;
  testMode: boolean;
  onPaymentComplete: (userData: { nome_completo: string; cpf: string; whatsapp: string }) => void;
}

export const PixCheckoutModal: React.FC<PixCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedNumbers,
  currentUser,
  testMode,
  onPaymentComplete
}) => {
  // Passos: 'payment' (Pix QR Code) -> 'registration' (Nome, CPF, WhatsApp) -> 'success' (Recibo)
  const [step, setStep] = useState<'payment' | 'registration' | 'success'>('payment');
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [loadingPix, setLoadingPix] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Dados do formulário de usuário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [formError, setFormError] = useState('');

  // Ao abrir o modal, gera a cobrança Pix e preenche dados existentes se houver
  useEffect(() => {
    if (!isOpen || selectedNumbers.length === 0) return;

    setStep('payment');
    setFormError('');
    setCopied(false);

    if (currentUser) {
      setNomeCompleto(currentUser.nome_completo || '');
      setCpf(currentUser.cpf || '');
      setWhatsapp(currentUser.whatsapp || '');
    }

    const fetchPix = async () => {
      setLoadingPix(true);
      try {
        const response = await fetch('/api/pix/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tickets: selectedNumbers,
            amount: selectedNumbers.length * 2.00,
            testMode
          })
        });

        if (response.ok) {
          const data = await response.json();
          setPixData(data);
        }
      } catch (err) {
        console.error('Erro ao gerar Pix:', err);
      } finally {
        setLoadingPix(false);
      }
    };

    fetchPix();
  }, [isOpen, selectedNumbers, currentUser, testMode]);

  if (!isOpen) return null;

  const totalAmount = selectedNumbers.length * 2.00;

  // Copia o código Copia e Cola
  const handleCopyPix = () => {
    if (!pixData?.copyPaste) return;
    navigator.clipboard.writeText(pixData.copyPaste);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2500);
  };

  // Simula ou processa a aprovação do Pix (Modo de Teste ou Webhook)
  const handleApprovePayment = () => {
    setIsProcessingApproval(true);
    sounds.playDigitLock();
    setTimeout(() => {
      setIsProcessingApproval(false);
      // Conforme especificado: "Após pagamento, aparece modal para preencher nome completo, CPF e WhatsApp."
      setStep('registration');
    }, 600);
  };

  // Formata o CPF (000.000.000-00)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) {
      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (v.length > 6) {
      v = v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    } else if (v.length > 3) {
      v = v.replace(/(\d{3})(\d{3})/, '$1.$2');
    }
    setCpf(v);
  };

  // Formata o WhatsApp ((00) 00000-0000)
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) {
      v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/(\d{2})(\d{4})/, '($1) $2');
    }
    setWhatsapp(v);
  };

  // Submissão do cadastro após o pagamento
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCompleto.trim() || nomeCompleto.trim().split(' ').length < 2) {
      setFormError('Por favor, informe seu nome completo com sobrenome.');
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setFormError('Por favor, insira um CPF válido com 11 dígitos.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Por favor, insira um WhatsApp válido com DDD.');
      return;
    }

    setFormError('');
    onPaymentComplete({
      nome_completo: nomeCompleto.trim(),
      cpf: cleanCpf,
      whatsapp: cleanPhone
    });

    sounds.playWinFanfare();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950 overflow-hidden my-8">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-900/50 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                {step === 'payment' && 'Pagamento via Pix (Mercado Pago)'}
                {step === 'registration' && 'Dados do Participante'}
                {step === 'success' && 'Participação Confirmada! 🎉'}
              </h3>
              <p className="text-xs text-emerald-300/80">
                {step === 'payment' && 'Aprovação instantânea e segura'}
                {step === 'registration' && 'Necessário para contato e pagamento do prêmio'}
                {step === 'success' && 'Seus bilhetes estão registrados no sorteio'}
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

        {/* PASSO 1: PAGAMENTO PIX */}
        {step === 'payment' && (
          <div className="p-6">
            
            {/* Resumo da Compra */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-emerald-900/50 mb-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Bilhetes Selecionados:</span>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {selectedNumbers.map(n => (
                    <span key={n} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/40">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right pl-3 border-l border-slate-800">
                <span className="text-xs text-slate-400">Total:</span>
                <div className="text-xl font-black text-amber-400">
                  {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>

            {/* QR Code e Código Pix */}
            {loadingPix ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Gerando cobrança Pix via Mercado Pago...</p>
              </div>
            ) : pixData ? (
              <div className="flex flex-col items-center">
                
                {/* Imagem do QR Code Pix */}
                <div className="p-3 bg-white rounded-2xl shadow-xl shadow-black/40 border-4 border-emerald-500/30 mb-4">
                  {pixData.qrCodeBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={pixData.qrCodeBase64} 
                      alt="QR Code Pix Mercado Pago" 
                      className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-slate-700 text-xs">
                      Gerando QR Code...
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Válido por 15 minutos • Abra seu app do banco e escaneie</span>
                </div>

                {/* Código Copia e Cola */}
                <div className="w-full bg-slate-950 rounded-xl p-2.5 border border-slate-800 flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={pixData.copyPaste}
                    className="w-full bg-transparent text-xs text-slate-300 font-mono focus:outline-none truncate"
                  />
                  <button
                    onClick={handleCopyPix}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      copied 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Pix'}</span>
                  </button>
                </div>

                {/* MODO DE TESTE / VALIDAÇÃO DE TRANSAÇÕES */}
                <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 my-2 text-left">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Modo de Teste Ativo (Pré-Produção)</span>
                  </div>
                  <p className="text-xs text-amber-200/80 mb-3">
                    Conforme especificação, você pode validar o fluxo completo e a emissão dos bilhetes sem gastar dinheiro real:
                  </p>
                  <button
                    onClick={handleApprovePayment}
                    disabled={isProcessingApproval}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
                  >
                    {isProcessingApproval ? (
                      <span className="animate-spin text-lg">⏳</span>
                    ) : (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                    <span>Simular Pagamento Pix Aprovado</span>
                  </button>
                </div>

              </div>
            ) : null}

          </div>
        )}

        {/* PASSO 2: CADASTRO DO PARTICIPANTE (NOME, CPF, WHATSAPP) */}
        {step === 'registration' && (
          <form onSubmit={handleRegisterSubmit} className="p-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-200">
                <strong className="text-white">Pagamento Pix Confirmado com Sucesso!</strong>
                <p>Preencha seus dados abaixo para vincular os bilhetes e receber notificações.</p>
              </div>
            </div>

            {formError && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo da Silva"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-emerald-900/60 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  CPF (Cadastro de Pessoa Física)
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-emerald-900/60 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  WhatsApp (Para Notificação e Receber o Prêmio)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-emerald-900/60 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enviaremos o lembrete antes das 19h e a notificação se o seu bilhete for premiado.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              Confirmar Participação no Sorteio de Hoje
            </button>
          </form>
        )}

        {/* PASSO 3: RECIBO DE SUCESSO */}
        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-3xl mx-auto flex items-center justify-center text-slate-950 mb-4 shadow-xl shadow-emerald-500/30">
              <PartyPopper className="w-8 h-8" />
            </div>

            <h4 className="text-xl font-black text-white mb-1">
              Você já está concorrendo! 🍀
            </h4>
            <p className="text-xs text-slate-300 mb-6">
              Seus bilhetes foram validados com sucesso no sorteio oficial de hoje às 19:00h.
            </p>

            <div className="bg-slate-950 rounded-2xl p-4 border border-emerald-900/60 text-left mb-6">
              <div className="text-xs text-slate-400 mb-2 font-semibold uppercase">
                Seus Bilhetes Registrados:
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {selectedNumbers.map(n => (
                  <span key={n} className="px-3 py-1 bg-amber-400/20 text-amber-300 font-mono font-bold text-sm rounded-lg border border-amber-400/40">
                    {n}
                  </span>
                ))}
              </div>
              <div className="text-xs text-slate-300 space-y-1 border-t border-slate-800 pt-2">
                <p><strong>Titular:</strong> {nomeCompleto}</p>
                <p><strong>WhatsApp:</strong> {whatsapp}</p>
                <p><strong>Sorteio:</strong> Hoje às 19:00h (Premiação R$ 500,00)</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all"
            >
              Fechar e Acompanhar Sorteio
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
