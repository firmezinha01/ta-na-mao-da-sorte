import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MockDatabase } from '../../services/mockData';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatBRL, formatDate, formatDateTime } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportCsv';
import {
  BarChart3,
  Download,
  Filter,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Ban,
  Wallet
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { currentAffiliate } = useAuth();
  const affiliateId = currentAffiliate?.id;

  const commissions = useMemo(() => {
    return MockDatabase.getCommissions().filter(c => c.affiliateId === affiliateId);
  }, [affiliateId]);

  const links = useMemo(() => {
    return MockDatabase.getLinks().filter(l => l.affiliateId === affiliateId);
  }, [affiliateId]);

  // Filters
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Summary Metrics
  const summary = useMemo(() => {
    let pending = 0;
    let available = 0;
    let paid = 0;
    let canceled = 0;

    commissions.forEach(c => {
      if (c.status === 'pendente' || c.status === 'em_analise') pending += c.commissionAmount;
      else if (c.status === 'disponivel' || c.status === 'aprovada') available += c.commissionAmount;
      else if (c.status === 'paga') paid += c.commissionAmount;
      else if (c.status === 'cancelada') canceled += c.commissionAmount;
    });

    return { pending, available, paid, canceled, total: pending + available + paid };
  }, [commissions]);

  // Filtered rows
  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      const matchCamp = campaignFilter === 'all' || (c.campaign || 'padrao') === campaignFilter;
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchSearch = !searchTerm || c.id.toLowerCase().includes(searchTerm.toLowerCase()) || (c.campaign || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchCamp && matchStatus && matchSearch;
    });
  }, [commissions, campaignFilter, statusFilter, searchTerm]);

  // Unique campaigns for selector
  const campaigns = useMemo(() => {
    const list = commissions.map(c => c.campaign || 'padrao');
    return Array.from(new Set(list));
  }, [commissions]);

  const handleExportCSV = () => {
    const headers = [
      'ID Transação',
      'Data e Hora',
      'Campanha',
      'Valor da Compra (R$)',
      'Taxa (%)',
      'Comissão (R$)',
      'Status'
    ];

    const rows = filteredCommissions.map(c => [
      c.id,
      formatDateTime(c.createdAt),
      c.campaign || 'padrao',
      c.orderAmount.toFixed(2),
      `${(c.commissionRate * 100).toFixed(0)}%`,
      c.commissionAmount.toFixed(2),
      c.status
    ]);

    exportToCSV(`relatorio_comissoes_${currentAffiliate?.exclusiveCode || 'afiliado'}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Relatórios e Conversões
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Análise detalhada de todas as vendas e comissões atribuídas às suas divulgações.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleExportCSV}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Exportar em Planilha (CSV)
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Disponível / Aprovado
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {formatBRL(summary.available)}
          </span>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Pendente / Em Análise
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
            {formatBRL(summary.pending)}
          </span>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Pago no Pix
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-green-300">
            {formatBRL(summary.paid)}
          </span>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Total Histórico
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-white">
            {formatBRL(summary.total)}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Filtrar por Campanha:
            </label>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
            >
              <option value="all">Todas as Campanhas</option>
              {campaigns.map(camp => (
                <option key={camp} value={camp}>{camp}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Filtrar por Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="all">Todos os Status</option>
              <option value="disponivel">Disponível para Saque</option>
              <option value="pendente">Pendente</option>
              <option value="paga">Paga no Pix</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Buscar por Código:
            </label>
            <input
              type="text"
              placeholder="Digite o ID da comissão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      </Card>

      {/* Report Data Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">
            Resultados Encontrados ({filteredCommissions.length})
          </h3>
        </div>

        {filteredCommissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhuma conversão encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">ID / Data</th>
                  <th className="pb-3 font-semibold">Campanha</th>
                  <th className="pb-3 font-semibold">Valor Compra</th>
                  <th className="pb-3 font-semibold">Taxa</th>
                  <th className="pb-3 font-semibold">Sua Comissão</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredCommissions.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <span className="font-mono text-[11px] text-slate-400 block">{c.id}</span>
                      <span className="text-[11px] text-white">{formatDateTime(c.createdAt)}</span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[11px]">
                        {c.campaign || 'padrao'}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {formatBRL(c.orderAmount)}
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {(c.commissionRate * 100).toFixed(0)}%
                    </td>
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
    </div>
  );
};
