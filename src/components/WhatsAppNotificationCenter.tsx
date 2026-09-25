'use client';

import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  CheckCheck, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  Bell, 
  Trophy, 
  Flame,
  Users
} from 'lucide-react';
import { Mensagem, TipoMensagem } from '@/types';
import { generateWhatsAppWebLink } from '@/lib/whatsapp';

interface WhatsAppNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  mensagens: Mensagem[];
  onTriggerDailyReminder: () => Promise<void>;
  registeredUsersCount: number;
}

export const WhatsAppNotificationCenter: React.FC<WhatsAppNotificationCenterProps> = ({
  isOpen,
  onClose,
  mensagens,
  onTriggerDailyReminder,
  registeredUsersCount
}) => {
  const [filter, setFilter] = useState<'all' | TipoMensagem>('all');
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleBroadcastReminder = async () => {
    setIsSendingReminder(true);
    setFeedback('');
    try {
      await onTriggerDailyReminder();
      setFeedback('Lembrete das 18h disparado com sucesso para todos os contatos!');
      setTimeout(() => setFeedback(''), 4000);
    } catch (e) {
      console.error(e);
      setFeedback('Falha ao disparar lembrete.');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const filteredMessages = mensagens.filter(m => {
    if (filter === 'all') return true;
    return m.tipo === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-green-500/40 rounded-3xl shadow-2xl shadow-green-950/50 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-green-900/40 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  Central de Disparos WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                  Automático
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Histórico de envios da tabela `mensagens` (Lembretes, Resultados e Premiações)
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

        {/* Barra de Ações Rápidas */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Users className="w-4 h-4 text-emerald-400" />
            <span><strong>{registeredUsersCount}</strong> WhatsApps cadastrados na base</span>
          </div>

          <button
            onClick={handleBroadcastReminder}
            disabled={isSendingReminder}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs shadow-md shadow-green-900/40 transition-all disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isSendingReminder ? 'Disparando Lembrete...' : 'Disparar Lembrete das 18h em Massa'}</span>
          </button>
        </div>

        {feedback && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-semibold text-center">
            {feedback}
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-1.5 p-4 overflow-x-auto border-b border-slate-800/80">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-green-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todas ({mensagens.length})
          </button>
          <button
            onClick={() => setFilter('lembrete')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'lembrete' ? 'bg-green-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Lembretes
          </button>
          <button
            onClick={() => setFilter('resultado')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'resultado' ? 'bg-green-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Resultados
          </button>
          <button
            onClick={() => setFilter('parabenizacao')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'parabenizacao' ? 'bg-green-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Parabenização Vencedor
          </button>
        </div>

        {/* Lista de Mensagens */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-white text-sm">Nenhuma mensagem neste filtro.</p>
              <p className="text-xs text-slate-400 mt-1">
                Dispare o lembrete ou realize um sorteio para ver o histórico completo de envios.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const waLink = generateWhatsAppWebLink(msg.destinatario_whatsapp || '11987654321', msg.conteudo);

              return (
                <div
                  key={msg.id}
                  className="bg-slate-950 rounded-2xl p-4 border border-slate-800 hover:border-green-800/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        msg.tipo === 'parabenizacao'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : msg.tipo === 'resultado'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {msg.tipo === 'parabenizacao' && <Trophy className="w-3 h-3 text-amber-400" />}
                        {msg.tipo === 'resultado' && <Sparkles className="w-3 h-3 text-cyan-400" />}
                        {msg.tipo === 'lembrete' && <Bell className="w-3 h-3 text-emerald-400" />}
                        {msg.tipo}
                      </span>
                      <span className="text-xs text-white font-bold">
                        {msg.destinatario_nome || 'Participante'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({msg.destinatario_whatsapp || 'WhatsApp'})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.data_envio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-green-400 ml-1" />
                    </div>
                  </div>

                  {/* Conteúdo em estilo balão do WhatsApp */}
                  <div className="bg-[#0b141a] rounded-xl p-3 text-xs text-[#e9edef] whitespace-pre-wrap font-sans border-l-4 border-green-500 leading-relaxed">
                    {msg.conteudo}
                  </div>

                  {/* Ação de Teste Direto */}
                  <div className="flex items-center justify-end mt-3">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-green-400 hover:text-green-300 hover:underline"
                    >
                      <span>Abrir e Testar no WhatsApp Web</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400 flex items-center justify-between">
          <span>Integração: Twilio / Evolution API / WhatsApp Business</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
