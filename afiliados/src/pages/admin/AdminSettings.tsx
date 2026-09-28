import React, { useState } from 'react';
import { MockDatabase } from '../../services/mockData';
import { AdminService } from '../../services/adminService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { formatBRL } from '../../utils/formatters';
import {
  Sliders,
  CheckCircle2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const currentSettings = MockDatabase.getSettings();

  const [ratePct, setRatePct] = useState((currentSettings.defaultCommissionRate * 100).toString());
  const [minPayout, setMinPayout] = useState(currentSettings.minimumPayoutAmount.toString());
  const [cookieDays, setCookieDays] = useState(currentSettings.cookieDurationDays.toString());
  const [whatsapp, setWhatsapp] = useState(currentSettings.supportWhatsapp);

  const [saved, setSaved] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    AdminService.updateSettings({
      defaultCommissionRate: parseFloat(ratePct) / 100,
      minimumPayoutAmount: parseFloat(minPayout),
      cookieDurationDays: parseInt(cookieDays, 10),
      supportWhatsapp: whatsapp
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetData = () => {
    if (confirm('Atenção: Isso redefinirá todos os dados simulados locais para o estado inicial padrão de demonstração. Deseja prosseguir?')) {
      MockDatabase.resetToDefault();
      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-amber-400" />
          Configurações Globais da Plataforma
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Defina as diretrizes padrão de comissão, limites de saque no Pix e validade de rastreamento.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Comissão Padrão Inicial (%)"
              type="number"
              min="1"
              max="50"
              value={ratePct}
              onChange={(e) => setRatePct(e.target.value)}
              helperText="Taxa aplicada automaticamente para novos cadastros."
              required
            />

            <Input
              label="Valor Mínimo para Saque Pix (R$)"
              type="number"
              step="5"
              min="10"
              max="500"
              value={minPayout}
              onChange={(e) => setMinPayout(e.target.value)}
              helperText="Afiliados só podem solicitar saque ao atingir este saldo."
              required
            />

            <Input
              label="Validade do Cookie de Rastreamento (Dias)"
              type="number"
              min="1"
              max="365"
              value={cookieDays}
              onChange={(e) => setCookieDays(e.target.value)}
              helperText="Janela de atribuição entre o clique e a compra de milhar."
              required
            />

            <Input
              label="WhatsApp Oficial de Suporte a Afiliados"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>

      {/* Database Reset Helper for testing */}
      <Card className="p-6 border-slate-800">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          Restaurar Dados de Demonstração
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Para fins de testes locais, você pode resetar o banco de dados demonstrativo a qualquer momento para repor os afiliados, saques e comissões de exemplo.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={handleResetData}
          className="border border-slate-800 hover:border-amber-500/40 text-xs"
        >
          Resetar Dados para Demonstração Inicial
        </Button>
      </Card>
    </div>
  );
};
