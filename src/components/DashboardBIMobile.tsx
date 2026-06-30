/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Cpu, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Info,
  ShoppingCart,
  Wallet,
  Boxes,
  Coins,
  UserCheck,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { Product, Client, Order, FinancialRecord } from '../types';

interface DashboardBIMobileProps {
  products: Product[];
  clients: Client[];
  orders: Order[];
  financialRecords: FinancialRecord[];
  onSettleTransaction?: (id: string, settleStatus: 'Pago' | 'Pendente') => void;
  isDark: boolean;
  totalFaturamento: number;
  calculatedLucroVal: number;
  bankBalance: number;
  physicalCashVal: number;
  valorEstoque: number;
  totalComissoesCount: number;
  forecastNextMonth: number;
  lowStockSKUs: Product[];
  riskClients: Client[];
  loadingInsights: boolean;
  insightReport: string;
  generateAIAdvisory: () => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
}

export default function DashboardBIMobile({
  products,
  clients,
  orders,
  financialRecords,
  onSettleTransaction,
  isDark,
  totalFaturamento,
  calculatedLucroVal,
  bankBalance,
  physicalCashVal,
  valorEstoque,
  totalComissoesCount,
  forecastNextMonth,
  lowStockSKUs,
  riskClients,
  loadingInsights,
  insightReport,
  generateAIAdvisory,
  selectedPeriod,
  setSelectedPeriod,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate
}: DashboardBIMobileProps) {
  
  const [isCopilotExpanded, setIsCopilotExpanded] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  // Calculate dynamic 7-point dataset based on actual user-entered data
  const getDaysDiffForChart = (dateStr: string) => {
    if (!dateStr) return 999;
    const targetDate = dateStr.split('T')[0];
    const todayStr = '2026-06-03';
    const time1 = new Date(targetDate).getTime();
    const time2 = new Date(todayStr).getTime();
    return Math.floor((time2 - time1) / (1000 * 60 * 60 * 24));
  };

  const getGroupStats = (minDiff: number, maxDiff: number) => {
    const groupOrders = orders.filter(o => {
      const diff = getDaysDiffForChart(o.date);
      return diff >= minDiff && (maxDiff === 999 ? true : diff <= maxDiff);
    });

    const groupFinancials = financialRecords.filter(f => {
      const diff = getDaysDiffForChart(f.dueDate);
      return diff >= minDiff && (maxDiff === 999 ? true : diff <= maxDiff);
    });

    const entradas = groupOrders.reduce((acc, o) => acc + o.total, 0);

    const costInsumos = groupOrders.reduce((acc, o) => acc + o.items.reduce((sum, it) => {
      const p = products.find(prod => prod.id === it.productId);
      return sum + (p ? p.costPrice * it.quantity : 0);
    }, 0), 0);
    const taxes = groupOrders.reduce((acc, o) => acc + o.taxes.total, 0);

    const comissoes = Math.round(entradas * 0.05);
    const lucro = entradas - costInsumos - taxes - comissoes;

    return { 
      entradas, 
      lucro: Math.max(0, lucro) 
    };
  };

  // Simple 7-day points helper for the compact graph
  const chartPoints = [
    { day: 'D-12', ...getGroupStats(11, 12) },
    { day: 'D-10', ...getGroupStats(9, 10) },
    { day: 'D-08', ...getGroupStats(7, 8) },
    { day: 'D-06', ...getGroupStats(5, 6) },
    { day: 'D-04', ...getGroupStats(3, 4) },
    { day: 'D-02', ...getGroupStats(1, 2) },
    { day: 'Hoje', entradas: totalFaturamento, lucro: calculatedLucroVal }
  ];

  const maxFinanceVal = Math.max(...chartPoints.map(p => p.entradas), ...chartPoints.map(p => p.lucro), 1000);

  const mapYCoordinate = (val: number) => {
    return 190 - (val * (190 - 25) / maxFinanceVal);
  };

  const mapXCoordinate = (index: number) => {
    return 30 + (index * (260 - 30) / (chartPoints.length - 1));
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 block lg:hidden">
      
      {/* Dynamic Greeting Header */}
      <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
        isDark ? 'glass-dark border-slate-800' : 'glass-light border-slate-100 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">👋</span>
            <h2 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              Olá, Edilson Mesquita
            </h2>
          </div>
          
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => generateAIAdvisory()}
                disabled={loadingInsights}
                className="p-1.5 rounded-lg bg-slate-850/10 dark:bg-slate-800 text-slate-500 dark:text-slate-300 min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-90 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loadingInsights ? 'animate-spin' : ''}`} />
              </button>
              
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border focus:outline-none cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900 border-slate-800 text-white' 
                    : 'bg-white border-slate-200 text-[#1F3767]'
                }`}
              >
                <option value="Hoje">Hoje</option>
                <option value="Últimos 7 dias">Últimos 7 dias</option>
                <option value="Últimos 15 dias">Últimos 15 dias</option>
                <option value="Últimos 30 dias">Últimos 30 dias</option>
                <option value="Este mês">Este mês</option>
                <option value="Últimos 3 meses">Últimos 3 meses</option>
                <option value="Este ano">Este ano</option>
                <option value="Personalizado">Pers...</option>
                <option value="Todos">Histórico</option>
              </select>
            </div>

            {selectedPeriod === 'Personalizado' && (
              <div className="flex items-center gap-1 mt-1 animate-zoom-in">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`px-1.5 py-1 rounded text-[9px] font-bold font-mono focus:outline-none ${
                    isDark ? 'bg-slate-950 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-750'
                  }`}
                  title="Início"
                />
                <span className="text-[8px] font-mono">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`px-1.5 py-1 rounded text-[9px] font-bold font-mono focus:outline-none ${
                    isDark ? 'bg-slate-950 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-750'
                  }`}
                  title="Fim"
                />
              </div>
            )}
          </div>
        </div>

        <div className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-[#1F3767]/90'}`}>
          Operação faturou <strong className="text-[#1E94CF]">R$ {totalFaturamento.toLocaleString('pt-BR')}</strong> no período selecionado.
          <span className="text-[#8BC039] font-extrabold block text-[10px] mt-0.5 animate-pulse">
            ▲ 0% acima do período anterior
          </span>
        </div>
      </div>

      {/* FIRST BLOCK: CFO Copilot */}
      <div 
        className={`p-4 rounded-xl border transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-[#0F172A] via-slate-900 to-purple-950/20 border-purple-500/20 shadow-md' 
            : 'bg-gradient-to-br from-white via-indigo-50/20 to-cyan-50/10 border-[#1E94CF]/25 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 text-white animate-pulse">
              <Cpu className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-1.5 py-0.5 rounded-md block w-max leading-none">
                Executive Advisor
              </span>
              <h4 className={`text-xs font-black mt-1 ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                🤖 CFO COPILOT
              </h4>
            </div>
          </div>

          <button
            onClick={() => setIsCopilotExpanded(!isCopilotExpanded)}
            className="text-[10px] font-bold text-[#1E94CF] px-2.5 py-1.5 rounded-lg bg-[#1E94CF]/5 active:scale-95 transition-all min-h-[38px] flex items-center justify-center font-black uppercase"
          >
            {isCopilotExpanded ? 'Recolher ✕' : 'Consultar 💡'}
          </button>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2 text-[9px] font-extrabold">
          <div className={`p-2 rounded-lg flex flex-col justify-center ${isDark ? 'bg-slate-950/40' : 'bg-slate-100/50'}`}>
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Run-rate Projetado</span>
            <span className={`text-xs font-black mt-0.5 ${isDark ? 'text-purple-400' : 'text-[#1F3767]'}`}>
              R$ {forecastNextMonth.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className={`p-2 rounded-lg flex flex-col justify-center ${isDark ? 'bg-slate-950/40' : 'bg-slate-100/50'}`}>
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Análise Geral</span>
            <span className="text-[#8BC039] font-black mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green block"></span> Estável (99% SLA)
            </span>
          </div>
        </div>

        {isCopilotExpanded && (
          <div className={`mt-3 pt-3 border-t text-[10.5px] leading-relaxed space-y-2 transition-all duration-300 ${
            isDark ? 'border-slate-800/80 text-slate-300' : 'border-slate-200/50 text-[#1F3767]/90'
          }`}>
            {loadingInsights ? (
              <div className="flex items-center justify-center space-x-2 py-3">
                <div className="w-4.5 h-4.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-extrabold text-slate-450">Oráculo compilando faturamentos...</span>
              </div>
            ) : insightReport ? (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {insightReport.split('\n').slice(0, 8).map((line, idx) => {
                  const cleaned = line.trim();
                  if (!cleaned) return null;
                  return (
                    <p key={idx} className="font-semibold text-[10.5px]">
                      {cleaned.startsWith('#') ? '💡 ' + cleaned.replace(/#/g,'').trim() : cleaned}
                    </p>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-[10px] text-slate-500 font-bold">Sem parecer diagnóstico carregado.</p>
            )}
          </div>
        )}
      </div>

      {/* SECOND BLOCK: RECEITA | LUCRO */}
      <div className="grid grid-cols-2 gap-3">
        {/* Receita Card */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-150 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Receita</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-800 text-[#1E94CF]' : 'text-[#1E94CF] bg-[#1E94CF]/10'}`}>
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              R$ {totalFaturamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-[8px] text-[#8BC039] font-extrabold flex items-center mt-0.5">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> 0%
            </span>
          </div>
        </div>

        {/* Lucro Card */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-150 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lucro Líquido</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-800 text-[#8BC039]' : 'text-[#8BC039] bg-[#8BC039]/10'}`}>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              R$ {calculatedLucroVal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-[8px] text-[#8BC039] font-extrabold flex items-center mt-0.5">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> 0%
            </span>
          </div>
        </div>
      </div>

      {/* THIRD BLOCK: CAIXA | ESTOQUE */}
      <div className="grid grid-cols-2 gap-3">
        {/* Caixa - combined Bank Balance and Physical cash */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-150 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Caixa & Bancos</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-800 text-emerald-400' : 'text-emerald-500 bg-emerald-500/10'}`}>
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              R$ {(bankBalance + physicalCashVal).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </h3>
            <span className={`text-[8.5px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} block mt-0.5`}>
              Liquidez Disponível
            </span>
          </div>
        </div>

        {/* Estoque Card */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-150 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Estoque</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-800 text-purple-400' : 'text-purple-500 bg-purple-500/10'}`}>
              <Boxes className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              R$ {valorEstoque.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </h3>
            <span className={`text-[8px] font-black uppercase mt-0.5 block ${
              lowStockSKUs.length > 0 ? 'text-amber-500 animate-pulse' : 'text-[#8BC039]'
            }`}>
              {lowStockSKUs.length > 0 ? `⚠️ ${lowStockSKUs.length} SKUs Alerta` : 'Estoque Saudável'}
            </span>
          </div>
        </div>
      </div>

      {/* FOURTH BLOCK: COMISSÕES | CLIENTES */}
      <div className="grid grid-cols-2 gap-3">
        {/* Comissões Card */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-150 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Comissões</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-800 text-purple-400' : 'text-purple-500 bg-purple-500/10'}`}>
              <Coins className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              R$ {totalComissoesCount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </h3>
            <span className={`text-[8.5px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} block mt-0.5`}>
              Provisões sobre Vendas
            </span>
          </div>
        </div>

        {/* Clientes Card */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-150 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Clientes CRM</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-800 text-teal-400' : 'text-teal-500 bg-teal-500/10'}`}>
              <UserCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              {clients.length} Contas
            </h3>
            <span className={`text-[8.5px] font-bold block mt-0.5 ${
              riskClients.length > 0 ? 'text-amber-500' : 'text-[#8BC039]'
            }`}>
              {riskClients.length > 0 ? `⚠️ ${riskClients.length} em Risco` : 'Risco Controlado'}
            </span>
          </div>
        </div>
      </div>

      {/* COMPACT & COLLAPSED CHART VECTOR */}
      <div className={`p-4 rounded-xl border transition-all ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-[#1E94CF]" />
            <h5 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              FLUXÃO DE CAIXA VETORIAL
            </h5>
          </div>
          <button
            onClick={() => setIsChartExpanded(!isChartExpanded)}
            className="text-[10px] font-black text-[#1E94CF] px-2.5 py-1.5 rounded-lg bg-[#1E94CF]/5 active:scale-95 transition-all min-h-[38px] flex items-center justify-center uppercase"
          >
            {isChartExpanded ? 'Encolher ✕' : 'Ver Gráfico ↗'}
          </button>
        </div>

        {isChartExpanded ? (
          <div className="mt-4 pt-3 border-t border-slate-200/5">
            <div className="w-full h-40 relative">
              <svg viewBox="0 0 300 200" className="w-full h-full">
                <text x="10" y="20" fill={isDark ? "#64748b" : "#94a3b8"} fontSize={8} className="font-bold">Max: R$ {maxFinanceVal.toLocaleString('pt-BR')}</text>
                <line x1="10" y1="190" x2="290" y2="190" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Entradas SVG Polyline */}
                {(() => {
                  const coords = chartPoints.map((p, i) => `${mapXCoordinate(i)},${mapYCoordinate(p.entradas)}`);
                  return <path d={`M ${coords.join(' L ')}`} stroke="#1E94CF" strokeWidth={2.5} fill="none" strokeLinecap="round" />;
                })()}

                {/* Lucro SVG Polyline */}
                {(() => {
                  const coords = chartPoints.map((p, i) => `${mapXCoordinate(i)},${mapYCoordinate(p.lucro)}`);
                  return <path d={`M ${coords.join(' L ')}`} stroke="#8BC039" strokeWidth={2.5} fill="none" strokeLinecap="round" />;
                })()}

                {chartPoints.map((p, i) => (
                  <text 
                    key={i} 
                    x={mapXCoordinate(i)} 
                    y={198} 
                    fill={isDark ? "#475569" : "#94a3b8"} 
                    fontSize={7} 
                    textAnchor="middle" 
                    className="font-bold cursor-default"
                  >
                    {p.day}
                  </text>
                ))}
              </svg>
            </div>
            <div className="flex justify-center space-x-3.5 mt-2 text-[8px] font-black uppercase">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1E94CF]"></span> Entradas</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#8BC039]"></span> Lucro Líquido</span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 font-bold block mt-1.5 leading-none">
            Gráfico de fluxo otimizado para celulares.
          </p>
        )}
      </div>

      {/* TABLE DATA CONVERTED TO CARDS ON MOBILE (Timeline releases) */}
      <div className={`p-4 rounded-xl border transition-all ${
        isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-100 shadow-xs'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-200/5 pb-2.5 mb-3">
          <div className="flex items-center space-x-1">
            <span className="text-xs">⏱️</span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ÚLTIMAS TRANSAÇÕES
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-500">Fluxo em tempo real</span>
        </div>

        <div className="space-y-3">
          {financialRecords.slice(0, 4).map((record) => {
            const isReceita = record.type === 'receita';
            const isPaid = record.status === 'Pago';
            return (
              <div 
                key={record.id} 
                className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                  isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50/50 border-slate-150/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className={`text-xs font-black leading-tight ${isDark ? 'text-slate-100' : 'text-[#1F3767]'}`}>
                      {record.description}
                    </p>
                    <span className="text-[9px] bg-[#1E94CF]/10 text-[#1E94CF] font-extrabold px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">
                      {record.category}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-black font-mono ${isReceita ? 'text-[#8BC039]' : 'text-rose-500'}`}>
                      {isReceita ? '+' : '-'} R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded leading-none mt-1 inline-block ${
                      isPaid ? 'bg-emerald-500/10 text-[#8BC039]' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-205/5">
                  <span>Venc: {record.dueDate}</span>
                  {onSettleTransaction && (
                    <button
                      onClick={() => onSettleTransaction(record.id, isPaid ? 'Pendente' : 'Pago')}
                      className={`text-[9px] font-black px-2.5 py-1 border rounded-lg transition-all min-h-[36px] min-w-[70px] ${
                        isPaid 
                          ? 'border-slate-800 text-slate-500 bg-transparent' 
                          : 'border-[#1E94CF] text-[#1E94CF] bg-white dark:bg-slate-950'
                      }`}
                    >
                      {isPaid ? 'Estornar' : 'Liquidar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
