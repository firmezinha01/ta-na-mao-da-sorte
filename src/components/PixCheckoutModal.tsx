'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  Clock, 
  PartyPopper,
  Phone,
  AlertCircle
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
  const [step, setStep] = useState<'payment' | 'registration' | 'success'>('payment');
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [loadingPix, setLoadingPix] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [formError, setFormError] = useState('');

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

  const handleCopyPix = () => {
    if (!pixData?.copyPaste) return;
    navigator.clipboard.writeText(pixData.copyPaste);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApprovePayment = () => {
    setIsProcessingApproval(true);
    sounds.playDigitLock();
    setTimeout(() => {
      setIsProcessingApproval(false);
      setStep('registration');
    }, 600);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950 overflow-hidden my-4 sm:my-8 max-h-[90vh] flex flex-col">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-900/50 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-lg">
                {step === 'payment' && 'Pagamento Pix (Mercado Pago)'}
                {step === 'registration' && 'Dados do Participante'}
                {step === 'success' && 'Participação Confirmada! 🎉'}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-300/80">
                {step === 'payment' && 'Aprovação instantânea'}
                {step === 'registration' && 'Necessário para contato e pagamento'}
                {step === 'success' && 'Bilhetes registrados com sucesso'}
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

        {/* Corpo com scroll suave */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          
          {/* PASSO 1: PAGAMENTO PIX */}
          {step === 'payment' && (
            <div>
              {/* Resumo da Compra */}
              <div className="bg-slate-950/80 rounded-2xl p-3 sm:p-4 border border-emerald-900/50 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Bilhetes:</span>
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mt-0.5">
                    {selectedNumbers.slice(0, 6).map(n => (
                      <span key={n} className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] sm:text-xs border border-emerald-500/40">
                        {n}
                      </span>
                    ))}
                    {selectedNumbers.length > 6 && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        +{selectedNumbers.length - 6} outros
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right pl-3 border-l border-slate-800 shrink-0">
                  <span className="text-[10px] sm:text-xs text-slate-400">Total:</span>
                  <div className="text-lg sm:text-xl font-black text-amber-400">
                    {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>

              {/* QR Code e Código Pix */}
              {loadingPix ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Gerando cobrança Pix Mercado Pago...</p>
                </div>
              ) : pixData ? (
                <div className="flex flex-col items-center">
                  
                  {/* Imagem do QR Code Pix */}
                  <div className="p-2 sm:p-3 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/30 mb-3 sm:mb-4">
                    {pixData.qrCodeBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={pixData.qrCodeBase64} 
                        alt="QR Code Pix Mercado Pago" 
                        className="w-44 h-44 sm:w-56 sm:h-56 object-contain"
                      />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-400 font-medium mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Abra seu app do banco e escaneie ou copie</span>
                  </div>

                  {/* Código Copia e Cola */}
                  <div className="w-full bg-slate-950 rounded-xl p-2 sm:p-2.5 border border-slate-800 flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      readOnly
                      value={pixData.copyPaste}
                      className="w-full bg-transparent text-[11px] sm:text-xs text-slate-300 font-mono focus:outline-none truncate"
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
                  <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-4 my-1 text-left">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modo de Teste Ativo (Pré-Produção)</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-amber-200/80 mb-2.5">
                      Valide o fluxo completo e a emissão dos bilhetes sem gastar dinheiro real:
                    </p>
                    <button
                      onClick={handleApprovePayment}
                      disabled={isProcessingApproval}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
                    >
                      {isProcessingApproval ? (
                        <span className="animate-spin text-base">⏳</span>
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

          {/* PASSO 2: CADASTRO DO PARTICIPANTE */}
          {step === 'registration' && (
            <form onSubmit={handleRegisterSubmit}>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 mb-4 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-[11px] sm:text-xs text-emerald-200">
                  <strong className="text-white block">Pagamento Pix Confirmado!</strong>
                  Preencha seus dados para receber o prêmio no sorteio de hoje.
                </div>
              </div>

              {formError && (
                <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-2.5 mb-3 flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo da Silva"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-emerald-900/60 rounded-xl text-base sm:text-sm text-white focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    CPF (Cadastro de Pessoa Física)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-emerald-900/60 rounded-xl text-base sm:text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    WhatsApp (Para Notificação e Receber o Prêmio)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-emerald-900/60 rounded-xl text-base sm:text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                      required
                    />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
                    Enviaremos o lembrete antes das 19h e a mensagem se você for premiado.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                Confirmar Participação no Sorteio de Hoje
              </button>
            </form>
          )}

          {/* PASSO 3: RECIBO DE SUCESSO */}
          {step === 'success' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl mx-auto flex items-center justify-center text-slate-950 mb-3 shadow-xl">
                <PartyPopper className="w-7 h-7" />
              </div>

              <h4 className="text-lg sm:text-xl font-black text-white mb-1">
                Você já está concorrendo! 🍀
              </h4>
              <p className="text-xs text-slate-300 mb-4">
                Seus bilhetes foram registrados com sucesso no sorteio oficial de hoje às 19:00h.
              </p>

              <div className="bg-slate-950 rounded-2xl p-3 sm:p-4 border border-emerald-900/60 text-left mb-4">
                <div className="text-[10px] sm:text-xs text-slate-400 mb-2 font-semibold uppercase">
                  Bilhetes Registrados:
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {selectedNumbers.map(n => (
                    <span key={n} className="px-2.5 py-1 bg-amber-400/20 text-amber-300 font-mono font-bold text-xs sm:text-sm rounded-lg border border-amber-400/40">
                      {n}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-300 space-y-1 border-t border-slate-800 pt-2">
                  <p><strong>Titular:</strong> {nomeCompleto}</p>
                  <p><strong>WhatsApp:</strong> {whatsapp}</p>
                  <p><strong>Sorteio:</strong> Hoje às 19:00h (Premiação R$ 500,00)</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                Fechar e Acompanhar Sorteio
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
