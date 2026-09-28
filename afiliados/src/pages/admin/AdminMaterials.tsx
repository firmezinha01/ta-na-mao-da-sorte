import React, { useState } from 'react';
import { MockDatabase } from '../../services/mockData';
import { AdminService } from '../../services/adminService';
import { PromotionalMaterial } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
  FileText,
  ExternalLink
} from 'lucide-react';

export const AdminMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<PromotionalMaterial[]>(MockDatabase.getMaterials());
  const [showAddModal, setShowAddModal] = useState(false);

  // New Material Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'banner' | 'feed' | 'stories' | 'copy' | 'video' | 'selo'>('stories');
  const [fileType, setFileType] = useState<'image' | 'video' | 'text'>('image');
  const [fileUrl, setFileUrl] = useState('');
  const [dimensions, setDimensions] = useState('1080x1920');
  const [captionText, setCaptionText] = useState('');

  const reloadMaterials = () => {
    setMaterials(MockDatabase.getMaterials());
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este material de divulgação?')) {
      AdminService.deleteMaterial(id);
      reloadMaterials();
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    AdminService.addMaterial({
      title,
      category,
      fileType,
      fileUrl,
      dimensions,
      captionText,
      isActive: true
    });
    reloadMaterials();
    setShowAddModal(false);
    setTitle('');
    setFileUrl('');
    setCaptionText('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-400" />
            Gerenciador de Materiais e Criativos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre novas artes, banners, vídeos e textos prontos para a biblioteca dos afiliados.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Novo Material Promocional
        </Button>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map(m => (
          <Card key={m.id} className="p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase border border-emerald-500/20">
                  {m.category}
                </span>
                <span className="text-slate-500">{formatDate(m.createdAt)}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{m.title}</h3>
              {m.captionText && (
                <p className="text-xs text-slate-400 italic line-clamp-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  "{m.captionText}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">{m.dimensions || m.fileType}</span>
              <button
                onClick={() => handleDelete(m.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Excluir Material"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* ADD MATERIAL MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Cadastrar Novo Material Promocional"
      >
        <form onSubmit={handleAdd} className="space-y-4 text-left">
          <Input
            label="Título do Material"
            placeholder="Ex: Story Especial Roleta ao Vivo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="stories">Stories / Reels</option>
                <option value="feed">Post Feed</option>
                <option value="banner">Banner Web</option>
                <option value="copy">Texto / Copy</option>
                <option value="selo">Selo Oficial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Dimensões / Formato</label>
              <input
                type="text"
                placeholder="Ex: 1080x1920"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <Input
            label="URL da Imagem / Vídeo"
            placeholder="https://..."
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            helperText="Deixe em branco se for apenas um texto pronto."
          />

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Texto Sugerido / Copywriting (com {'{SEU_LINK}'})
            </label>
            <textarea
              rows={3}
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="Digite a legenda ou texto pronto..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Adicionar Material 🎨
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
