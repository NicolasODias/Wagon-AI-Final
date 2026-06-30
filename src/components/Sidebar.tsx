/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  ShoppingCart, 
  Boxes, 
  DollarSign, 
  Users, 
  Cpu,
  Settings,
  Sun,
  Moon,
  Info,
  ChevronRight,
  TrendingUp,
  User,
  LogOut,
  X,
  UserCog
} from 'lucide-react';
import { AuthUser } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lowStockCount: number;
  unbilledOrdersCount: number;
  pendingBillsCount: number;
  isDark: boolean;
  toggleDarkMode: () => void;
  onEnterSalesPortal?: () => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  lowStockCount, 
  unbilledOrdersCount, 
  pendingBillsCount,
  isDark,
  toggleDarkMode,
  onEnterSalesPortal,
  isOpen,
  onClose,
  currentUser,
  onLogout
}: SidebarProps) {
  
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };
  
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Executive Hub', 
      icon: LayoutDashboard,
      iconColor: 'text-[#1E94CF]'
    },
    { 
      id: 'finance', 
      label: 'Financeiro', 
      icon: DollarSign,
      iconColor: 'text-emerald-500',
      badge: pendingBillsCount > 0 ? { count: pendingBillsCount, color: 'bg-emerald-500' } : null
    },
    { 
      id: 'inventory', 
      label: 'Estoque', 
      icon: Boxes,
      iconColor: 'text-amber-500',
      badge: lowStockCount > 0 ? { count: lowStockCount, color: 'bg-amber-500 animate-pulse' } : null
    },
    { 
      id: 'crm', 
      label: 'Clientes', 
      icon: Users,
      iconColor: 'text-sky-500'
    },
    { 
      id: 'pipeline', 
      label: 'Pedidos', 
      icon: ShoppingCart,
      iconColor: 'text-indigo-400',
      badge: unbilledOrdersCount > 0 ? { count: unbilledOrdersCount, color: 'bg-[#1E94CF]' } : null
    },
    {
      id: 'sellers',
      label: 'Vendedores',
      icon: Users,
      iconColor: 'text-teal-400'
    },
    {
      id: 'virtualCFO',
      label: 'AI Center',
      icon: Cpu,
      iconColor: 'text-purple-400 text-shimmer',
      badge: { count: 'AIV2', color: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-[8px] border border-purple-400/20 px-1.5' }
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      iconColor: 'text-slate-400'
    }
  ];

  // Itens exclusivos para ADMIN (filtrados abaixo na renderização)
  const adminOnlyItems = [
    {
      id: 'collaborators',
      label: 'Colaboradores',
      icon: UserCog,
      iconColor: 'text-violet-400'
    }
  ];  return (
    <>
      {/* Background Overlay for mobile */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 backdrop-blur-xs"
        />
      )}

      <aside 
        id="sidebar-container" 
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col h-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:h-screen lg:sticky lg:top-0 lg:left-0 transition-all duration-300 border-r ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:flex'
        } ${
          isDark 
            ? 'bg-[#0F172A] border-slate-800/80 text-slate-100' 
            : 'bg-[#1F3767] border-slate-200/20 text-white'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-6 flex items-center justify-between border-b ${
          isDark ? 'border-slate-800/60' : 'border-white/10'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl shadow-lg ring-1 flex items-center justify-center transition-all ${
              isDark ? 'bg-slate-800 ring-white/10' : 'bg-[#1E94CF] ring-white/20'
            }`}>
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold tracking-wider text-xl flex items-center gap-1">
                WAGON <span className="text-brand-light text-[10px] font-medium tracking-tight bg-white/15 px-1.5 py-0.5 rounded-md">AI</span>
              </h1>
              <p className={`text-[9px] font-medium uppercase tracking-widest leading-none mt-1 ${isDark ? 'text-slate-400' : 'text-slate-300'}`}>
                Inteligência Comercial S.A.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick mode switches */}
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 duration-200 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-755' 
                  : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
              }`}
              title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Mobile close button drawer option */}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border lg:hidden transition-all hover:scale-105 active:scale-95 duration-200 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                  : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
              }`}
              title="Fechar Menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Operational Stats Widget */}
        <div className={`mx-4 mt-5 p-3.5 rounded-xl border transition-all ${
          isDark 
            ? 'bg-slate-900/50 border-slate-800/60' 
            : 'bg-white/5 border-white/5'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-2 tracking-wide font-medium">
            <span className={isDark ? 'text-slate-400' : 'text-slate-200'}>CONEXÃO ORÁCULO</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8BC039] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8BC039]"></span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className={`p-2 rounded-lg flex flex-col ${isDark ? 'bg-slate-950/40' : 'bg-black/15'}`}>
              <span className={isDark ? 'text-slate-500' : 'text-slate-300'}>Estoque</span>
              <span className={`font-black mt-0.5 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                {lowStockCount} SKUs
              </span>
            </div>
            <div className={`p-2 rounded-lg flex flex-col ${isDark ? 'bg-slate-950/40' : 'bg-black/15'}`}>
              <span className={isDark ? 'text-slate-500' : 'text-slate-300'}>Faturamento</span>
              <span className="text-slate-100 font-black mt-0.5">{unbilledOrdersCount} Pedidos</span>
            </div>
          </div>
        </div>

        {/* Nav Menu Options */}
        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className={`px-2 text-[10px] font-extrabold uppercase tracking-widest mb-2.5 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Módulos Hub
          </p>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-left cursor-pointer ${
                  isActive 
                    ? 'bg-[#1E94CF] text-white font-semibold shadow-md shadow-[#1E94CF]/25 relative' 
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-200 hover:bg-[#253f75] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`h-4.5 w-4.5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-white' : `${item.iconColor} group-hover:scale-110`
                  }`} />
                  <span className="text-xs font-semibold tracking-wide">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badge.color} shadow-sm`}>
                    {item.badge.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin-only section */}
          {currentUser?.role === 'ADMIN' && (
            <div className={`pt-4 mt-2 border-t ${isDark ? 'border-slate-800/60' : 'border-white/10'}`}>
              <p className={`px-2 text-[10px] font-extrabold uppercase tracking-widest mb-2 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Administração
              </p>
              {adminOnlyItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-left cursor-pointer ${
                      isActive
                        ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/25'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          : 'text-slate-200 hover:bg-[#253f75] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`h-4.5 w-4.5 transition-transform duration-200 ${
                        isActive ? 'scale-110 text-white' : `${item.iconColor} group-hover:scale-110`
                      }`} />
                      <span className="text-xs font-semibold tracking-wide">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {onEnterSalesPortal && (
            <div className={`pt-5 border-t mt-5 space-y-2 ${
              isDark ? 'border-slate-800' : 'border-white/10'
            }`}>
              <p className={`px-2 text-[10px] font-extrabold uppercase tracking-widest ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Canais Comerciais
              </p>
              <button
                onClick={() => {
                  onEnterSalesPortal();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-md text-left cursor-pointer transform hover:scale-[1.02] active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4 text-white animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wide uppercase">Portal Vendedor</span>
                </div>
                <span className="text-[8px] bg-black/40 text-emerald-300 px-1.5 py-0.5 rounded font-black">ENTRAR</span>
              </button>
            </div>
          )}
        </div>

        {/* User Info & Technical Stamp */}
        <div className={`p-4 border-t ${
          isDark ? 'border-slate-800 bg-slate-900/30' : 'border-white/10 bg-black/10'
        } text-xs shrink-0 mb-16 lg:mb-0`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[#1E94CF] ring-2 ring-[#8BC039] flex items-center justify-center text-white/90 font-extrabold text-xs select-none">
                {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'WA'}
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-[11px] font-bold truncate text-slate-100">
                  {currentUser?.name || 'Usuário Wagon AI'}
                </p>
                <p className={`text-[10px] truncate font-medium ${isDark ? 'text-slate-400' : 'text-slate-300'}`}>
                  {currentUser?.role === 'ADMIN' ? 'Diretor de Operações' : 'Executivo de Vendas'}
                </p>
              </div>
            </div>
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Efetuar Logout Seguro"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
          <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[8px] font-bold ${
            isDark ? 'border-slate-800 text-slate-500' : 'border-white/10 text-slate-300'
          }`}>
            <span className="uppercase">Licença Enterprise</span>
            <span>SLA: 99.99%</span>
          </div>
        </div>
      </aside>
    </>
  );
}
