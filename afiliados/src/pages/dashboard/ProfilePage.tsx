import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AffiliateService } from '../../services/affiliateService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { formatBRL, maskPhone, maskDocumentSecret, formatDate, formatDateTime } from '../../utils/formatters';
import { validatePixKey } from '../../utils/validators';
import { PixKeyType } from '../../types';
import {
  UserCheck,
  Shield,
  KeyRound,
  Lock,
  CheckCircle2,
  Trash2,
  FileCheck,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentAffiliate, refreshAffiliate } = useAuth();
  if (!currentAffiliate) return null;

  // Personal Info Form
  const [fullName, setFullName] = useState(currentAffiliate.fullName);
  const [phone, setPhone] = useState(currentAffiliate.phone);
  const [whatsapp, setWhatsapp] = useState(currentAffiliate.whatsapp);
  const [city, setCity] = useState(currentAffiliate.city);
  const [state, setState] = useState(currentAffiliate.state);
  const [socialChannels, setSocialChannels] = useState(currentAffiliate.socialChannels);

  // Sensitive Pix Info Form (requires password)
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(currentAffiliate.pixKeyType);
  const [pixKey, setPixKey] = useState(currentAffiliate.pixKey);
  const [pixPassword, setPixPassword] = useState('');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Feedback states
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [pixSuccess, setPixSuccess] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // LGPD Account Close Modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeRequested, setCloseRequested] = useState(false);

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    AffiliateService.updateProfile(currentAffiliate.id, {
      fullName,
      phone: phone.replace(/\D/g, ''),
      whatsapp: whatsapp.replace(/\D/g, ''),
      city,
      state,
      socialChannels
    });
    refreshAffiliate();
    setInfoSuccess(true);
    setTimeout(() => setInfoSuccess(false), 3000);
  };

  const handleUpdatePix = (e: React.FormEvent) => {
    e.preventDefault();
    setPixError(null);

    if (!pixPassword) {
      setPixError('Digite sua senha atual para autorizar a alteração da Chave Pix.');
      return;
    }

    if (!validatePixKey(pixKey, pixKeyType)) {
      setPixError(`A chave informada não é válida para o tipo ${pixKeyType}.`);
      return;
    }

    AffiliateService.updateProfile(currentAffiliate.id, {
      pixKey,
      pixKeyType
    });
    refreshAffiliate();
    setPixPassword('');
    setPixSuccess(true);
    setTimeout(() => setPixSuccess(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (!currentPassword) {
      setPassError('Informe a sua senha atual.');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPassError('A confirmação da nova senha não coincide.');
      return;
    }

    setPassSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => setPassSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-400" />
          Meu Perfil e Dados Cadastrais
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Gerencie seus dados de contato, chave Pix de recebimento, segurança e direitos LGPD.
        </p>
      </div>

      {/* 1. DADOS DE CONTATO */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
          <span>Dados Pessoais &amp; Contato</span>
          {infoSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
            </span>
          )}
        </h3>

        <form onSubmit={handleUpdateInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                CPF / CNPJ (Inalterável por segurança)
              </label>
              <input
                disabled
                value={maskDocumentSecret(currentAffiliate.documentNumber)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 font-mono cursor-not-allowed"
              />
            </div>

            <Input
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              required
            />

            <Input
              label="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
              required
            />

            <Input
              label="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />

            <Input
              label="Estado (UF)"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>

          <Input
            label="Canais de Divulgação (Redes Sociais, Grupos)"
            value={socialChannels}
            onChange={(e) => setSocialChannels(e.target.value)}
            required
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit">
              Atualizar Dados Pessoais
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. CHAVE PIX PROTEGIDA */}
      <Card variant="glow-amber" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Chave Pix para Recebimento de Comissões
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Por motivos de segurança financeira, a alteração da Chave Pix exige confirmação por senha.
            </p>
          </div>
          {pixSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Chave Pix Atualizada!
            </span>
          )}
        </div>

        {pixError && (
          <p className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
            {pixError}
          </p>
        )}

        <form onSubmit={handleUpdatePix} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tipo de Chave Pix
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="EMAIL">E-mail</option>
                <option value="PHONE">Telefone / Celular</option>
                <option value="RANDOM">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <Input
              label="Chave Pix"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="font-mono text-emerald-400 font-bold"
              required
            />
          </div>

          <Input
            label="Confirme sua Senha Atual para Salvar a Nova Chave Pix"
            type="password"
            placeholder="Digite sua senha de acesso"
            value={pixPassword}
            onChange={(e) => setPixPassword(e.target.value)}
            required
          />

          <div className="pt-2 flex justify-end">
            <Button variant="amber" type="submit">
              Atualizar Chave Pix Segura 🔒
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. ALTERAR SENHA */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-400" />
            Alteração de Senha
          </h3>
          {passSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Senha atualizada com sucesso!
            </span>
          )}
        </div>

        {passError && (
          <p className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
            {passError}
          </p>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Senha Atual"
            type="password"
            placeholder="Sua senha em uso"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nova Senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" type="submit">
              Salvar Nova Senha
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. CONFORMIDADE LGPD */}
      <Card className="p-6 border-slate-800">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
          <FileCheck className="w-5 h-5 text-cyan-400" />
          Privacidade e Termos (LGPD)
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Em consonância com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui o controle integral das suas informações cadastradas.
        </p>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Termos de Uso Aceitos em:</span>
            <span className="font-mono">{formatDateTime(currentAffiliate.termsAcceptedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Política de Privacidade Aceita em:</span>
            <span className="font-mono">{formatDateTime(currentAffiliate.privacyAcceptedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Finalidade do Tratamento:</span>
            <span className="text-emerald-400 font-bold">Gestão de afiliação e liquidação Pix</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => setShowCloseModal(true)}
            leftIcon={<Trash2 className="w-4 h-4 text-red-400" />}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
          >
            Solicitar Encerramento de Conta
          </Button>
        </div>
      </Card>

      {/* ACCOUNT CLOSURE MODAL */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Solicitar Encerramento da Conta"
      >
        {closeRequested ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Solicitação Recebida</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sua solicitação de encerramento foi protocolada. Caso existam saldos a pagar, entraremos em contato via WhatsApp antes da exclusão definitiva dos dados.
            </p>
            <Button variant="secondary" onClick={() => setShowCloseModal(false)} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Atenção: Ao encerrar sua conta, seus links exclusivos deixarão de gerar comissões imediatamente.</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Se você possui saldo disponível ({formatBRL(currentAffiliate.balanceAvailable)}), recomendamos solicitar o saque antes de pedir o encerramento.
            </p>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowCloseModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => setCloseRequested(true)}
                className="flex-1"
              >
                Confirmar Solicitação
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
