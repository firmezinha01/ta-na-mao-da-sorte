import React, { useState, useMemo } from 'react';
import { MockDatabase } from '../../services/mockData';
import { AdminService } from '../../services/adminService';
import { PaymentRequest } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatBRL, formatDateTime } from '../../utils/formatters';
import {
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  CheckCheck,
  Search,
  Copy,
  Check
} from 'lucide-react';

export const AdminPayouts: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRequest[]>(MockDatabase.getPayments());
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment confirmation modal
  const [payModalItem, setPayModalItem] = useState<PaymentRequest | null>(null);
  const [pixTransactionId, setPixTransactionId] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Reject modal
  const [rejectModalItem, setRejectModalItem] = useState<PaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const reloadPayments = () => {
    setPayments(MockDatabase.getPayments());
  };

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const matchSearch =
        p.affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.pixKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const handleOpenPay = (p: PaymentRequest) => {
    setPayModalItem(p);
    const mockE2E = `E00038166${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}${Math.floor(1000 + Math.random() * 9000)}`;
    setPixTransactionId(mockE2E);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalItem) return;

    AdminService.approvePayout(payModalItem.id, pixTransactionId);
    reloadPayments();
    setPayModalItem(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    AdminService.rejectPayout(rejectModalItem.id, rejectReason);
    reloadPayments();
    setRejectModalItem(null);
    setRejectReason('');
  };

  const copyPix = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Banknote className="w-6 h-6 text-emerald-400" />
          Fila de Liquidação de Saques Pix
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Aprove transferências bancárias Pix, insira o ID End-to-End da transação e gerencie estornos.
        </p>
      </div>

      {/* Filter Strip */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Buscar por Afiliado, Chave Pix ou ID:
            </label>
            <input
              type="text"
              placeholder="Ex: Lucas, mariana@email.com..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Filtrar por Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="all">Todas as Solicitações ({payments.length})</option>
              <option value="solicitado">Pendentes na Fila</option>
              <option value="pago">Liquidadas no Pix</option>
              <option value="recusado">Recusadas / Estornadas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Payouts Table */}
      <Card className="p-6">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhuma solicitação encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">Data / ID</th>
                  <th className="pb-3 font-semibold">Afiliado</th>
                  <th className="pb-3 font-semibold">Valor Saque</th>
                  <th className="pb-3 font-semibold">Chave Pix</th>
                  <th className="pb-3 font-semibold">Comprovante / ID E2E</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <span className="font-mono text-[11px] text-slate-400 block">{p.id}</span>
                      <span className="text-white">{formatDateTime(p.requestedAt)}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-white block">{p.affiliateName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.affiliateDocument}</span>
                    </td>
                    <td className="py-3 font-mono font-black text-emerald-400 text-sm">
                      {formatBRL(p.requestedAmount)}
                    </td>
                    <td className="py-3">
                      <span className="font-mono font-bold text-white block">{p.pixKey}</span>
                      <span className="text-[10px] text-slate-400">Tipo: {p.pixKeyType}</span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-300">
                      {p.pixTransactionId || <span className="text-amber-400/80">Aguardando liquidação</span>}
                    </td>
                    <td className="py-3 text-center">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3 text-right">
                      {p.status === 'solicitado' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleOpenPay(p)}
                            leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                          >
                            Pagar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setRejectModalItem(p)}
                          >
                            Recusar
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* PAY MODAL */}
      <Modal
        isOpen={Boolean(payModalItem)}
        onClose={() => setPayModalItem(null)}
        title="Liquidação de Saque Pix"
      >
        {payModalItem && (
          <form onSubmit={handleConfirmPay} className="space-y-4 text-left">
            <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-900/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Afiliado:</span>
                <span className="text-white font-bold">{payModalItem.affiliateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Solicitado:</span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  {formatBRL(payModalItem.requestedAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Chave Pix ({payModalItem.pixKeyType}):</span>
                  <span className="font-mono text-amber-400 font-bold">{payModalItem.pixKey}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyPix(payModalItem.pixKey)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedKey ? 'Copiada!' : 'Copiar Chave'}
                </button>
              </div>
            </div>

            <Input
              label="ID da Transação Pix / End-to-End"
              value={pixTransactionId}
              onChange={(e) => setPixTransactionId(e.target.value)}
              helperText="Identificador bancário de confirmação do Pix enviado."
              required
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPayModalItem(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Confirmar Pagamento 💸
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        isOpen={Boolean(rejectModalItem)}
        onClose={() => setRejectModalItem(null)}
        title="Recusar e Estornar Saque"
      >
        {rejectModalItem && (
          <form onSubmit={handleConfirmReject} className="space-y-4 text-left">
            <p className="text-xs text-slate-300">
              O valor de <strong className="text-white">{formatBRL(rejectModalItem.requestedAmount)}</strong> será automaticamente devolvido ao saldo disponível de <strong>{rejectModalItem.affiliateName}</strong>.
            </p>

            <Input
              label="Motivo da Recusa"
              placeholder="Ex: Chave Pix inválida ou titularidade divergente"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRejectModalItem(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" variant="danger" className="flex-1">
                Recusar e Estornar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
