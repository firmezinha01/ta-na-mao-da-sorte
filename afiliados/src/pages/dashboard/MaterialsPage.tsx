import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MockDatabase } from '../../services/mockData';
import { PromotionalMaterial } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import {
  FolderOpen,
  Download,
  Copy,
  Check,
  Eye,
  Share2,
  FileText,
  Image as ImageIcon,
  Video,
  Filter,
  Sparkles
} from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const { currentAffiliate } = useAuth();
  const materials = MockDatabase.getMaterials().filter(m => m.isActive);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<PromotionalMaterial | null>(null);

  const affiliateCode = currentAffiliate?.exclusiveCode || 'SORTE-DEMO';
  const affiliateLink = `https://tanamaodasorte.com.br/?afiliado=${affiliateCode}`;

  const filteredMaterials = useMemo(() => {
    if (categoryFilter === 'all') return materials;
    return materials.filter(m => m.category === categoryFilter);
  }, [materials, categoryFilter]);

  const handleCopyText = (caption: string | undefined, id: string) => {
    if (!caption) return;
    const finalCopy = caption.replace('{SEU_LINK}', affiliateLink);
    navigator.clipboard.writeText(finalCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShare = (material: PromotionalMaterial) => {
    const text = (material.captionText || '').replace('{SEU_LINK}', affiliateLink);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + affiliateLink)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-emerald-400" />
          Materiais de Divulgação
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Banners oficiais, artes em alta resolução e textos prontos com seu link exclusivo <span className="font-mono text-amber-400 font-bold">{affiliateCode}</span> já integrado.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'Todos os Materiais' },
          { id: 'stories', label: 'Stories / Reels' },
          { id: 'feed', label: 'Post Feed' },
          { id: 'banner', label: 'Banners Web' },
          { id: 'copy', label: 'Textos & Copies' },
          { id: 'selo', label: 'Selos Oficiais' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              categoryFilter === cat.id
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map(mat => (
          <Card key={mat.id} className="flex flex-col justify-between overflow-hidden p-0 group">
            {/* Visual Container */}
            {mat.fileType === 'text' ? (
              <div className="p-6 bg-slate-950/70 border-b border-slate-800 flex flex-col justify-center min-h-[180px]">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                  <FileText className="w-4 h-4" /> Texto Pronto para WhatsApp / Redes
                </div>
                <p className="text-xs text-slate-300 italic line-clamp-4 leading-relaxed font-sans">
                  "{(mat.captionText || '').replace('{SEU_LINK}', affiliateLink)}"
                </p>
              </div>
            ) : (
              <div className="relative aspect-video sm:aspect-square bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800">
                <img
                  src={mat.fileUrl}
                  alt={mat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {mat.dimensions && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] font-mono text-slate-300 border border-slate-800">
                    {mat.dimensions}
                  </span>
                )}
                <button
                  onClick={() => setPreviewMaterial(mat)}
                  className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                >
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg">
                    <Eye className="w-3.5 h-3.5" /> Visualizar
                  </span>
                </button>
              </div>
            )}

            {/* Info and Actions */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="uppercase font-bold tracking-wider text-emerald-400">
                    {mat.category}
                  </span>
                  <span>{formatDate(mat.createdAt)}</span>
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {mat.title}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                {mat.fileType === 'text' || mat.captionText ? (
                  <Button
                    size="sm"
                    onClick={() => handleCopyText(mat.captionText, mat.id)}
                    className="flex-1 text-xs"
                    leftIcon={copiedId === mat.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedId === mat.id ? 'Texto Copiado!' : 'Copiar Texto'}
                  </Button>
                ) : (
                  <a
                    href={mat.fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-green-600 text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-300 hover:to-green-500 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </a>
                )}

                <button
                  onClick={() => handleShare(mat)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Compartilhar no WhatsApp com seu Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* PREVIEW MODAL */}
      <Modal
        isOpen={Boolean(previewMaterial)}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial?.title || 'Visualização do Material'}
        maxWidth="xl"
      >
        {previewMaterial && (
          <div className="space-y-4 text-center">
            {previewMaterial.fileType !== 'text' && (
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-[450px] flex items-center justify-center">
                <img
                  src={previewMaterial.fileUrl}
                  alt={previewMaterial.title}
                  className="max-h-[420px] w-auto object-contain mx-auto"
                />
              </div>
            )}

            {previewMaterial.captionText && (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left">
                <span className="text-xs font-bold text-slate-400 block mb-1">Texto sugerido para acompanhar a arte:</span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {previewMaterial.captionText.replace('{SEU_LINK}', affiliateLink)}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {previewMaterial.captionText && (
                <Button
                  onClick={() => handleCopyText(previewMaterial.captionText, 'preview')}
                  className="flex-1"
                >
                  {copiedId === 'preview' ? 'Texto Copiado!' : 'Copiar Texto com Meu Link'}
                </Button>
              )}
              {previewMaterial.fileUrl && (
                <a
                  href={previewMaterial.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors text-sm"
                >
                  Abrir Arquivo Original ↗
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
