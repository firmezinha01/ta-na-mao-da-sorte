import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const norm = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = status;

  switch (norm) {
    case 'aprovado':
    case 'ativa':
    case 'ativo':
      styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      label = 'Aprovado';
      break;
    case 'pendente':
    case 'em_analise':
    case 'solicitado':
    case 'em_processamento':
      styles = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      label = norm === 'em_analise' ? 'Em Análise' : norm === 'solicitado' ? 'Solicitado' : norm === 'em_processamento' ? 'Processando' : 'Pendente';
      break;
    case 'disponivel':
      styles = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      label = 'Disponível';
      break;
    case 'paga':
    case 'pago':
      styles = 'bg-green-500/20 text-green-300 border-green-500/40 font-bold';
      label = 'Pago no Pix';
      break;
    case 'recusado':
    case 'cancelada':
    case 'cancelado':
      styles = 'bg-red-500/15 text-red-400 border-red-500/30';
      label = norm.includes('recus') ? 'Recusado' : 'Cancelado';
      break;
    case 'suspenso':
      styles = 'bg-red-950/70 text-red-400 border-red-700/50';
      label = 'Suspenso';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase ${styles} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};
