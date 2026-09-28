import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MockDatabase } from '../../services/mockData';
import { AffiliateService } from '../../services/affiliateService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import {
  Link2,
  Copy,
  Check,
  Plus,
  Share2,
  QrCode,
  Power,
  ExternalLink,
  MessageCircle,
  Send,
  Facebook,
  Mail
} from 'lucide-react';

export const MyLinksPage: React.FC = () => {
  const { currentAffiliate } = useAuth();
  const [links, setLinks] = useState(
    MockDatabase.getLinks().filter(l => l.affiliateId === currentAffiliate?.id)
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Link Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [destPath, setDestPath] = useState('/');
  const [campaignName, setCampaignName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // QR Code Modal State
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  const affiliateCode = currentAffiliate?.exclusiveCode || 'SORTE-DEMO';

  const reloadLinks = () => {
    if (currentAffiliate) {
      setLinks(MockDatabase.getLinks().filter(l => l.affiliateId === currentAffiliate.id));
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggle = (linkId: string) => {
    AffiliateService.toggleLink(linkId);
    reloadLinks();
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAffiliate) return;

    if (!campaignName.trim()) {
      setCreateError('Informe o nome da campanha (ex: stories_instagram).');
      return;
    }

    const res = AffiliateService.createLink(
      currentAffiliate.id,
      currentAffiliate.exclusiveCode,
      destPath,
      campaignName
    );

    if (res.success) {
      setShowCreateModal(false);
      setCampaignName('');
      setCreateError(null);
      reloadLinks();
    }
  };

  const shareWhatsApp = (url: string) => {
    const text = encodeURIComponent(
      `🍀 Olá! Conheça o Tá Na Mão da SORTE: Sorteios diários às 19h com premiação garantida! Compre milhares por apenas R$ 2,00 no Pix:\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareTelegram = (url: string) => {
    const text = encodeURIComponent(`🍀 Sorteio diário Tá Na Mão da SORTE! Milhares por R$ 2,00: ${url}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
  };

  const shareFacebook = (url: string) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareEmail = (url: string) => {
    const subject = encodeURIComponent('Conheça o Tá Na Mão da SORTE!');
    const body = encodeURIComponent(`Acesse o site oficial e concorra a prêmios todos os dias às 19h:\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Link2 className="w-6 h-6 text-emerald-400" />
            Meus Links de Divulgação
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Seu código exclusivo é <span className="font-mono font-bold text-amber-400">{affiliateCode}</span>. Crie links para diferentes campanhas e acompanhe os cliques de cada um.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Criar Novo Link
        </Button>
      </div>

      {/* Primary Link Card */}
      <Card variant="glow-emerald" className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Link Padrão Oficial
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Mais Utilizado
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Direciona para a página inicial com sorteio diário e ativa o cookie de 30 dias.
            </p>
            <p className="mt-2 font-mono text-sm font-bold text-white bg-slate-950 p-2.5 rounded-xl border border-emerald-900/60 inline-block">
              {`https://tanamaodasorte.com.br/?afiliado=${affiliateCode}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button
              size="sm"
              onClick={() => handleCopy(`https://tanamaodasorte.com.br/?afiliado=${affiliateCode}`, 'primary')}
              leftIcon={copiedId === 'primary' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedId === 'primary' ? 'Copiado!' : 'Copiar Link'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => shareWhatsApp(`https://tanamaodasorte.com.br/?afiliado=${affiliateCode}`)}
              leftIcon={<MessageCircle className="w-3.5 h-3.5 text-green-400" />}
            >
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setQrModalUrl(`https://tanamaodasorte.com.br/?afiliado=${affiliateCode}`)}
              leftIcon={<QrCode className="w-3.5 h-3.5" />}
            >
              QR Code
            </Button>
          </div>
        </div>
      </Card>

      {/* Links List Table */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-white mb-4">
          Todos os Links Personalizados ({links.length})
        </h3>

        {links.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhum link personalizado criado ainda. Clique em "Criar Novo Link" acima para começar!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">Campanha</th>
                  <th className="pb-3 font-semibold">Destino</th>
                  <th className="pb-3 font-semibold">Data</th>
                  <th className="pb-3 font-semibold text-center">Cliques</th>
                  <th className="pb-3 font-semibold text-center">Conversões</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {links.map(link => (
                  <tr key={link.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <span className="font-mono font-bold text-white block">
                        {link.campaignName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px] block">
                        {link.fullUrl}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">
                      {link.destinationPath === '/' ? 'Página Inicial' : link.destinationPath}
                    </td>
                    <td className="py-3 text-slate-400">{formatDate(link.createdAt)}</td>
                    <td className="py-3 text-center font-mono font-bold text-cyan-400">
                      {link.clicksCount}
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-emerald-400">
                      {link.conversionsCount}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        link.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {link.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(link.fullUrl, link.id)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Copiar link"
                        >
                          {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => shareWhatsApp(link.fullUrl)}
                          className="p-1.5 bg-green-950/60 hover:bg-green-900/60 text-green-400 rounded-lg transition-colors cursor-pointer"
                          title="Compartilhar no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setQrModalUrl(link.fullUrl)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Gerar QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(link.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            link.isActive ? 'text-slate-500 hover:text-red-400' : 'text-emerald-500 hover:text-emerald-400'
                          }`}
                          title={link.isActive ? 'Desativar link' : 'Reativar link'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE LINK MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Gerar Link Personalizado"
      >
        <form onSubmit={handleCreateLink} className="space-y-4 text-left">
          {createError && (
            <p className="text-xs text-red-400 font-bold bg-red-950/50 p-2.5 rounded-xl border border-red-800/40">
              {createError}
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Página de Destino
            </label>
            <select
              value={destPath}
              onChange={(e) => setDestPath(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="/">Página Inicial (Sorteio Diário às 19h)</option>
              <option value="/sorteio-especial-domingo">Domingo da Sorte (Acumulado)</option>
              <option value="/comprar-milhares">Compra Direta de Milhares (R$ 2,00)</option>
            </select>
          </div>

          <Input
            label="Identificador da Campanha (utm_campaign)"
            placeholder="Ex: stories_instagram, grupo_amigos, tiktok_bio"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            helperText="Use apenas letras, números e underline para identificar de onde vieram os cliques."
            required
          />

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Prévia do Link:</span>
            <span className="font-mono text-emerald-400 break-all">
              {`https://tanamaodasorte.com.br${destPath}?afiliado=${affiliateCode}&campanha=${campaignName || 'sua_campanha'}`}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Gerar Link 🍀
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR CODE MODAL */}
      <Modal
        isOpen={Boolean(qrModalUrl)}
        onClose={() => setQrModalUrl(null)}
        title="QR Code do Link Exclusivo"
      >
        <div className="text-center space-y-4">
          <p className="text-xs text-slate-300">
            Aponte a câmera do celular para testar ou salve a imagem para utilizar em stories, folhetos ou cartazes.
          </p>

          <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModalUrl || '')}`}
              alt="QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 break-all">
            {qrModalUrl}
          </div>

          <Button
            variant="secondary"
            onClick={() => setQrModalUrl(null)}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </Modal>
    </div>
  );
};
