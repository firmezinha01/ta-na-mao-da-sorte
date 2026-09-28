import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MockDatabase } from '../../services/mockData';
import { AffiliateService } from '../../services/affiliateService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatBRL, formatDate, formatDateTime, maskDocumentSecret } from '../../utils/formatters';
import {
  Coins,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  History,
  Info
} from 'lucide-react';

export const CommissionsPage: React.FC = () => {
  const { currentAffiliate, refreshAffiliate } = useAuth();
  const affiliate = currentAffiliate || MockDatabase.getAffiliates()[0];
  const settings = MockDatabase.getSettings();

  const [commissions, setCommissions] = useState(
    MockDatabase.getCommissions().filter(c => c.affiliateId === affiliate.id)
  );

  const [payments, setPayments] = useState(
    MockDatabase.getPayments().filter(p => p.affiliateId === affiliate.id)
  );

  // Payout Request Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(affiliate.balanceAvailable.toString());
  const [confirmPassword, setConfirmPassword] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reloadData = () => {
    refreshAffiliate();
    setCommissions(MockDatabase.getCommissions().filter(c => c.affiliateId === affiliate.id));
    setPayments(MockDatabase.getPayments().filter(p => p.affiliateId === affiliate.id));
  };

  const handleOpenPayout = () => {
    setPayoutAmount(affiliate.balanceAvailable.toString());
    setConfirmPassword('');
    setPayoutError(null);
    setPayoutSuccess(null);
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);

    const val = parseFloat(payoutAmount);
    if (isNaN(val) || val <= 0) {
      setPayoutError('Informe um valor de saque válido.');
      return;
    }

    if (val < settings.minimumPayoutAmount) {
      setPayoutError(`O valor mínimo para saque é de ${formatBRL(settings.minimumPayoutAmount)}.`);
      return;
    }

    if (val > affiliate.balanceAvailable) {
      setPayoutError('O valor informado ultrapassa seu saldo disponível.');
      return;
    }

    if (!confirmPassword) {
      setPayoutError('Digite sua senha para confirmar a transferência.');
      return;
    }

    setIsSubmitting(true);
    const res = AffiliateService.requestPayout(affiliate.id, val);
    setIsSubmitting(false);

    if (res.success) {
      setPayoutSuccess(res.message);
      reloadData();
      setTimeout(() => {
        setShowPayoutModal(false);
      }, 2000);
    } else {
      setPayoutError(res.message);
    }
  };

  // Eligibility Checklist
  const isApproved = affiliate.status === 'aprovado';
  const hasMinBalance = affiliate.balanceAvailable >= settings.minimumPayoutAmount;
  const hasPix = Boolean(affiliate.pixKey && affiliate.pixKeyType);
  const isEligible = isApproved && hasMinBalance && hasPix;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-400" />
            Comissões e Solicitação de Pagamento
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consulte seu saldo detalhado e transfira suas comissões via Pix.
          </p>
        </div>

        <Button
          onClick={handleOpenPayout}
          disabled={!isEligible}
          variant="amber"
          size="lg"
          leftIcon={<Wallet className="w-4 h-4" />}
        >
          Solicitar Pagamento Pix
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glow-emerald" className="p-6">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Saldo Disponível para Saque
          </span>
          <span className="text-3xl font-black font-mono text-white">
            {formatBRL(affiliate.balanceAvailable)}
          </span>
          <p className="text-xs text-slate-400 mt-2">
            Mínimo para saque: <strong className="text-emerald-400 font-mono">{formatBRL(settings.minimumPayoutAmount)}</strong>
          </p>
        </Card>

        <Card variant="glow-amber" className="p-6">
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-1">
            Saldo Pendente em Análise
          </span>
          <span className="text-3xl font-black font-mono text-amber-300">
            {formatBRL(affiliate.balancePending)}
          </span>
          <p className="text-xs text-slate-400 mt-2">
            Comissões aguardando o sorteio das 19h
          </p>
        </Card>

        <Card className="p-6">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Total Já Pago no Pix
          </span>
          <span className="text-3xl font-black font-mono text-green-400">
            {formatBRL(affiliate.balancePaid)}
          </span>
          <p className="text-xs text-slate-400 mt-2">
            Chave cadastrada: <span className="font-mono text-slate-300 font-bold">{affiliate.pixKey}</span>
          </p>
        </Card>
      </div>

      {/* Eligibility Checklist Banner if not eligible */}
      {!isEligible && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" /> Requisitos para liberação do saque Pix:
            </span>
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 pt-1">
              <span className={`flex items-center gap-1 ${isApproved ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isApproved ? '✓' : '✗'} Conta aprovada
              </span>
              <span className={`flex items-center gap-1 ${hasMinBalance ? 'text-emerald-400' : 'text-slate-500'}`}>
                {hasMinBalance ? '✓' : '✗'} Saldo mínimo de {formatBRL(settings.minimumPayoutAmount)}
              </span>
              <span className={`flex items-center gap-1 ${hasPix ? 'text-emerald-400' : 'text-slate-500'}`}>
                {hasPix ? '✓' : '✗'} Chave Pix cadastrada
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO DE SAQUES PIX */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-amber-400" />
          Histórico de Solicitações de Saque
        </h3>

        {payments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nenhuma solicitação de saque realizada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">Data da Solicitação</th>
                  <th className="pb-3 font-semibold">Valor Solicitado</th>
                  <th className="pb-3 font-semibold">Chave Pix de Destino</th>
                  <th className="pb-3 font-semibold">ID End-to-End Pix</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-slate-300">{formatDateTime(pay.requestedAt)}</td>
                    <td className="py-3 font-mono font-black text-white">{formatBRL(pay.requestedAmount)}</td>
                    <td className="py-3">
                      <span className="font-mono text-slate-300 font-bold block">{pay.pixKey}</span>
                      <span className="text-[10px] text-slate-500">Tipo: {pay.pixKeyType}</span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400">
                      {pay.pixTransactionId || 'Aguardando processamento'}
                    </td>
                    <td className="py-3 text-right">
                      <Badge status={pay.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* EXTRATO DAS COMISSÕES */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-white mb-4">
          Extrato Completo de Comissões
        </h3>

        {commissions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nenhuma comissão registrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">ID / Data</th>
                  <th className="pb-3 font-semibold">Campanha</th>
                  <th className="pb-3 font-semibold">Valor Compra</th>
                  <th className="pb-3 font-semibold">Comissão</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {commissions.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <span className="font-mono text-[11px] text-slate-400 block">{c.id}</span>
                      <span className="text-white">{formatDateTime(c.createdAt)}</span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[11px]">
                        {c.campaign || 'padrao'}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300">{formatBRL(c.orderAmount)}</td>
                    <td className="py-3 font-mono font-black text-emerald-400">
                      +{formatBRL(c.commissionAmount)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* PAYOUT REQUEST MODAL */}
      <Modal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        title="Solicitar Transferência Pix"
      >
        {payoutSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Solicitação Concluída!</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{payoutSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitPayout} className="space-y-5 text-left">
            {payoutError && (
              <p className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
                {payoutError}
              </p>
            )}

            {/* Pix Destination Details */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-900/60 space-y-2">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                Destino do Pagamento:
              </span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Favorecido:</span>
                <span className="text-white font-bold">{affiliate.fullName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tipo de Chave:</span>
                <span className="text-white">{affiliate.pixKeyType}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Chave Pix:</span>
                <span className="font-mono text-emerald-400 font-bold">{affiliate.pixKey}</span>
              </div>
            </div>

            <Input
              label="Valor a Sacar (R$)"
              type="number"
              step="0.01"
              min={settings.minimumPayoutAmount}
              max={affiliate.balanceAvailable}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              helperText={`Saldo disponível: ${formatBRL(affiliate.balanceAvailable)}`}
              required
            />

            <Input
              label="Confirme sua Senha de Acesso"
              type="password"
              placeholder="Digite sua senha para autorizar"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              helperText="Medida de proteção contra transferências indevidas."
              required
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPayoutModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="amber"
                isLoading={isSubmitting}
                className="flex-1"
              >
                Confirmar Saque 💸
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
