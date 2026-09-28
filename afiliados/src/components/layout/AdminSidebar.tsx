import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Banknote,
  Image,
  Sliders,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminSidebar: React.FC = () => {
  const navItems = [
    { label: 'Painel Geral', path: '/afiliados/admin', icon: ShieldAlert },
    { label: 'Afiliados', path: '/afiliados/admin/afiliados', icon: Users },
    { label: 'Saques Pix', path: '/afiliados/admin/saques', icon: Banknote },
    { label: 'Materiais', path: '/afiliados/admin/materiais', icon: Image },
    { label: 'Configurações', path: '/afiliados/admin/configuracoes', icon: Sliders },
    { label: 'Logs Auditoria', path: '/afiliados/admin/logs', icon: FileText },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900/90 border-b lg:border-b-0 lg:border-r border-amber-500/20 p-4 shrink-0 flex lg:flex-col justify-between">
      <div className="w-full">
        <div className="hidden lg:flex items-center gap-2 mb-6 px-2 text-amber-400">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-wider">Gestão Administrativa</span>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/afiliados/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="hidden lg:block mt-6 pt-4 border-t border-slate-800">
        <Link
          to="/afiliados/dashboard"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-bold text-slate-400 hover:text-emerald-400 bg-slate-950 rounded-xl border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Visão do Afiliado</span>
        </Link>
      </div>
    </aside>
  );
};
