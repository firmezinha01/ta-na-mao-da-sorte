import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MockDatabase } from '../../services/mockData';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatBRL, formatDateTime } from '../../utils/formatters';
import {
  ShieldAlert,
  Users,
  Banknote,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Coins
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [affiliates, setAffiliates] = useState(MockDatabase.getAffiliates());
  const [commissions, setCommissions] = useState(MockDatabase.getCommissions());

  useEffect(() => {
    fetch('/api/afiliados/list')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.affiliates && d.affiliates.length > 0) {
          setAffiliates(d.affiliates);
          MockDatabase.saveAffiliates(d.affiliates);
        }
      })
      .catch(console.warn);

    fetch('/api/afiliados/commissions?role=admin')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.commissions) {
          setCommissions(d.commissions);
          MockDatabase.saveCommissions(d.commissions);
        }
      })
      .catch(console.warn);
  }, []);

  const payments = MockDatabase.getPayments();

  const pendingAffiliates = useMemo(() => {
    return affiliates.filter(a => a.status === 'pendente');
  }, [affiliates]);

  const pendingPayments = useMemo(() => {
    return payments.filter(p => p.status === 'solicitado');
  }, [payments]);

  // Aggregated totals
  const totalRevenue = useMemo(() => {
    return commissions.reduce((acc, c) => acc + c.orderAmount, 0);
  }, [commissions]);

  const totalCommissions = useMemo(() => {
    return commissions.reduce((acc, c) => acc + c.commissionAmount, 0);
  }, [commissions]);

  const pendingPayoutsTotal = useMemo(() => {
    return pendingPayments.reduce((acc, p) => acc + p.requestedAmount, 0);
  }, [pendingPayments]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-amber-500/30 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Painel de Controle Administrativo
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Supervisão geral da rede de afiliados, aprovações cadastrais e liquidação de saques Pix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/afiliados/admin/afiliados">
            <Button size="sm" variant="amber">
              Moderar Cadastros ({pendingAffiliates.length})
            </Button>
          </Link>
          <Link to="/afiliados/admin/saques">
            <Button size="sm">
              Fila Pix ({pendingPayments.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glow-amber">
          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
            Cadastros Pendentes
          </span>
          <span className="text-3xl font-black font-mono text-white">
            {pendingAffiliates.length}
          </span>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Total na rede:</span>
            <strong className="text-white font-mono">{affiliates.length}</strong>
          </div>
        </Card>

        <Card variant="glow-emerald">
          <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Saques Pix Pendentes
          </span>
          <span className="text-3xl font-black font-mono text-white">
            {formatBRL(pendingPayoutsTotal)}
          </span>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Pedidos na fila:</span>
            <strong className="text-amber-400 font-mono">{pendingPayments.length}</strong>
          </div>
        </Card>

        <Card>
          <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
            Faturamento via Afiliados
          </span>
          <span className="text-3xl font-black font-mono text-white">
            {formatBRL(totalRevenue)}
          </span>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Conversões totais:</span>
            <strong className="text-cyan-400 font-mono">{commissions.length}</strong>
          </div>
        </Card>

        <Card>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Comissões Concedidas
          </span>
          <span className="text-3xl font-black font-mono text-emerald-400">
            {formatBRL(totalCommissions)}
          </span>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Média por bilhete:</span>
            <strong className="text-white font-mono">15%</strong>
          </div>
        </Card>
      </div>

      {/* Action Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: Cadastros aguardando moderação */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Afiliados Aguardando Aprovação ({pendingAffiliates.length})
            </h3>
            <Link to="/afiliados/admin/afiliados" className="text-xs text-amber-400 font-bold hover:underline">
              Ver Todos →
            </Link>
          </div>

          {pendingAffiliates.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              ✓ Todos os cadastros de afiliados estão em dia!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAffiliates.slice(0, 4).map(aff => (
                <div key={aff.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">{aff.fullName}</h4>
                    <p className="text-[10px] text-slate-400">{aff.email} • {aff.city}/{aff.state}</p>
                    <p className="text-[10px] text-amber-400 font-mono mt-0.5">{aff.exclusiveCode}</p>
                  </div>
                  <Link to="/afiliados/admin/afiliados">
                    <Button size="sm" variant="amber">
                      Avaliar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Table 2: Saques Pix aguardando pagamento */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" />
              Fila de Pagamentos Pix ({pendingPayments.length})
            </h3>
            <Link to="/afiliados/admin/saques" className="text-xs text-emerald-400 font-bold hover:underline">
              Processar Fila →
            </Link>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              ✓ Nenhuma solicitação de saque pendente na fila!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.slice(0, 4).map(pay => (
                <div key={pay.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">{pay.affiliateName}</h4>
                    <p className="text-xs font-mono font-black text-emerald-400">{formatBRL(pay.requestedAmount)}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                      Pix ({pay.pixKeyType}): {pay.pixKey}
                    </p>
                  </div>
                  <Link to="/afiliados/admin/saques">
                    <Button size="sm">
                      Pagar Pix
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
