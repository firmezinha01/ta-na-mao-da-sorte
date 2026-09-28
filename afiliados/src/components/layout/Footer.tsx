import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-emerald-950/80 py-8 text-xs text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🍀</span>
            <span className="font-extrabold text-white">Tá Na Mão da SORTE</span>
            <span className="text-slate-600">•</span>
            <span>Programa de Afiliados Oficial</span>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link to="/afiliados" className="hover:text-emerald-400 transition-colors">
              Início
            </Link>
            <Link to="/afiliados/cadastro" className="hover:text-emerald-400 transition-colors">
              Cadastro
            </Link>
            <Link to="/afiliados/login" className="hover:text-emerald-400 transition-colors">
              Área do Afiliado
            </Link>
            <a
              href="https://tanamaodasorte.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
            >
              Site Principal ↗
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Tá Na Mão da SORTE. Todos os direitos reservados. Plataforma de sorteios diários e loteria digital.</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 font-bold border border-red-800/40 text-[10px]">
              +18 ANOS
            </span>
            <span>Jogue com responsabilidade.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
