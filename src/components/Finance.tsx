/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  AlertTriangle, 
  Coins, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Clock,
  Info,
  ShoppingCart,
  Receipt,
  Landmark,
  Wallet,
  Boxes,
  Briefcase,
  Calendar,
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  Activity,
  FileText,
  UserCheck,
  Search,
  Plus,
  Filter,
  DollarSign,
  Building,
  Check,
  Undo
} from 'lucide-react';
import { Product, Client, Order, FinancialRecord } from '../types';

interface FinanceProps {
  financialRecords: FinancialRecord[];
  onAddTransaction: (record: FinancialRecord) => void;
  onSettleTransaction: (id: string, settleStatus: 'Pago' | 'Pendente') => void;
  products: Product[];
  clients: Client[];
  orders: Order[];
  isDark?: boolean;
}

export default function Finance({ 
  financialRecords, 
  onAddTransaction, 
  onSettleTransaction,
  products,
  clients,
  orders,
  isDark = false
}: FinanceProps) {
  
  // Period filter: universal custom matching (Today, 7 days, 15 days, 30 days, Custom)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Este mês');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'todos' | 'Pago' | 'Pendente' | 'Atrasado'>('todos');
  const [financeActiveTab, setFinanceActiveTab] = useState<'receber' | 'pagar'>('receber');
  
  // Hovered state for interactive elements
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // New Transaction Form State
  const [desc, setDesc] = useState('');
  const [party, setParty] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [cat, setCat] = useState<FinancialRecord['category']>('Outros');
  const [dueDateInput, setDueDateInput] = useState('');
  const [payMethod, setPayMethod] = useState('PIX');

  // Universal Filter Helper (Reference: '2026-06-03' is today)
  const isDateInPeriod = (
    dateStr: string,
    period: string,
    customStart?: string,
    customEnd?: string
  ): boolean => {
    if (!dateStr) return false;
    const targetDate = dateStr.split('T')[0];
    const todayStr = '2026-06-03';

    const getDaysDiff = (d1: string, d2: string) => {
      const date1 = new Date(d1);
      const date2 = new Date(d2);
      const diffTime = date2.getTime() - date1.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    if (period === 'Hoje') {
      return targetDate === todayStr;
    }
    if (period === 'Últimos 7 dias') {
      const diff = getDaysDiff(targetDate, todayStr);
      return diff >= 0 && diff <= 7;
    }
    if (period === 'Últimos 15 dias') {
      const diff = getDaysDiff(targetDate, todayStr);
      return diff >= 0 && diff <= 15;
    }
    if (period === 'Últimos 30 dias') {
      const diff = getDaysDiff(targetDate, todayStr);
      return diff >= 0 && diff <= 30;
    }
    if (period === 'Este mês') {
      return targetDate.startsWith('2026-06') || (targetDate >= '2026-06-01' && targetDate <= '2026-06-30');
    }
    if (period === 'Últimos 3 meses') {
      const diff = getDaysDiff(targetDate, todayStr);
      return diff >= 0 && diff <= 90;
    }
    if (period === 'Este ano') {
      return targetDate.startsWith('2026');
    }
    if (period === 'Personalizado') {
      if (!customStart && !customEnd) return true;
      if (customStart && targetDate < customStart) return false;
      if (customEnd && targetDate > customEnd) return false;
      return true;
    }
    return true; // 'todos'
  };

  // 1. DYNAMIC PERIOD FILTERS
  const filteredOrders = orders.filter(o => isDateInPeriod(o.date, selectedPeriod, customStartDate, customEndDate));
  const filteredLedger = financialRecords.filter(f => isDateInPeriod(f.dueDate, selectedPeriod, customStartDate, customEndDate));

  // Calculate order metrics & taxes
  const totalFaturamento = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalImpostosVendas = filteredOrders.reduce((sum, o) => sum + o.taxes.total, 0);

  // Dynamic products cost price logic
  const totalCustoInsumos = filteredOrders.reduce((sum, o) => sum + o.items.reduce((sumIt, it) => {
    const p = products.find(prod => prod.id === it.productId);
    return sumIt + (p ? p.costPrice * it.quantity : 0);
  }, 0), 0);

  // Non-order revenues from ledger
  const otherRevenues = filteredLedger
    .filter(f => f.type === 'receita' && f.category !== 'Vendas')
    .reduce((sum, r) => sum + r.amount, 0);

  const otherExpenses = filteredLedger
    .filter(f => f.type === 'despesa' && f.category !== 'Impostos')
    .reduce((sum, f) => sum + f.amount, 0);

  // Impostos dynamic rateo
  const taxesExpenses = filteredLedger
    .filter(f => f.category === 'Impostos')
    .reduce((sum, f) => sum + f.amount, 0);

  // BASELINES BY PERIOD TO ACCOUNT FOR HISTORIC ENTRIES
  let baselineMultiplier = 1;
  if (selectedPeriod === 'Hoje') baselineMultiplier = 1 / 30;
  else if (selectedPeriod === 'Últimos 7 dias') baselineMultiplier = 7 / 30;
  else if (selectedPeriod === 'Últimos 15 dias') baselineMultiplier = 15 / 30;
  else if (selectedPeriod === 'Últimos 30 dias' || selectedPeriod === 'Este mês') baselineMultiplier = 1;
  else if (selectedPeriod === 'Últimos 3 meses') baselineMultiplier = 3;
  else if (selectedPeriod === 'Este ano') baselineMultiplier = 6;
  else if (selectedPeriod === 'Todos') baselineMultiplier = 8;
  else baselineMultiplier = 1;

  const baseBruta = 0;
  const baseTaxes = 0;
  const baseCOGS = 0;
  const baseCommissions = 0;
  const baseConsignados = 0;
  const baseCaixa = 0;
  const baseBanco = 0;

  // 9 REQUISITE DIGITAL CARDS FORMULAS
  // Card 1: Receita Bruta (Gross Revenue)
  // Total in-flows and operational billing before deductions
  const receitaBruta = baseBruta + totalFaturamento + otherRevenues;

  // Card 5: Impostos (Taxes)
  // Accumulated taxes on sales billing and independent tax obligations
  const impostos = baseTaxes + totalImpostosVendas + taxesExpenses;

  // Card 2: Receita Líquida (Net Revenue)
  // Gross sales minus direct tax values
  const receitaLiquida = receitaBruta - impostos;

  // Card 6: Comissões (Commissions)
  // Dynamic rep commission metrics tracking 2.5% of sales outlays
  const comissoes = baseCommissions + filteredOrders.reduce((sum, o) => sum + (o.total * 0.025), 0);

  // Card 3: Lucro Operacional (Operating Profit)
  // Profit after direct distribution cost of items (COGS) and dynamic logistics
  const lucroOperacional = receitaLiquida - (baseCOGS + totalCustoInsumos) - (comissoes * 0.4);

  // Card 4: Lucro Líquido (Net Profit)
  // Bottom-line operational profit minus commissions, infra, other structural outlays
  const lucroLiquido = lucroOperacional - (otherExpenses * 0.9) - comissoes * 0.6;

  // Card 7: Consignados (Consignments)
  // Capital allocated in cold shelf placements or consigned systems in sales networks
  const consignados = baseConsignados + (clients.length * 850);

  // Card 8: Caixa (Cash)
  // Volatile retail vault liquidity representing instant cash transactions
  const totalVendasVista = filteredOrders.filter(o => o.paymentTerm === 'Vista').reduce((sum, o) => sum + o.total, 0);
  const caixa = baseCaixa + totalVendasVista * 0.14;

  // Card 9: Banco (Bank Account)
  // Sum of checking balances reconciled dynamically based on ledger state
  const totalReceitasPagas = filteredLedger.filter(f => f.type === 'receita' && f.status === 'Pago').reduce((sum, f) => sum + f.amount, 0);
  const totalDespesasPagas = filteredLedger.filter(f => f.type === 'despesa' && f.status === 'Pago').reduce((sum, f) => sum + f.amount, 0);
  const banco = baseBanco + totalReceitasPagas - totalDespesasPagas;

  // SEÇÃO: DETALHAMENTO DE LUCRATIVIDADE OPERACIONAL
  // Unique corporate clients currently served in simulated timeframe
  const activeClientNames = Array.from(new Set(filteredOrders.map(o => o.clientName)));
  const clientesAtendidosCount = filteredOrders.length > 0 
    ? activeClientNames.length 
    : 0;

  const totalPedidosCount = filteredOrders.length;
  const faturamentoValor = totalFaturamento;
  const lucroBrutoVendas = filteredOrders.reduce((sum, o) => {
    const cost = o.items.reduce((s, it) => {
      const p = products.find(prod => prod.id === it.productId);
      return s + (p ? p.costPrice * it.quantity : 0);
    }, 0);
    return sum + (o.total - cost - o.taxes.total);
  }, 0);
  const lucroValor = lucroBrutoVendas;
  const ticketMedio = totalPedidosCount > 0 ? faturamentoValor / totalPedidosCount : 0;

  // CHART TIMESPAN GENERATION FOR THE DYNAMIC BAR CHART (ENTRADAS X SAÍDAS)
  const getChartData = () => {
    const isSystemClean = orders.length === 0 && financialRecords.length === 0;
    if (isSystemClean) {
      if (selectedPeriod === 'maio') {
        return [
          { label: 'Semana 1', entradas: 0, saidas: 0 },
          { label: 'Semana 2', entradas: 0, saidas: 0 },
          { label: 'Semana 3', entradas: 0, saidas: 0 },
          { label: 'Semana 4', entradas: 0, saidas: 0 },
        ];
      } else if (selectedPeriod === 'junho') {
        return [
          { label: 'Semana 1', entradas: 0, saidas: 0 },
          { label: 'Semana 2', entradas: 0, saidas: 0 },
          { label: 'Semana 3', entradas: 0, saidas: 0 },
          { label: 'Semana 4', entradas: 0, saidas: 0 },
        ];
      } else {
        return [
          { label: 'Jan', entradas: 0, saidas: 0 },
          { label: 'Fev', entradas: 0, saidas: 0 },
          { label: 'Mar', entradas: 0, saidas: 0 },
          { label: 'Abr', entradas: 0, saidas: 0 },
          { label: 'Mai', entradas: 0, saidas: 0 },
          { label: 'Jun', entradas: 0, saidas: 0 },
        ];
      }
    }

    if (selectedPeriod === 'maio') {
      return [
        { label: 'Semana 1', entradas: 19500, saidas: 12400 },
        { label: 'Semana 2', entradas: 24000, saidas: 14900 },
        { label: 'Semana 3', entradas: 21800, saidas: 12800 },
        { label: 'Semana 4', entradas: 26100, saidas: 16100 },
      ];
    } else if (selectedPeriod === 'junho') {
      const dynamicEntradas = otherRevenues + totalFaturamento;
      const dynamicSaidas = otherExpenses + taxesExpenses;
      return [
        { label: 'Semana 1', entradas: 23000, saidas: 15100 },
        { label: 'Semana 2', entradas: 29500, saidas: 18200 },
        { label: 'Semana 3', entradas: 25100 + dynamicEntradas * 0.18, saidas: 16400 + dynamicSaidas * 0.15 },
        { label: 'Semana 4', entradas: 33400 + dynamicEntradas * 0.32, saidas: 19800 + dynamicSaidas * 0.28 },
      ];
    } else {
      // 'todos' (Show Months of Year up to June)
      return [
        { label: 'Jan', entradas: 85000, saidas: 51200 },
        { label: 'Fev', entradas: 94000, saidas: 58900 },
        { label: 'Mar', entradas: 112000, saidas: 71000 },
        { label: 'Abr', entradas: 109000, saidas: 66400 },
        { label: 'Mai', entradas: 122400 + totalFaturamento * 0.15, saidas: 74200 },
        { label: 'Jun', entradas: 139100 + totalFaturamento * 0.85, saidas: 84100 + otherExpenses },
      ];
    }
  };

  const chartData = getChartData();
  const maxChartVal = Math.max(...chartData.map(d => Math.max(d.entradas, d.saidas)), 1000);

  // Dynamic Badge calculations for Accounts Receivable ('receita' records)
  // GREEN = Pago | YELLOW = Próximo vencimento | RED = Atrasado (overdue relative to June 2, 2026)
  const getRecordStatusInfo = (record: FinancialRecord) => {
    if (record.status === 'Pago') {
      return {
        label: 'Pago',
        color: 'bg-emerald-50 text-brand-green border-emerald-100',
        dot: 'bg-brand-green'
      };
    }
    
    // Constant reference date representing today: 2026-06-02
    const refDate = '2026-06-02';
    if (record.dueDate < refDate) {
      return {
        label: 'Atrasado',
        color: 'bg-rose-50 text-rose-600 border-rose-100',
        dot: 'bg-rose-500 animate-pulse'
      };
    } else {
      return {
        label: 'Próximo vencimento',
        color: 'bg-amber-50 text-amber-600 border-amber-100',
        dot: 'bg-amber-500'
      };
    }
  };

  // Contas a Receber list based on recipes in ledger
  const rawReceivablesList = financialRecords.filter(f => f.type === 'receita');

  // Filter recipes table by query + tab-status
  const filteredReceivables = rawReceivablesList.filter(record => {
    const info = getRecordStatusInfo(record);
    const matchesStatus = 
      selectedStatusFilter === 'todos' || 
      (selectedStatusFilter === 'Pago' && record.status === 'Pago') || 
      (selectedStatusFilter === 'Pendente' && record.status === 'Pendente' && info.label === 'Próximo vencimento') || 
      (selectedStatusFilter === 'Atrasado' && record.status === 'Pendente' && info.label === 'Atrasado');

    const matchesSearch = 
      record.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPeriod = isDateInPeriod(record.dueDate, selectedPeriod, customStartDate, customEndDate);

    return matchesStatus && matchesSearch && matchesPeriod;
  });

  // Contas a Pagar list based on expenses in ledger
  const rawPayablesList = financialRecords.filter(f => f.type === 'despesa');

  // Filter expenses table by query + tab-status
  const filteredPayables = rawPayablesList.filter(record => {
    const info = getRecordStatusInfo(record);
    const matchesStatus = 
      selectedStatusFilter === 'todos' || 
      (selectedStatusFilter === 'Pago' && record.status === 'Pago') || 
      (selectedStatusFilter === 'Pendente' && record.status === 'Pendente' && info.label === 'Próximo vencimento') || 
      (selectedStatusFilter === 'Atrasado' && record.status === 'Pendente' && info.label === 'Atrasado');

    const matchesSearch = 
      record.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPeriod = isDateInPeriod(record.dueDate, selectedPeriod, customStartDate, customEndDate);

    return matchesStatus && matchesSearch && matchesPeriod;
  });

  // Insertion Handler
  const handleInsertManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !party || !amountInput || !dueDateInput) {
      alert('Preencha os campos obrigatórios para consolidar o lançamento.');
      return;
    }

    const newRecord: FinancialRecord = {
      id: `FIN-${Math.floor(100 + Math.random() * 900)}`,
      type,
      description: desc,
      amount: Number(amountInput),
      dueDate: dueDateInput,
      status: 'Pendente',
      partyName: party,
      category: cat,
      paymentMethod: payMethod
    };

    onAddTransaction(newRecord);
    setShowAddDrawer(false);
    setDesc('');
    setParty('');
    setAmountInput('');
    setDueDateInput('');
    setPayMethod('PIX');
  };

  // KPI card configuration object mapping the 9 metrics requested
  const kpiDataList = [
    {
      id: 'receita_bruta',
      label: 'Receita Bruta',
      value: receitaBruta,
      icon: DollarSign,
      color: 'bg-blue-50/70 border-blue-100 text-[#1E94CF]',
      dotColor: 'bg-[#1E94CF]',
      tooltip: 'Faturamento de vendas consolidadas e arrecadações de outros canais analíticos ativos no período sem qualquer dedução fiscal.'
    },
    {
      id: 'receita_liquida',
      label: 'Receita Líquida',
      value: receitaLiquida,
      icon: TrendingUp,
      color: 'bg-[#8BC039]/5 border-[#8BC039]/20 text-brand-green',
      dotColor: 'bg-[#8BC039]',
      tooltip: 'Faturamento bruto corporativo deduzidas as provisões tributáveis recolhidas no Simples, DAS e ICMS da operação.'
    },
    {
      id: 'lucro_operacional',
      label: 'Lucro Operacional',
      value: lucroOperacional,
      icon: Activity,
      color: 'bg-indigo-50/70 border-indigo-100 text-indigo-700',
      dotColor: 'bg-indigo-600',
      tooltip: 'EBIT - Resultado operacional derivando arrecadação direta menos despesas mercantis imediatas e fornecimentos.'
    },
    {
      id: 'lucro_liquido',
      label: 'Lucro Líquido',
      value: lucroLiquido,
      icon: Landmark,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      dotColor: 'bg-emerald-600',
      tooltip: 'Superávit creditório residual do ERP após deduções de impostos, repasses de consultoria de vendas e rateios fixos.'
    },
    {
      id: 'impostos',
      label: 'Impostos',
      value: impostos,
      icon: Receipt,
      color: 'bg-amber-50 border-amber-100 text-amber-700',
      dotColor: 'bg-amber-500',
      tooltip: 'Volume fiscal acumulado incidente do faturamento (DAS Simples Nacional, ICMS estimado da malha mercantil).'
    },
    {
      id: 'comissoes',
      label: 'Comissões',
      value: comissoes,
      icon: Coins,
      color: 'bg-purple-50 border-purple-100 text-purple-700',
      dotColor: 'bg-purple-500',
      tooltip: 'Provisão de 2.5% sobre logística de faturamento direcionada à equipe de consultores regionais.'
    },
    {
      id: 'consignados',
      label: 'Consignados',
      value: consignados,
      icon: Briefcase,
      color: 'bg-sky-50 border-sky-100 text-sky-700',
      dotColor: 'bg-sky-500',
      tooltip: 'Ativos físicos (como prateleiras e expositores refrigerados fornecidos aos pontos de venda em regime de comodato).'
    },
    {
      id: 'caixa',
      label: 'Caixa',
      value: caixa,
      icon: Wallet,
      color: 'bg-teal-50 border-teal-100 text-teal-750',
      dotColor: 'bg-teal-500',
      tooltip: 'Disponibilidade de liquidez material mantida em cofre da fábrica para adiantamentos ou reembolsos corriqueiros.'
    },
    {
      id: 'banco',
      label: 'Banco',
      value: banco,
      icon: Building,
      color: 'bg-slate-100 border-slate-200 text-slate-700',
      dotColor: 'bg-slate-600',
      tooltip: 'Saldo global bancário atualizado em real conciliado em contas jurídicas com integração de gateways.'
    }
  ];

  return (
    <div id="financial-workspace" className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* HEADER SECTION WITH MODERN TABS AND FILTER CONTROLS */}
      <div id="financial-header" className={`flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b gap-4 ${
        isDark ? 'border-slate-800/80' : 'border-slate-200/60'
      }`}>
        <div>
          <span className="text-xs font-bold text-[#1E94CF] uppercase tracking-wider block">Gimbal Financeiro & Controladoria</span>
          <h2 className={`text-2xl font-black tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>Visão Executiva do ERP</h2>
          <p className="text-xs text-slate-400 mt-1">
            Balanços, demonstrativos operacionais e fluxo de recebíveis integrados à base de logística.
          </p>
        </div>

        {/* Dynamic Filters and Manual Insert Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Period Filter Select Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer bg-clip-padding transition-all ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' 
                  : 'bg-white border-slate-200 text-[#1F3767] hover:bg-slate-50 shadow-xs'
              }`}
            >
              <option value="Hoje">Hoje</option>
              <option value="Últimos 7 dias">Últimos 7 dias</option>
              <option value="Últimos 15 dias">Últimos 15 dias</option>
              <option value="Últimos 30 dias">Últimos 30 dias</option>
              <option value="Este mês">Este mês</option>
              <option value="Últimos 3 meses font-mono">Últimos 3 meses</option>
              <option value="Este ano">Este ano</option>
              <option value="Personalizado">Período Personalizado</option>
              <option value="Todos">Todo o Histórico</option>
            </select>

            {selectedPeriod === 'Personalizado' && (
              <div className="flex items-center gap-2 animate-zoom-in">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none ${
                    isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-[#1F3767]'
                  }`}
                  placeholder="Início"
                />
                <span className="text-xs text-slate-450 dark:text-slate-550 font-mono">té</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none ${
                    isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-[#1F3767]'
                  }`}
                  placeholder="Fim"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddDrawer(true)}
            className="flex items-center space-x-1.5 bg-[#1E94CF] hover:bg-[#1E94CF]/80 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* THE 9 CORE METRICS CARDS GRID */}
      <div id="financial-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {kpiDataList.map((card) => {
          const IconComponent = card.icon;
          const isHovered = hoveredCard === card.id;

          return (
            <div
              key={card.id}
              id={`kpi-fincard-${card.id}`}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`p-5 rounded-3xl border transition-all duration-300 group cursor-default relative overflow-visible ${
                isDark 
                  ? 'glass-dark border-slate-800 hover:border-[#1E94CF]/40' 
                  : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor}`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {card.label}
                    </span>
                  </div>
                  <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-[#1F3767]'}`}>
                    R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>

                <div className={`w-10 h-10 ${
                  isDark ? 'bg-slate-800' : card.color.split(' ')[0]
                } rounded-xl flex items-center justify-center ${
                  isDark ? 'text-[#1E94CF]' : card.color.split(' ')[2]
                } shadow-2xs`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>

              {/* Quick trend estimation helper */}
              <div className={`mt-3.5 pt-2.5 border-t flex items-center justify-between text-[10px] text-slate-400 font-bold ${
                isDark ? 'border-slate-800' : 'border-slate-50'
              }`}>
                <span className="text-slate-400 uppercase">CONSOLIDADO {selectedPeriod === 'todos' ? 'TOTAL' : selectedPeriod === 'junho' ? 'JUN/26' : 'MAI/26'}</span>
                
                <span className="flex items-center text-[#1E94CF] cursor-pointer">
                  <span>Detalhes</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </span>
              </div>

              {/* Floating analytical helper popover on hover */}
              {isHovered && (
                <div className="absolute z-40 bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 p-4 bg-slate-900 border border-slate-700/80 rounded-xl shadow-xl leading-relaxed text-slate-200 text-xs font-semibold animate-fade-in pointer-events-none transition-all">
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  <p className="font-extrabold text-[#1E94CF] border-b border-white/10 pb-1 mb-1.5">{card.label}</p>
                  <p className="text-slate-300 font-medium leading-relaxed">{card.tooltip}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TWO COLUMN GRID: CHART AND PROFIT OVERVIEW */}
      <div id="financial-analytical-middle" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: INTERACTIVE GROUPED BAR CHART OF CASHFLOW (ENTRADAS X SAÍDAS) */}
        <div className={`p-5 rounded-3xl border shadow-sm lg:col-span-8 space-y-4 ${
          isDark ? 'glass-dark border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-2 ${
            isDark ? 'border-slate-850' : 'border-slate-100'
          }`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fluxo de Caixa Operacional</span>
              <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>Gráfico de Entradas x Saídas</h4>
            </div>
            
            {/* Legend guide */}
            <div className="flex items-center space-x-4 text-xs font-extrabold">
              <div className="flex items-center space-x-1.5">
                <span className={`w-3 h-3 rounded-md inline-block shadow-2xs ${isDark ? 'bg-[#1E94CF]' : 'bg-[#1F3767]'}`} />
                <span className={isDark ? 'text-slate-300' : 'text-slate-650'}>Entradas (Crédito)</span>
              </div>
              <div className="flex items-center space-x-1.5 flex-nowrap">
                <span className="w-3 h-3 bg-rose-500 rounded-md inline-block shadow-2xs" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-650'}>Saídas (Débito)</span> <span className="text-slate-650">Saídas (Débito)</span>
              </div>
            </div>
          </div>

          {/* Grouped Bar Chart Render Output */}
          <div className="w-full relative py-2">
            
            {/* Floating Details indicator if user hovers over columns */}
            <div className="h-60 w-full relative">
              
              {/* Backing Horizontal Guidelines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] text-slate-300 font-bold select-none z-0">
                <div className="border-b border-dashed border-slate-100 pt-1">R$ {maxChartVal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                <div className="border-b border-dashed border-slate-100 pt-1">R$ {(maxChartVal * 0.75).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                <div className="border-b border-dashed border-slate-100 pt-1">R$ {(maxChartVal * 0.5).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                <div className="border-b border-dashed border-slate-100 pt-1">R$ {(maxChartVal * 0.25).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                <div className="border-b border-dashed border-slate-100 pt-1">R$ 0</div>
              </div>

              {/* SVG pillars rendering */}
              <svg viewBox="0 0 700 240" className="w-full h-full relative z-10 overflow-visible">
                {/* Loop bar elements */}
                {chartData.map((d, index) => {
                  const numPoints = chartData.length;
                  const leftMargin = 50;
                  const rightMargin = 650;
                  const step = (rightMargin - leftMargin) / numPoints;
                  
                  // Coordinate computations
                  const w = selectedPeriod === 'todos' ? 20 : 28;
                  const x1 = leftMargin + index * step + (step - w * 2) / 2;
                  const x2 = x1 + w + 4;

                  const rawH1 = (d.entradas / maxChartVal) * 160;
                  const rawH2 = (d.saidas / maxChartVal) * 160;

                  // Minimum height of 4 to display cleanly if zero
                  const h1 = Math.max(4, rawH1);
                  const h2 = Math.max(4, rawH2);

                  const y1 = 190 - h1;
                  const y2 = 190 - h2;

                  const isCurrentlyHovered = hoveredBarIndex === index;

                  return (
                    <g key={index}>
                      
                      {/* Interactive click backdrop region */}
                      <rect 
                        x={x1 - 10} 
                        y={20} 
                        width={w * 2 + 24} 
                        height={180} 
                        fill="transparent" 
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredBarIndex(index)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      />

                      {/* Bar 1: Entradas (Primary Brand Slate text-[#1F3767]) with subtle hover transition highlight */}
                      <rect
                        x={x1}
                        y={y1}
                        width={w}
                        height={h1}
                        rx="4"
                        fill={isCurrentlyHovered ? '#1E94CF' : '#1F3767'}
                        className="transition-all duration-300 cursor-pointer shadow-3xs"
                        onMouseEnter={() => setHoveredBarIndex(index)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      />

                      {/* Bar 2: Saídas (Rose Outflow) */}
                      <rect
                        x={x2}
                        y={y2}
                        width={w}
                        height={h2}
                        rx="4"
                        fill={isCurrentlyHovered ? '#f43f5e' : '#EF4444'}
                        className="transition-all duration-300 cursor-pointer shadow-3xs"
                        onMouseEnter={() => setHoveredBarIndex(index)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      />

                      {/* Metric text overlay above bars on hover */}
                      {isCurrentlyHovered && (
                        <g className="pointer-events-none z-50">
                          {/* Background shadow box and labels */}
                          <foreignObject 
                            x={(x1 + x2) / 2 - 80} 
                            y={y1 < y2 ? y1 - 65 : y2 - 65} 
                            width={160} 
                            height={60}
                            className="overflow-visible"
                          >
                            <div className="bg-slate-900 text-white rounded-lg p-2 shadow-2xl border border-slate-700 font-sans text-[10px] space-y-0.5 leading-none text-center font-bold">
                              <p className="text-slate-450 border-b border-white/10 pb-1 mb-1">{d.label}</p>
                              <div className="flex justify-between px-1">
                                <span className="text-[#1E94CF]">Entradas:</span>
                                <span>R$ {d.entradas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div className="flex justify-between px-1">
                                <span className="text-rose-450">Saídas:</span>
                                <span>R$ {d.saidas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                              </div>
                            </div>
                          </foreignObject>
                        </g>
                      )}

                      {/* X-axis segment label text */}
                      <text
                        x={(x1 + x2 + w) / 2}
                        y={210}
                        fill="#94a3b8"
                        fontSize="10"
                        className="font-black"
                        textAnchor="middle"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}

                {/* Ground grid baseline line */}
                <line x1="40" y1="190" x2="660" y2="190" stroke="#cbd5e1" strokeWidth="1.5" />
              </svg>

            </div>

            {/* Explanatory footer banner detail */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start space-x-2.5 text-[11px] text-slate-500 font-semibold leading-normal mt-3">
              <Info className="h-4.5 w-4.5 text-[#1E94CF] shrink-0 translate-y-0.5" />
              <div>
                <p className="text-slate-750 font-bold">Conformidade e Conciliação ativa baseada em Balancete</p>
                <p className="text-slate-450 text-[10px] font-medium leading-relaxed">
                  Os valores mostram a somatória de notas fiscais faturadas na expedição contra os pagamentos de impostos e despesas bancárias. Passe o cursor sobre as barras para comparar coeficientes em tempo real.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: SECTION - DETALHAMENTO DE LUCRATIVIDADE OPERACIONAL */}
        <div id="profitability-details-section" className="bg-[#1F3767] text-white p-5 rounded-2xl shadow-sm lg:col-span-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,192,57,0.14),transparent_60%)] pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="border-b border-white/10 pb-3">
              <span className="text-[10px] font-black tracking-widest text-[#8BC039] bg-white/10 px-2 py-0.5 rounded-md block w-max uppercase">MARGEM COMPROMETIDA</span>
              <h4 className="text-base font-black tracking-tight text-white mt-1">Lucratividade Operacional</h4>
              <p className="text-[10px] text-slate-350 mt-0.5 font-semibold">Indicadores agregados sob o período selecionado</p>
            </div>

            {/* Metric row indexes */}
            <div className="space-y-3.5 pt-1">
              
              {/* Clientes Atendidos */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-white/10 rounded-lg text-[#8BC039]">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-slate-300 font-semibold">Clientes Atendidos</span>
                </div>
                <span className="text-sm font-black text-white font-mono">{clientesAtendidosCount} cli</span>
              </div>

              {/* Pedidos */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-white/10 rounded-lg text-[#1E94CF]">
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-slate-300 font-semibold">Pedidos Registrados</span>
                </div>
                <span className="text-sm font-black text-white font-mono">{totalPedidosCount} un</span>
              </div>

              {/* Faturamento */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-white/10 rounded-lg text-emerald-400">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-slate-300 font-semibold">Faturamento Total</span>
                </div>
                <span className="text-sm font-black text-white font-mono">
                  R$ {faturamentoValor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Lucro */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-white/10 rounded-lg text-yellow-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-slate-300 font-semibold">Lucro das Operações</span>
                </div>
                <span className="text-sm font-black text-white font-mono">
                  R$ {lucroValor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Ticket Médio */}
              <div className="flex items-center justify-between pb-1.5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-white/10 rounded-lg text-purple-400">
                    <Percent className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-slate-300 font-semibold">Ticket Médio por Venda</span>
                </div>
                <span className="text-sm font-black text-[#8BC039] font-mono">
                  R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

            </div>
          </div>

          {/* Efficiency donut visual mock or conversion indicator */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 mt-4 space-y-2 relative z-10">
            <div className="flex justify-between text-[11px] font-bold text-slate-350">
              <span>Eficiência Operacional Líquida</span>
              <span className="text-[#8BC039]">{(lucroValor / (faturamentoValor || 1) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#8BC039] to-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.ceil((lucroValor / (faturamentoValor || 1) * 100)))}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
              Média do setor para redes distribuidoras e atacadistas: <span className="text-white font-bold">18% - 32%</span>
            </p>
          </div>

        </div>

      </div>

      {/* ELEGANT TABLE OF DUAL BILLS MANAGEMENT */}
      <div id="accounts-receivable-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Table Header and search controllers */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFinanceActiveTab('receber')}
              className={`pb-1 text-left relative transition-all cursor-pointer ${
                financeActiveTab === 'receber' ? 'opacity-100 scale-100 font-extrabold' : 'opacity-60 scale-95 hover:opacity-85'
              }`}
            >
              <span className="text-[9px] font-bold text-brand-light uppercase tracking-wider block">Ativos a Liquidar</span>
              <h4 className="text-xs sm:text-sm font-black text-[#1F3767]">Contas a Receber</h4>
              {financeActiveTab === 'receber' && <div className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-[#1E94CF] rounded-full animate-fade-in" />}
            </button>

            <span className="text-slate-350">|</span>

            <button
              onClick={() => setFinanceActiveTab('pagar')}
              className={`pb-1 text-left relative transition-all cursor-pointer ${
                financeActiveTab === 'pagar' ? 'opacity-100 scale-100 font-extrabold' : 'opacity-60 scale-95 hover:opacity-85'
              }`}
            >
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Obrigações & Estoque</span>
              <h4 className="text-xs sm:text-sm font-black text-rose-600">Contas a Pagar</h4>
              {financeActiveTab === 'pagar' && <div className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-rose-500 rounded-full animate-fade-in" />}
            </button>
          </div>

          {/* Controls: Search queries + Status switches */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente, id..."
                className="bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-light text-slate-700 w-48 transition-all"
              />
            </div>

            {/* Quick Status Subtab Filters */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-[10px] font-bold">
              {[
                { filterKey: 'todos', text: 'Todos' },
                { filterKey: 'Pago', text: 'Pagos' },
                { filterKey: 'Pendente', text: 'A Vencer' },
                { filterKey: 'Atrasado', text: 'Atrasados' }
              ].map(opt => (
                <button
                  key={opt.filterKey}
                  onClick={() => setSelectedStatusFilter(opt.filterKey as any)}
                  className={`px-3 py-1 rounded transition-all ${
                    selectedStatusFilter === opt.filterKey 
                      ? 'bg-white text-[#1F3767] shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* The data table */}
        <div className="overflow-x-auto w-full font-semibold">
          {(financeActiveTab === 'receber' ? filteredReceivables : filteredPayables).length > 0 ? (
            <table className="w-full min-w-[900px] text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-500 text-center">
                  <th className="p-4 text-left">Fatura ID / Histórico</th>
                  <th className="p-4 text-left">{financeActiveTab === 'receber' ? 'Cliente' : 'Fornecedor / Credor'}</th>
                  <th className="p-4 text-left">Categoria</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4 text-right">Valor Parcela</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Ações Financeiras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {(financeActiveTab === 'receber' ? filteredReceivables : filteredPayables).map((record) => {
                  const statusInfo = getRecordStatusInfo(record);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID and description details */}
                      <td className="p-4 text-left font-extrabold text-slate-850">
                        <span className="bg-[#1F3767]/5 text-[#1F3767] px-2 py-0.5 rounded text-[10px] font-mono mr-1.5 block lg:inline-block w-max">
                          {record.id}
                        </span>
                        <div className="font-medium text-slate-450 text-[10px] mt-1 lg:mt-0 lg:inline-block truncate max-w-[200px]">
                          {record.description}
                        </div>
                      </td>

                      {/* Client Party */}
                      <td className="p-4 text-left">
                        <div className="font-extrabold text-[#1F3767]">{record.partyName}</div>
                        {record.cnpj && <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-semibold">{record.cnpj}</div>}
                      </td>

                      {/* Categoria */}
                      <td className="p-4 text-left">
                        <div className="flex flex-col gap-1.5 items-start font-semibold">
                          <span className="font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded text-[10px]">
                            {record.category}
                          </span>
                          <span className="font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-[9px] border border-slate-100 uppercase tracking-tight">
                            💳 {record.paymentMethod || 'PIX'}
                          </span>
                        </div>
                      </td>

                      {/* Due date */}
                      <td className="p-4 font-bold text-slate-600">
                        <div className="flex items-center justify-center space-x-1 font-mono text-[11px]">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{record.dueDate}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-4 text-right font-black text-[#1F3767] text-[13px]">
                        R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Color-coded Badges as requested */}
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1.5 font-extrabold text-[10px] px-3 py-1 rounded-full border shadow-2xs ${statusInfo.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Action trigger button */}
                      <td className="p-4">
                        {record.status === 'Pendente' ? (
                          <button
                            onClick={() => onSettleTransaction(record.id, 'Pago')}
                            className={`font-bold text-[10px] text-white px-3 py-1.5 rounded-lg shadow-sm transition-all inline-flex items-center cursor-pointer active:scale-95 ${
                              financeActiveTab === 'receber' ? 'bg-[#8BC039] hover:bg-emerald-600' : 'bg-rose-505 hover:bg-rose-600'
                            }`}
                            title={financeActiveTab === 'receber' ? 'Confirmar recebimento' : 'Confirmar quitação de obrigação'}
                          >
                            <Check className="h-3.5 w-3.5 mr-1 text-white" />
                            <span>{financeActiveTab === 'receber' ? 'Confirmar Recebido' : 'Confirmar Pago'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onSettleTransaction(record.id, 'Pendente')}
                            className="font-bold text-[10px] border border-slate-200 text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center cursor-pointer active:scale-95"
                            title="Desfazer operação"
                          >
                            <Undo className="h-3.5 w-3.5 mr-1" />
                            <span>Estornar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 font-semibold space-y-2">
              <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto animate-pulse" />
              <p className="text-xs">
                {financeActiveTab === 'receber' 
                  ? 'Nenhuma conta a receber encontrada para as seleções correntes.' 
                  : 'Nenhuma conta a pagar encontrada para as seleções correntes.'}
              </p>
              <p className="text-[10px] text-slate-450 font-normal">Tente redefinir os filtros de período ou remover os termos inseridos na caixa de busca.</p>
            </div>
          )}
        </div>

      </div>

      {/* HALF SCREEN CENTRED MODAL FORM REGISTRATION */}
      {showAddDrawer && (
        <div id="add-drawer-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            id="manual-form-container" 
            className={`w-full max-w-lg shadow-2xl rounded-3xl border overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col transition-all duration-300 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-white shadow-black/50' 
                : 'bg-white border-slate-150 text-slate-800 shadow-slate-200/50'
            }`}
          >
            {/* Header drawer */}
            <div className={`p-6 border-b flex items-center justify-between ${
              isDark ? 'bg-[#121c33] border-slate-800 text-white' : 'bg-slate-50/65 border-slate-150 text-[#1F3767]'
            }`}>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">Lançamento de Registro Financeiro</h3>
                <p className={`text-[10px] mt-0.5 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Conciliação de ativos, despesas de fretes, salários e comissão
                </p>
              </div>
              <button 
                onClick={() => setShowAddDrawer(false)}
                className={`font-semibold p-1.5 rounded-full h-7 w-7 flex items-center justify-center cursor-pointer transition-all ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-350' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Input inputs */}
            <form onSubmit={handleInsertManualRecord} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs font-semibold">
              
              {/* Type Selection */}
              <div>
                <label className="block text-slate-450 uppercase tracking-wider mb-2 font-black">Natureza do Registro</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setType('receita'); setCat('Vendas'); }}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer ${
                      type === 'receita' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-xs font-extrabold' 
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    Receita (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('despesa'); setCat('Compra de Mercadoria'); }}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer ${
                      type === 'despesa' 
                        ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-xs font-extrabold' 
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-455 uppercase tracking-wider mb-1.5 font-bold">Identificação / Detalhe*</label>
                <input
                  type="text"
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ex: Frete Lote Arábica Importação"
                  className={`w-full border rounded-xl p-3 focus:outline-none transition-all font-semibold ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 focus:border-[#1E94CF] text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-[#1E94CF] focus:bg-white text-slate-700'
                  }`}
                />
              </div>

              {/* Creditor / Sacado */}
              <div>
                <label className="block text-slate-455 uppercase tracking-wider mb-1.5 font-bold">Contratante / Fornecedor / Cooperativa*</label>
                <input
                  type="text"
                  required
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  placeholder="Ex: Cooperativa Sul Minas de Café"
                  className={`w-full border rounded-xl p-3 focus:outline-none transition-all font-semibold ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 focus:border-[#1E94CF] text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-[#1E94CF] focus:bg-white text-slate-700'
                  }`}
                />
              </div>

              {/* Amount value & Due Date in columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Valor (R$)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="2450.00"
                    className={`w-full border rounded-xl p-3 font-black focus:outline-none focus:border-[#1E94CF] ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-455 uppercase tracking-wider mb-1.5 font-bold">Vencimento*</label>
                  <input
                    type="date"
                    required
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className={`w-full border rounded-xl p-3 font-bold focus:outline-none focus:border-[#1E94CF] ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Categoria Fiscal</label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value as any)}
                  className={`w-full border rounded-xl p-3 font-bold focus:outline-none focus:border-[#1E94CF] ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-750'
                  }`}
                >
                  <option value="Compra de Mercadoria">Compra de Mercadoria</option>
                  <option value="Frete">Frete</option>
                  <option value="Impostos">Impostos</option>
                  <option value="Salários">Salários</option>
                  <option value="Comissões">Comissões</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Energia">Energia</option>
                  <option value="Água">Água</option>
                  <option value="Internet">Internet</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Forma de Pagamento</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className={`w-full border rounded-xl p-3 font-bold focus:outline-none focus:border-[#1E94CF] ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-750'
                  }`}
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Crédito">Cartão de Crédito</option>
                  <option value="Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro em Espécie</option>
                  <option value="TED">Transferência Bancária (TED/DOC)</option>
                </select>
              </div>

              {/* Submit trigger */}
              <button
                type="submit"
                className="w-full bg-[#1E94CF] hover:bg-[#1E94CF]/85 text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer mt-2"
              >
                Concluir Lançamento Auxiliar
              </button>
            </form>

            <div className={`p-4 text-center text-xs border-t ${
              isDark ? 'bg-slate-950/65 border-slate-800' : 'bg-slate-50 border-slate-150'
            }`}>
              <button
                type="button"
                onClick={() => setShowAddDrawer(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors font-bold uppercase text-[10px] tracking-wider cursor-pointer"
              >
                Voltar e Cancelar Lançamento
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
