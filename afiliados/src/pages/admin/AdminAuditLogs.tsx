import React, { useState } from 'react';
import { MockDatabase } from '../../services/mockData';
import { Card } from '../../components/common/Card';
import { formatDateTime } from '../../utils/formatters';
import { FileText, ShieldCheck } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const logs = MockDatabase.getAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-amber-400" />
          Trilha de Auditoria Administrativa
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Registro imutável de aprovações, recusas, transferências e alterações de sistema.
        </p>
      </div>

      <Card className="p-6">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhum registro de auditoria encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">Data / Hora</th>
                  <th className="pb-3 font-semibold">Administrador</th>
                  <th className="pb-3 font-semibold">Ação Executada</th>
                  <th className="pb-3 font-semibold">Alvo</th>
                  <th className="pb-3 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono text-slate-400 text-[11px]">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 text-white font-bold">
                      {log.adminEmail}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[11px] border border-amber-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300 text-[11px]">
                      {log.targetId}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400 truncate max-w-[280px]">
                      {JSON.stringify(log.details)}
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
