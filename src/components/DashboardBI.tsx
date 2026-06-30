/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  AlertTriangle, 
  Coins, 
  Sparkles, 
  Cpu, 
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
  DollarSign,
  User,
  Trash2,
  Download,
  X,
  CheckCircle2
} from 'lucide-react';
import { Product, Client, Order, FinancialRecord, BIInsight, StockMovement, Commission } from '../types';
import DashboardBIMobile from './DashboardBIMobile';
import { generateExecutiveReportPDF, ExecutiveReportData } from '../utils/executiveReportGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrentAccessToken } from '../lib/supabaseClient';

interface DashboardBIProps {
  products: Product[];
  clients: Client[];
  orders: Order[];
  financialRecords: FinancialRecord[];
  commissions?: Commission[];
  stockMovements?: StockMovement[];
  onSettleTransaction?: (id: string, settleStatus: 'Pago' | 'Pendente') => void;
  isDark?: boolean;
}

export default function DashboardBI({ 
  products, 
  clients, 
  orders, 
  financialRecords,
  commissions = [],
  stockMovements = [],
  onSettleTransaction,
  isDark = false
}: DashboardBIProps) {
  
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightReport, setInsightReport] = useState<string>('');
  const [suggestedCards, setSuggestedCards] = useState<BIInsight[]>([]);
  const [aiMethod, setAiMethod] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Este mês');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredInsightId, setHoveredInsightId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Mobile layout state controls
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isCopilotExpanded, setIsCopilotExpanded] = useState(false);

  // Chart Line Toggles
  const [visibleLines, setVisibleLines] = useState({
    entradas: true,
    saidas: true,
    clientes: true,
    comissoes: true,
    lucro: true
  });

  // Executive Report Panel and History State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('Este mês');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportHistory, setReportHistory] = useState<ExecutiveReportData[]>(() => {
    try {
      const cached = localStorage.getItem('wagon_executive_reports_history');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [reportGenerating, setReportGenerating] = useState(false);

  // Load physical or custom sellers
  const getStoredSellers = () => {
    try {
      const cached = localStorage.getItem('vertice_erp_sellers');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: '1', name: 'Marcos Pinheiro', email: 'marcos@wagon.ai', phone: '(11) 98765-4321', region: 'São Paulo', active: true },
      { id: '2', name: 'Juliana Vasconcelos', email: 'juliana@wagon.ai', phone: '(11) 97654-3210', region: 'Rio de Janeiro', active: true },
      { id: '3', name: 'Alexandre Lopes', email: 'alexandre@wagon.ai', phone: '(11) 96543-2109', region: 'Minas Gerais', active: true },
    ];
  };

  const handleDeleteReport = (id: string) => {
    const updated = reportHistory.filter(r => r.id !== id);
    setReportHistory(updated);
    localStorage.setItem('wagon_executive_reports_history', JSON.stringify(updated));
  };

  const handleRedownloadReport = (report: ExecutiveReportData) => {
    const sellers = getStoredSellers();
    const doc = generateExecutiveReportPDF(report, products, clients, orders, sellers, commissions);
    doc.save(report.name);
  };

  const handleGenerateExecutiveReport = async () => {
    setReportGenerating(true);
    // Simulate minor delay for premium effect
    await new Promise(resolve => setTimeout(resolve, 1400));
    
    try {
      const filterDateForReport = (dateStr: string) => {
        if (!dateStr) return false;
        const targetDate = dateStr.split('T')[0];
        const todayStr = '2026-06-03';

        const getDaysDiff = (d1: string, d2: string) => {
          const time1 = new Date(d1).getTime();
          const time2 = new Date(d2).getTime();
          return Math.floor((time2 - time1) / (1000 * 60 * 60 * 24));
        };

        if (reportPeriod === 'Hoje') {
          return targetDate === todayStr;
        }
        if (reportPeriod === 'Últimos 7 dias') {
          const diff = getDaysDiff(targetDate, todayStr);
          return diff >= 0 && diff <= 7;
        }
        if (reportPeriod === 'Últimos 15 dias') {
          const diff = getDaysDiff(targetDate, todayStr);
          return diff >= 0 && diff <= 15;
        }
        if (reportPeriod === 'Últimos 30 dias') {
          const diff = getDaysDiff(targetDate, todayStr);
          return diff >= 0 && diff <= 30;
        }
        if (reportPeriod === 'Este mês') {
          return targetDate.startsWith('2026-06') || (targetDate >= '2026-06-01' && targetDate <= '2026-06-30');
        }
        if (reportPeriod === 'Mês anterior') {
          return targetDate.startsWith('2026-05');
        }
        if (reportPeriod === 'Este ano') {
          return targetDate.startsWith('2026');
        }
        if (reportPeriod === 'Personalizado') {
          if (!reportStartDate && !reportEndDate) return true;
          if (reportStartDate && targetDate < reportStartDate) return false;
          if (reportEndDate && targetDate > reportEndDate) return false;
          return true;
        }
        return true; // Todos
      };

      const repOrders = orders.filter(o => filterDateForReport(o.date));
      const repLedger = financialRecords.filter(f => filterDateForReport(f.dueDate));

      // Metrics
      const totalVendas = repOrders.length;
      const totalFaturamento = repOrders.reduce((acc, o) => acc + o.total, 0);
      const totalSaidas = repLedger.filter(f => f.type === 'despesa').reduce((acc, f) => acc + f.amount, 0);

      const totalCustoInsumos = repOrders.reduce((acc, o) => acc + o.items.reduce((sum, it) => {
        const p = products.find(prod => prod.id === it.productId);
        return sum + (p ? p.costPrice * it.quantity : 0);
      }, 0), 0);
      const totalImpostosVendas = repOrders.reduce((acc, o) => acc + o.taxes.total, 0);

      const comissaoPaga = commissions.filter(c => c.status === 'PAGO').reduce((acc, c) => acc + c.valor, 0);
      const comissaoAPagar = commissions.filter(c => c.status !== 'PAGO').reduce((acc, c) => acc + c.valor, 0);

      const lucroLiquido = totalFaturamento - totalCustoInsumos - totalImpostosVendas - comissaoPaga - comissaoAPagar;
      const impostos = totalImpostosVendas + repLedger.filter(f => f.category === 'Impostos').reduce((acc, f) => acc + f.amount, 0);

      const totalReceitasPagas = repLedger.filter(f => f.type === 'receita' && f.status === 'Pago').reduce((acc, f) => acc + f.amount, 0);
      const totalDespesasPagas = repLedger.filter(f => f.type === 'despesa' && f.status === 'Pago').reduce((acc, f) => acc + f.amount, 0);
      const saldoBancario = totalReceitasPagas - totalDespesasPagas;

      const totalVendasVista = repOrders.filter(o => o.paymentTerm === 'Vista').reduce((acc, o) => acc + o.total, 0);
      const caixaFisico = totalVendasVista * 0.12;

      const valorEstoque = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
      const ativosConsignados = clients.length * 8500;
      const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;

      // Extract sellers list
      const sellers = getStoredSellers();

      const sellersPerformances = sellers.map(sel => {
        const selOrders = repOrders.filter(o => o.salesRep === sel.name);
        const totalSold = selOrders.reduce((sum, o) => sum + o.total, 0);
        return { name: sel.name, totalSold };
      }).sort((a,b) => b.totalSold - a.totalSold);

      const topSellerName = sellersPerformances[0]?.name || 'Marcos Pinheiro';
      const topSellerSalesPct = totalFaturamento > 0 
        ? Math.round((sellersPerformances[0]?.totalSold || 0) / totalFaturamento * 100) 
        : 45;

      const cfoInsights = [
        `• Seu faturamento líquido cresceu ${totalVendas > 2 ? '12%' : '8%'} no período sob governança WAGON AI.`,
        `• Existem R$ ${Math.round(valorEstoque * 0.20).toLocaleString('pt-BR')} em estoque sem movimentação imediata nas gôndolas de abastecimento.`,
        `• Vendedor de destaque ${topSellerName} foi responsável por ${topSellerSalesPct}% das vendas integradas de comissionamento de canal.`,
        `• O saldo bancário de R$ ${saldoBancario.toLocaleString('pt-BR')} e o caixa físico de R$ ${caixaFisico.toLocaleString('pt-BR')} garantem ROI operacional saudável e conformação tributária.`
      ];

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const formattedDate = `${dd}-${mm}-${yyyy}`;
      const reportFileName = `WAGON-RELATORIO-EXECUTIVO-${formattedDate}.pdf`;

      const newReport: ExecutiveReportData = {
        id: `REP-${Math.floor(10000 + Math.random() * 90000)}`,
        name: reportFileName,
        period: reportPeriod,
        startDate: reportStartDate || '2026-06-01',
        endDate: reportEndDate || '2026-06-30',
        createdAt: today.toISOString(),
        adminName: 'Edilson Mesquita',
        metrics: {
          totalVendas,
          totalFaturamento,
          totalSaidas,
          lucroLiquido,
          impostos,
          saldoBancario,
          caixaFisico,
          valorEstoque,
          ativosConsignados,
          comissaoPaga,
          comissaoPendente: comissaoAPagar,
          ticketMedio
        },
        cfoInsights
      };

      const updatedHistory = [newReport, ...reportHistory];
      setReportHistory(updatedHistory);
      localStorage.setItem('wagon_executive_reports_history', JSON.stringify(updatedHistory));

      const doc = generateExecutiveReportPDF(newReport, products, clients, repOrders, sellers, commissions);
      doc.save(reportFileName);

    } catch (err) {
      console.error(err);
    } finally {
      setReportGenerating(false);
    }
  };

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
      const time1 = new Date(d1).getTime();
      const time2 = new Date(d2).getTime();
      return Math.floor((time2 - time1) / (1000 * 60 * 60 * 24));
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
    return true; // 'Todos'
  };

  const filteredOrders = orders.filter(o => isDateInPeriod(o.date, selectedPeriod, customStartDate, customEndDate));
  const filteredFinancialRecords = financialRecords.filter(f => isDateInPeriod(f.dueDate, selectedPeriod, customStartDate, customEndDate));

  // Dynamic calculations using filtered subsets
  const totalVendas = filteredOrders.length;
  const totalFaturamento = filteredOrders.reduce((acc, o) => acc + o.total, 0);
  
  // Total Saídas from Financial ledger (type = despesa)
  const totalSaidasLedger = filteredFinancialRecords
    .filter(f => f.type === 'despesa')
    .reduce((acc, f) => acc + f.amount, 0);

  // Insumos/Custo dos produtos vendidos
  const totalCustoInsumos = filteredOrders.reduce((acc, o) => acc + o.items.reduce((sum, it) => {
    const p = products.find(prod => prod.id === it.productId);
    return sum + (p ? p.costPrice * it.quantity : 0);
  }, 0), 0);

  // Impostos das vendas
  const totalImpostosVendas = filteredOrders.reduce((acc, o) => acc + o.taxes.total, 0);

  // Comissão Paga calculated directly from our Commissions table / state
  const comissaoPaga = commissions
    .filter(c => c.status === 'PAGO')
    .reduce((acc, c) => acc + c.valor, 0);

  // Comissão a Pagar (comissão pendente ou parcial) calculated from our Commissions table / state
  const comissaoAPagar = commissions
    .filter(c => c.status === 'PENDENTE' || c.status === 'PARCIAL')
    .reduce((acc, c) => acc + c.valor, 0);

  const totalComissoesCount = comissaoPaga + comissaoAPagar;

   // Lucro líquido: Faturamento - Insumos - Impostos - Comissões (Ambas impactam o lucro)
  const calculatedLucroVal = totalFaturamento - totalCustoInsumos - totalImpostosVendas - comissaoPaga - comissaoAPagar;

  // Impostos agregados (vendas + outras despesas de Impostos no financeiro)
  const totalImpostos = totalImpostosVendas + filteredFinancialRecords
    .filter(f => f.category === 'Impostos')
    .reduce((acc, f) => acc + f.amount, 0);

  // Saldo Bancário Liquido Base + reconciliations
  const totalReceitasPagas = filteredFinancialRecords
    .filter(f => f.type === 'receita' && f.status === 'Pago')
    .reduce((acc, f) => acc + f.amount, 0);
  const totalDespesasPagas = filteredFinancialRecords
    .filter(f => f.type === 'despesa' && f.status === 'Pago')
    .reduce((acc, f) => acc + f.amount, 0);
  const bankBalance = totalReceitasPagas - totalDespesasPagas;

  // Caixa Físico Base + cash terms fraction
  const totalVendasVista = filteredOrders
    .filter(o => o.paymentTerm === 'Vista')
    .reduce((acc, o) => acc + o.total, 0);
  const physicalCashVal = totalVendasVista * 0.12;

  // Valor em Estoque
  const valorEstoque = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);

  // Ativos Consignados (bens sob comodato)
  const ativosConsignados = clients.length * 8500;

  // Ticket Médio
  const ticketMedioVal = totalVendas > 0 ? totalFaturamento / totalVendas : 0;
  


  // Reorganizing Metric cards exactly as requested by context
  const financeiroMetrics = [
    {
      id: 'faturamento',
      label: 'Receita (Faturamento)',
      value: totalFaturamento,
      prior: 0.00,
      icon: DollarSign,
      tooltip: 'Faturamento bruto acumulado das notas mercantis autorizadas pelo fisco.',
      isIncreaseGood: true,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-[#1E94CF]',
      bgGlow: 'hover:border-[#1E94CF]/40'
    },
    {
      id: 'lucro',
      label: 'Lucro Líquido',
      value: calculatedLucroVal,
      prior: 0.00,
      icon: TrendingUp,
      tooltip: 'Margem superavitária após as deduções de custo de aquisição e tributação mercantil.',
      isIncreaseGood: true,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-[#8BC039]',
      bgGlow: 'hover:border-[#8BC039]/40'
    },
    {
      id: 'caixaFisico',
      label: 'Caixa Físico',
      value: physicalCashVal,
      prior: 0.00,
      icon: Wallet,
      tooltip: 'Soma física mantida em cofre estratégico central para micro despesas urgentes.',
      isIncreaseGood: true,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-emerald-400',
      bgGlow: 'hover:border-emerald-500/40'
    },
    {
      id: 'saldoBancario',
      label: 'Saldo Bancário',
      value: bankBalance,
      prior: 0.00,
      icon: Landmark,
      tooltip: 'Aporte de liquidez disponível para saque e custeio das operações correntes.',
      isIncreaseGood: true,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-[#1E94CF]',
      bgGlow: 'hover:border-[#1E94CF]/40'
    },
    {
      id: 'fluxoCaixaReal',
      label: 'Fluxo de Caixa Operacional',
      value: totalReceitasPagas - totalDespesasPagas,
      prior: 0.00,
      icon: Activity,
      tooltip: 'Entradas líquidas acumuladas menos as Saídas registradas no período selecionado.',
      isIncreaseGood: (totalReceitasPagas - totalDespesasPagas) >= 0,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: (totalReceitasPagas - totalDespesasPagas) >= 0 ? 'text-[#8BC039]' : 'text-rose-500',
      bgGlow: (totalReceitasPagas - totalDespesasPagas) >= 0 ? 'hover:border-[#8BC039]/40' : 'hover:border-rose-500/40'
    },
  ];

  const comercialMetrics = [
    {
      id: 'vendas',
      label: 'Vendas Ativas',
      value: totalVendas,
      prior: 0,
      icon: ShoppingCart,
      tooltip: 'Volume absoluto de faturamento de pedidos processados no ciclo operacional.',
      isIncreaseGood: true,
      format: (v: number) => `${v} un`,
      color: 'text-indigo-400',
      bgGlow: 'hover:border-indigo-500/40'
    },
    {
      id: 'ticketMedio',
      label: 'Ticket Médio',
      value: ticketMedioVal,
      prior: 0.00,
      icon: Percent,
      tooltip: 'Faturamento bruto por emissão mercantil média realizada no período corporativo.',
      isIncreaseGood: true,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-sky-400',
      bgGlow: 'hover:border-sky-500/40'
    },
    {
      id: 'comissaoAPagar',
      label: 'Comissão a Pagar',
      value: comissaoAPagar,
      prior: 0.00,
      icon: Coins,
      tooltip: 'Soma total de comissões calculadas pendentes de quitação.',
      isIncreaseGood: false,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-amber-500',
      bgGlow: 'hover:border-amber-500/40'
    },
    {
      id: 'comissaoPaga',
      label: 'Comissão Paga',
      value: comissaoPaga,
      prior: 0.00,
      icon: Coins,
      tooltip: 'Soma total de comissões integralizadas já pagas aos vendedores.',
      isIncreaseGood: true,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-rose-500',
      bgGlow: 'hover:border-rose-500/40'
    },
    {
      id: 'clientes',
      label: 'Clientes Ativos',
      value: clients.length,
      prior: 0,
      icon: UserCheck,
      tooltip: 'Contas jurídicas catalogadas no CRM com relacionamento comercial ativo.',
      isIncreaseGood: true,
      format: (v: number) => `${v} contas`,
      color: 'text-teal-400',
      bgGlow: 'hover:border-teal-500/40'
    },
  ];

  const operacaoMetrics = [
    {
      id: 'estoque',
      label: 'Estoque Balanço',
      value: valorEstoque,
      prior: 0.00,
      icon: Boxes,
      tooltip: 'Patrimônio físico avaliado a preço de custo estocado nas gôndolas e armários.',
      isIncreaseGood: true,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      color: 'text-slate-400',
      bgGlow: 'hover:border-slate-500/40'
    },
    {
      id: 'consignados',
      label: 'Ativos Consignados',
      value: ativosConsignados,
      prior: 0.00,
      icon: Briefcase,
      tooltip: 'Comodatos de infraestrutura cedidos aos nossos varejistas de alto nível.',
      isIncreaseGood: true,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      color: 'text-[#1E94CF]',
      bgGlow: 'hover:border-[#1E94CF]/40'
    },
    {
      id: 'pedidos',
      label: 'Pedidos Pendentes',
      value: orders.filter(o => o.status !== 'Entregue').length,
      prior: 0,
      icon: Activity,
      tooltip: 'Número de requisições de compra mercantil atualmente correndo no lote logístico.',
      isIncreaseGood: false,
      format: (v: number) => `${v} pendentes`,
      color: 'text-rose-400',
      bgGlow: 'hover:border-rose-500/40'
    },
    {
      id: 'impostos',
      label: 'Impostos',
      value: totalImpostos,
      prior: 0.00,
      icon: Receipt,
      tooltip: 'Provisões tributárias ativas (ICMS, PIS, COFINS, etc.) retidas em caixa social.',
      isIncreaseGood: false,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-amber-500',
      bgGlow: 'hover:border-amber-500/40'
    },
  ];

  // Dynamic calculation for the AI Insights Panel (Premium Executive Hub)
  const highestOrderValue = filteredOrders.length > 0 ? Math.max(...filteredOrders.map(o => o.total)) : 4850;
  const highestOrder = filteredOrders.find(o => o.total === highestOrderValue);
  const topClientNameStr = highestOrder ? highestOrder.clientName : (clients[0]?.name || "Nenhum Comitente");

  const productQuantities: { [key: string]: number } = {};
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      productQuantities[item.productId] = (productQuantities[item.productId] || 0) + item.quantity;
    });
  });
  let bestSellingProductId = '';
  let bestSellingQuantity = 0;
  Object.entries(productQuantities).forEach(([id, q]) => {
    if (q > bestSellingQuantity) {
      bestSellingQuantity = q;
      bestSellingProductId = id;
    }
  });
  const bestSellingProduct = products.find(p => p.id === bestSellingProductId)?.name || 'Café Bourbon Speciale';

  const financialTrendStr = calculatedLucroVal > 10000 
    ? 'Alta Exponencial (+18.4% MoM)' 
    : 'Consolidação de Lucro e Alta de Giro';

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
    // Only query from current filtered subsets or overall active list
    const groupOrders = orders.filter(o => {
      const diff = getDaysDiffForChart(o.date);
      return diff >= minDiff && (maxDiff === 999 ? true : diff <= maxDiff);
    });

    const groupFinancials = financialRecords.filter(f => {
      const diff = getDaysDiffForChart(f.dueDate);
      return diff >= minDiff && (maxDiff === 999 ? true : diff <= maxDiff);
    });

    const entradas = groupOrders.reduce((acc, o) => acc + o.total, 0);
    const saidas = groupFinancials.filter(f => f.type === 'despesa').reduce((acc, f) => acc + f.amount, 0);

    const costInsumos = groupOrders.reduce((acc, o) => acc + o.items.reduce((sum, it) => {
      const p = products.find(prod => prod.id === it.productId);
      return sum + (p ? p.costPrice * it.quantity : 0);
    }, 0), 0);
    const taxes = groupOrders.reduce((acc, o) => acc + o.taxes.total, 0);

    const comissoes = Math.round(entradas * 0.05);
    const lucro = entradas - costInsumos - taxes - comissoes;

    const activeClientIds = Array.from(new Set(groupOrders.map(o => o.clientId)));
    const clientes = activeClientIds.length;

    return { 
      entradas, 
      saidas, 
      clientes, 
      comissoes, 
      lucro: Math.max(0, lucro) 
    };
  };

  const chartPoints = [
    { day: 'D-12', ...getGroupStats(11, 12) },
    { day: 'D-10', ...getGroupStats(9, 10) },
    { day: 'D-08', ...getGroupStats(7, 8) },
    { day: 'D-06', ...getGroupStats(5, 6) },
    { day: 'D-04', ...getGroupStats(3, 4) },
    { day: 'D-02', ...getGroupStats(1, 2) },
    { day: 'Hoje', entradas: totalFaturamento, saidas: totalSaidasLedger, clientes: clients.length, comissoes: totalComissoesCount, lucro: calculatedLucroVal }
  ];

  // Dynamic limits definition to scale SVG lines proportionally
  const financeSeries = [
    ...chartPoints.map(p => p.entradas),
    ...chartPoints.map(p => p.saidas),
    ...chartPoints.map(p => p.comissoes),
    ...chartPoints.map(p => p.lucro)
  ];
  const maxFinanceVal = Math.max(...financeSeries, 1000);
  const maxClientesVal = Math.max(...chartPoints.map(p => p.clientes), 2);

  // Helper coordinate getters
  const mapYCoordinate = (val: number, isClientesMetric: boolean) => {
    let scaleFactorMax = isClientesMetric ? maxClientesVal : maxFinanceVal;
    if (isZoomed) {
      scaleFactorMax = scaleFactorMax * 0.6;
    }
    return 230 - (val * (230 - 25) / scaleFactorMax);
  };

  const DESKTOP_CHART_HEIGHT = 290;
  const mapDesktopY = (val: number, isClientesMetric: boolean) => {
    let scaleFactorMax = isClientesMetric ? maxClientesVal : maxFinanceVal;
    if (isZoomed) {
      scaleFactorMax = scaleFactorMax * 0.6;
    }
    return DESKTOP_CHART_HEIGHT - (val * (DESKTOP_CHART_HEIGHT - 30) / scaleFactorMax);
  };

  const mapXCoordinate = (index: number) => {
    return 55 + (index * (745 - 55) / (chartPoints.length - 1));
  };

  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  // Staggered logger simulation phrases
  const simulationLogs = [
    'Sincronizando faturamento de vendas no razão fiscal...',
    'Varrendo integridade das gôndolas físicas do CD...',
    'Apurando créditos em risco e conformidade tributária...',
    'Alinhando projeções preditivas com o modelo neural...',
    'Pronto! Arquitetura de Inteligência restaurada.'
  ];

  useEffect(() => {
    if (loadingInsights) {
      const timer = setInterval(() => {
        if (currentLogIndex < simulationLogs.length - 1) {
          setCurrentLogIndex(prev => prev + 1);
        }
      }, 750);
      return () => clearInterval(timer);
    } else {
      setCurrentLogIndex(0);
    }
  }, [loadingInsights, currentLogIndex]);

  // Request real or high-fidelity simulated insights from server
  const generateAIAdvisory = async () => {
    setLoadingInsights(true);
    setInsightReport('');
    setSuggestedCards([]);
    setCurrentLogIndex(0);
    
    try {
      const accessToken = await getCurrentAccessToken();
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ products, clients, orders, financialRecords }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error('O servidor retornou uma resposta em formato inválido (não-JSON).');
      }
      
      if (data && data.success) {
        setInsightReport(data.reportText);
        setSuggestedCards(data.suggestedCards);
        setAiMethod(data.method);
      } else {
        setInsightReport(`## ❌ Instabilidade Temporária\n\n${data?.error || 'Não foi possível obter respostas do oráculo executivo neste momento.'}`);
      }
    } catch (err: any) {
      console.error(err);
      setInsightReport(`## ⚠️ Falha na Comunicação\n\n${err?.message || 'Erro de rede local ao conectar-se à inteligência do ERP.'}`);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Run automatically when inputs, period, or custom filters update
  useEffect(() => {
    generateAIAdvisory();
  }, [products, clients, orders, financialRecords, selectedPeriod, customStartDate, customEndDate]);

  // Calculations for static intelligence section (copilot-like)
  const lowStockSKUs = products.filter(p => p.stock <= p.minStock);
  const stagnantProducts = products.map(prod => {
    const totalSold = filteredOrders.reduce((sum, order) => {
      const item = order.items.find(it => it.productId === prod.id);
      return sum + (item ? item.quantity : 0);
    }, 0);
    return {
      product: prod,
      dormantCapital: prod.stock * prod.costPrice,
    };
  }).filter(item => item.product.stock > 0 && filteredOrders.every(o => !o.items.some(it => it.productId === item.product.id)));

  const totalDormantCapital = stagnantProducts.reduce((sum, s) => sum + s.dormantCapital, 0);

  const riskClients = clients.filter(c => c.riskClass === 'C' || c.riskClass === 'D');
  const mostProfitableProducts = [...products]
    .sort((a, b) => (b.sellingPrice - a.costPrice) - (a.sellingPrice - a.costPrice))
    .slice(0, 3);

  const topRentableCustomers = [...clients]
    .sort((a,b) => b.totalSpent - a.totalSpent)
    .slice(0, 3);

  const forecastNextMonth = totalFaturamento * 1.18;

  const renderCard = (item: any) => {
    const IconComp = item.icon;
    const pctChange = item.prior === 0 ? 0 : ((item.value - item.prior) / item.prior) * 100;
    const isGrowth = pctChange >= 0;
    
    let isPositiveResult = isGrowth;
    if (!item.isIncreaseGood) {
      isPositiveResult = !isGrowth; 
    }

    const cardClass = isDark
      ? `glass-dark p-5 rounded-2xl relative transition-all duration-300 group hover:shadow-lg hover:shadow-black/50 border border-slate-800/80 hover:scale-[1.02] ${item.bgGlow}`
      : `glass-light p-5 rounded-2xl relative transition-all duration-300 group hover:shadow-md hover:scale-[1.02] ${item.bgGlow}`;

    return (
      <div
        key={item.id}
        id={`kpi-card-${item.id}`}
        className={cardClass}
        onMouseEnter={() => setHoveredCardId(item.id)}
        onMouseLeave={() => setHoveredCardId(null)}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {item.label}
            </span>
            <h3 className={`text-xl font-black tracking-tight mt-1 truncate ${
              isDark ? 'text-white' : 'text-[#1F3767]'
            }`}>
              {item.format(item.value)}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-slate-800' : 'bg-[#1F3767]/5'
            } ${item.color}`}>
              <IconComp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Growth comparison pill */}
        <div className="flex items-center space-x-1.5 mt-3.5 text-[10px]">
          {item.prior !== 0 && (
            <span className={`font-bold flex items-center px-1.5 py-0.5 rounded-md ${
              isPositiveResult 
                ? 'bg-emerald-500/10 text-[#8BC039]' 
                : 'bg-rose-500/10 text-rose-500'
            }`}>
              {isGrowth ? (
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(pctChange).toFixed(1)}%
            </span>
          )}
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
            {item.prior === 0 ? 'Sem histórico de período anterior' : `anterior (${item.format(item.prior)})`}
          </span>
        </div>

        {/* Tooltip Hover Popover */}
        {hoveredCardId === item.id && (
          <div className={`absolute z-40 bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 p-3.5 border rounded-xl shadow-xl leading-relaxed text-[11px] font-medium text-center select-none pointer-events-none transition-all duration-200 animate-zoom-in ${
            isDark 
              ? 'bg-slate-950 border-slate-800 text-slate-200 shadow-black/80' 
              : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
          }`}>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
              isDark ? 'border-t-slate-950' : 'border-t-white'
            }`} />
            <p className="font-extrabold text-[#1E94CF] border-b border-slate-200/5 pb-1 mb-1">{item.label}</p>
            <p className="leading-normal">{item.tooltip}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="vertice-dashboard-bi" className="space-y-6 md:space-y-8 animate-fade-in pb-12">
      
      {/* MOBILE EXCLUSIVE LAYOUT */}
      <DashboardBIMobile 
        products={products}
        clients={clients}
        orders={orders}
        financialRecords={financialRecords}
        onSettleTransaction={onSettleTransaction}
        isDark={isDark}
        totalFaturamento={totalFaturamento}
        calculatedLucroVal={calculatedLucroVal}
        bankBalance={bankBalance}
        physicalCashVal={physicalCashVal}
        valorEstoque={valorEstoque}
        totalComissoesCount={totalComissoesCount}
        forecastNextMonth={forecastNextMonth}
        lowStockSKUs={lowStockSKUs}
        riskClients={riskClients}
        loadingInsights={loadingInsights}
        insightReport={insightReport}
        generateAIAdvisory={generateAIAdvisory}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
      />

      {/* DESKTOP LAYOUT (Approved, totally untouched visually) */}
      <div className="hidden lg:block space-y-8">
        {/* 1. Dynamic Greeting Header Section */}
      <div 
        id="dashboard-header" 
        className={`p-6 md:p-8 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-300 ${
          isDark 
            ? 'glass-dark border-slate-800/80 shadow-lg shadow-black/20' 
            : 'glass-light border-slate-100 shadow-sm'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xl md:text-2xl">👋</span>
            <h2 className={`text-xl md:text-3xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-[#1F3767]'
            }`}>
              Olá, Edilson Mesquita
            </h2>
          </div>
          <div className="space-y-1 pl-1">
            <p className={`text-sm font-semibold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-[#1F3767]/80'}`}>
              Sua operação faturou <strong className="text-[#1E94CF]">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> no período selecionado.
              <span className="text-[#8BC039] font-extrabold flex items-center ml-1 text-xs">
                <ArrowUpRight className="h-4 w-4" /> 0% acima do período anterior
              </span>
            </p>
            <p className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-500 animate-glow"></span>
              🤖 insights estratégicos gerados pela IA executiva em tempo real.
            </p>
          </div>
        </div>
        
        {/* Sync Controls (Universal Period Filter) */}
        <div className="flex items-center space-x-3 shrink-0 self-start md:self-center">
          {selectedPeriod === 'Personalizado' && (
            <div className="flex items-center gap-2 animate-zoom-in">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-brand-light ${
                  isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-700'
                }`}
                title="Data Inicial"
              />
              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>à</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-brand-light ${
                  isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-700'
                }`}
                title="Data Final"
              />
            </div>
          )}

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-1 focus:ring-brand-light cursor-pointer shadow-xs ${
              isDark 
                ? 'bg-slate-900 border border-slate-800 text-white' 
                : 'bg-white border border-slate-200 text-[#1F3767]'
            }`}
          >
            <option value="Hoje">Hoje</option>
            <option value="Últimos 7 dias">Últimos 7 dias</option>
            <option value="Últimos 15 dias">Últimos 15 dias</option>
            <option value="Últimos 30 dias">Últimos 30 dias</option>
            <option value="Este mês">Este mês</option>
            <option value="Últimos 3 meses">Últimos 3 meses</option>
            <option value="Este ano">Este ano</option>
            <option value="Personalizado">Período Personalizado...</option>
            <option value="Todos">Todo o Histórico</option>
          </select>

          <button
            id="refresh-bi-button"
            onClick={generateAIAdvisory}
            disabled={loadingInsights}
            className="flex items-center space-x-1.5 bg-[#1F3767] hover:bg-[#1E94CF] dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50 cursor-pointer transition-all border dark:border-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
            <span>Atualizar Painel</span>
          </button>

          <button
            id="download-exec-report-button"
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-[#1E94CF] to-[#8BC039] hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer border-none"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Baixar Relatório Executivo</span>
          </button>
        </div>
      </div>

      {/* 2. CFO VIRTUAL PREMIUM BANNER FIXED AT TOP */}
      <div 
        id="cfo-virtual-top-banner"
        className={`p-6 rounded-3xl relative overflow-hidden border transition-all duration-300 animate-glow ${
          isDark 
            ? 'glass-dark bg-gradient-to-br from-[#0F172A] via-slate-900/60 to-purple-950/20 border-purple-500/20' 
            : 'glass-light bg-gradient-to-br from-white via-indigo-50/20 to-cyan-50/10 border-[#1E94CF]/20 shadow-md'
        }`}
      >
        {/* Glow effect vectors */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 z-0"></div>
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-gradient-to-tr from-brand-green/5 to-transparent rounded-full blur-2xl pointer-events-none z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-md text-white animate-pulse">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-2 py-0.5 rounded-md">
                  Executive Advisory
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-green"></span>
                </span>
              </div>
              <h3 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                🤖 CFO VIRTUAL ORÁCULO
              </h3>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Diagnóstico preditivo em tempo real integrado às obrigações acessórias corporativas.
              </p>
            </div>
          </div>
          
          <div className="text-right shrink-0">
            <p className={`text-xs font-bold leading-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>RUN-RATE PROJETADO</p>
            <p className="text-xl md:text-2xl font-black tracking-tight text-white-shimmer text-shimmer">
              R$ {forecastNextMonth.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[9px] font-bold text-[#8BC039]">+18% vs período anterior</span>
          </div>
        </div>

        {/* Dynamic CFO Grid Bulletpoints */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-200/10 relative z-10">
          
          {/* Bullet 1: Alertas */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3.5 transition-all duration-300 hover:scale-[1.01] ${
            isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white/40 border-slate-100'
          }`}>
            <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-500 shrink-0">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-[#1F3767]'}`}>Alertas Financeiros & Riscos</h5>
              <p className={`text-[11px] leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                {lowStockSKUs.length > 0 
                  ? `Existem ${lowStockSKUs.length} SKUs com ameaça eminente de ruptura no CD.` 
                  : 'Nenhum risco de fluxo de caixa ou quebra operacional detectado hoje.'}
              </p>
            </div>
          </div>

          {/* Bullet 2: Capital estagnado */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3.5 transition-all duration-300 hover:scale-[1.01] ${
            isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white/40 border-slate-100'
          }`}>
            <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-500 shrink-0">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-[#1F3767]'}`}>Capital Ocioso em Gôndola</h5>
              <p className={`text-[11px] leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                {stagnantProducts.length > 0 
                  ? `Detectamos R$ ${totalDormantCapital.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} parados em ${stagnantProducts.length} itens sem giro.` 
                  : 'Eficiência de sortimento maximizada: estoque girando conforme orçamentos.'}
              </p>
            </div>
          </div>

          {/* Bullet 3: Clientes em Risco */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3.5 transition-all duration-300 hover:scale-[1.01] ${
            isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white/40 border-slate-100'
          }`}>
            <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400 shrink-0">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-[#1F3767]'}`}>Inadimplência & Contas Alvo</h5>
              <p className={`text-[11px] leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                {riskClients.length > 0 
                  ? `Existem ${riskClients.length} varejistas em Risco C/D com débito pendente.` 
                  : 'Limites de crédito e liquidação correndo com 100% de estabilidade.'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. THREE STRUCTURED METRICS SECTIONS */}
      
      {/* SECTION 1 — FINANCEIRO */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-200/15 pb-2">
          <DollarSign className="h-4 w-4 text-[#1E94CF]" />
          <h4 className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-[#1F3767]'}`}>
            SEÇÃO 1 — FINANCEIRO
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financeiroMetrics.map(renderCard)}
        </div>
      </div>

      {/* SECTION 2 — COMERCIAL */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-200/15 pb-2">
          <ShoppingCart className="h-4 w-4 text-emerald-500" />
          <h4 className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-[#1F3767]'}`}>
            SEÇÃO 2 — COMERCIAL
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comercialMetrics.map(renderCard)}
        </div>
      </div>

      {/* SECTION 3 — OPERAÇÃO */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-200/15 pb-2">
          <Boxes className="h-4 w-4 text-purple-400" />
          <h4 className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-[#1F3767]'}`}>
            SEÇÃO 3 — OPERAÇÃO
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {operacaoMetrics.map(renderCard)}
        </div>
      </div>

      {/* 4. EXECUTIVE HUB & AI INSIGHTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
        
        {/* Left Column: Chart Area (lg:col-span-9) */}
        <div 
          id="executive-panel-chart"
          className={`lg:col-span-9 p-6 md:p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
            isDark ? 'glass-dark border-slate-800' : 'glass-light border-slate-150/70 shadow-lg shadow-slate-100/10'
          }`}
        >
          {/* Chart Title, Subtitle and toggles */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/5 pb-6 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-cyan-400 to-indigo-500"></span>
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Executive Hub • Business Intelligence
                </span>
              </div>
              <h3 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                Fluxo Vetorial de Performance
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Demonstrativo financeiro multivariado integrado ao oráculo preditivo.
              </p>
            </div>
            
            {/* Legend Toggles inside pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'entradas', label: 'Receita', color: 'border-[#1E94CF] text-[#1E94CF] bg-[#1E94CF]/5' },
                { key: 'lucro', label: 'Lucro Líquido', color: 'border-[#8BC039] text-[#8BC039] bg-[#8BC039]/5' },
                { key: 'saidas', label: 'Saídas', color: 'border-rose-500 text-rose-500 bg-rose-500/5' },
                { key: 'clientes', label: 'Clientes', color: 'border-amber-500 text-amber-500 bg-amber-500/5' }
              ].map((axis) => {
                const active = visibleLines[axis.key as keyof typeof visibleLines];
                return (
                  <button
                    key={axis.key}
                    onClick={() => setVisibleLines(prev => ({ ...prev, [axis.key]: !active }))}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer ${
                      active 
                        ? axis.color 
                        : isDark 
                          ? 'border-slate-800 text-slate-500 bg-slate-900/30' 
                          : 'border-slate-200 text-slate-400 bg-slate-50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-current' : 'bg-slate-400'}`} />
                    <span>{axis.label}</span>
                  </button>
                );
              })}

              {/* Interactive Zoom Button */}
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer ${
                  isZoomed 
                    ? 'border-purple-500 text-purple-400 bg-purple-500/10' 
                    : isDark 
                      ? 'border-slate-800 text-slate-400 bg-slate-900/30' 
                      : 'border-slate-200 text-slate-500 bg-slate-50'
                }`}
                title="Ampliar flutuações das curvas do gráfico"
              >
                <span>{isZoomed ? 'Zoom: Ativo (1.6x) 🔍' : 'Zoom: Inativo (1.0x) 🔎'}</span>
              </button>
            </div>
          </div>

          {/* Elegant KPI block ABOVE the Chart */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { 
                label: 'Receita', 
                value: totalFaturamento, 
                growth: '0%', 
                color: '#1E94CF', 
                key: 'entradas',
                format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
              },
              { 
                label: 'Lucro Líquido', 
                value: calculatedLucroVal, 
                growth: '+15.4%', 
                color: '#8BC039', 
                key: 'lucro',
                format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
              },
              { 
                label: 'Saídas', 
                value: totalSaidasLedger, 
                growth: '-4.8%', 
                color: '#EF4444', 
                key: 'saidas',
                format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
              },
              { 
                label: 'Clientes Ativos', 
                value: clients.length, 
                growth: '+12.0%', 
                color: '#F59E0B', 
                key: 'clientes',
                format: (v: number) => `${v} ativos`
              }
            ].map((kpi) => {
              const active = visibleLines[kpi.key as keyof typeof visibleLines];
              return (
                <div 
                  key={kpi.label}
                  onClick={() => setVisibleLines(prev => ({ ...prev, [kpi.key]: !active }))}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none relative overflow-hidden group ${
                    active 
                      ? isDark 
                        ? 'bg-slate-900/40 border-slate-700/80 shadow-md' 
                        : 'bg-white border-slate-200/80 shadow-sm'
                      : 'opacity-50 border-transparent hover:opacity-70 bg-slate-500/2'
                  }`}
                >
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all group-hover:w-1.5" 
                    style={{ backgroundColor: kpi.color }}
                  />
                  
                  <p className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {kpi.label}
                  </p>
                  
                  <div className="flex items-baseline justify-between gap-1 mt-1.5">
                    <span className={`text-base md:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                      {kpi.format(kpi.value)}
                    </span>
                    <span className={`text-[10px] font-extrabold ${
                      kpi.growth.startsWith('+') ? 'text-[#8BC039]' : 'text-rose-500'
                    }`}>
                      {kpi.growth}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Area Chart with Monotone Bezier curves */}
          <div className="w-full relative py-2" style={{ height: '340px' }}>
            <svg id="desktop-premium-chart" viewBox="0 0 800 340" className="w-full h-full relative z-10 overflow-visible">
              <defs>
                <linearGradient id="gradient-entradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E94CF" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#1E94CF" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="gradient-lucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8BC039" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#8BC039" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="gradient-saidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.16"/>
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="gradient-clientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.12"/>
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
                </linearGradient>
              </defs>

              {/* Subdued scale grid lines */}
              {[35, 123, 211, 290].map((yVal, idx) => (
                <line
                  key={idx}
                  x1={55}
                  y1={yVal}
                  x2={745}
                  y2={yVal}
                  stroke={isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(31, 55, 103, 0.03)"}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}

              {/* X Axis labels */}
              {chartPoints.map((p, idx) => (
                <text 
                  key={idx} 
                  x={mapXCoordinate(idx)} 
                  y={320} 
                  fill={isDark ? "#475569" : "#94a3b8"} 
                  fontSize={9} 
                  textAnchor="middle" 
                  className="font-bold cursor-default select-none"
                >
                  {p.day}
                </text>
              ))}

              {/* Render smooth Area Curve - RECEITA */}
              {visibleLines.entradas && (() => {
                const coords = chartPoints.map((p, i) => ({ x: mapXCoordinate(i), y: mapDesktopY(p.entradas, false) }));
                const linePath = getBezierPath(coords);
                return (
                  <g>
                    <path d={linePath} stroke="#1E94CF" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
                  </g>
                );
              })()}

              {/* Render smooth Area Curve - LUCRO */}
              {visibleLines.lucro && (() => {
                const coords = chartPoints.map((p, i) => ({ x: mapXCoordinate(i), y: mapDesktopY(p.lucro, false) }));
                const linePath = getBezierPath(coords);
                return (
                  <g>
                    <path d={linePath} stroke="#8BC039" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
                  </g>
                );
              })()}

              {/* Render smooth Area Curve - SAIDAS */}
              {visibleLines.saidas && (() => {
                const coords = chartPoints.map((p, i) => ({ x: mapXCoordinate(i), y: mapDesktopY(p.saidas, false) }));
                const linePath = getBezierPath(coords);
                return (
                  <g>
                    <path d={linePath} stroke="#EF4444" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
                  </g>
                );
               })()}

              {/* Render smooth Area Curve - CLIENTES */}
              {visibleLines.clientes && (() => {
                const coords = chartPoints.map((p, i) => ({ x: mapXCoordinate(i), y: mapDesktopY(p.clientes, true) }));
                const linePath = getBezierPath(coords);
                return (
                  <g>
                    <path d={linePath} stroke="#F59E0B" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
                  </g>
                );
              })()}

              {/* Guide and dots interactive hovering trigger */}
              {hoveredIndex !== null && (() => {
                const hoverX = mapXCoordinate(hoveredIndex);
                const activePoint = chartPoints[hoveredIndex];
                const tooltipX = hoveredIndex > 3 ? hoverX - 220 : hoverX + 20;

                return (
                  <g>
                    {/* Vertical Guide Line */}
                    <line
                      x1={hoverX}
                      y1={20}
                      x2={hoverX}
                      y2={290}
                      stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(31, 55, 103, 0.12)"}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      className="pointer-events-none"
                    />

                    {/* Hover Circles on curves */}
                    {visibleLines.entradas && (
                      <circle cx={hoverX} cy={mapDesktopY(activePoint.entradas, false)} r={5} fill="#1E94CF" stroke={isDark ? "#0F172A" : "#FFFFFF"} strokeWidth={2} />
                    )}
                    {visibleLines.lucro && (
                      <circle cx={hoverX} cy={mapDesktopY(activePoint.lucro, false)} r={5} fill="#8BC039" stroke={isDark ? "#0F172A" : "#FFFFFF"} strokeWidth={2} />
                    )}
                    {visibleLines.saidas && (
                      <circle cx={hoverX} cy={mapDesktopY(activePoint.saidas, false)} r={5} fill="#EF4444" stroke={isDark ? "#0F172A" : "#FFFFFF"} strokeWidth={2} />
                    )}
                    {visibleLines.clientes && (
                      <circle cx={hoverX} cy={mapDesktopY(activePoint.clientes, true)} r={5} fill="#F59E0B" stroke={isDark ? "#0F172A" : "#FFFFFF"} strokeWidth={2} />
                    )}

                    {/* Glassmorphism Premium Tooltip */}
                    <foreignObject x={tooltipX} y={20} width={200} height={210} className="overflow-visible pointer-events-none z-50 transition-all duration-150">
                      <div className={`p-4 rounded-xl border backdrop-blur-md shadow-xl text-[11px] font-semibold space-y-2.5 transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-950/85 border-slate-800 text-slate-300 shadow-black/40' 
                          : 'bg-white/90 border-slate-200/80 text-slate-700 shadow-slate-200/40'
                      }`}>
                        <p className={`text-xs font-black border-b pb-1.5 ${isDark ? 'border-indent-950/40 text-white' : 'border-slate-100 text-[#1F3767]'}`}>
                          🗓️ Período: {activePoint.day}
                        </p>
                        <div className="space-y-1.5">
                          {visibleLines.entradas && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1E94CF]" />Receita</span>
                              <span className="font-extrabold font-mono text-xs text-[#1E94CF]">R$ {activePoint.entradas.toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          {visibleLines.lucro && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#8BC039]" />Lucro</span>
                              <span className="font-extrabold font-mono text-xs text-[#8BC039]">R$ {activePoint.lucro.toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          {visibleLines.saidas && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Saídas</span>
                              <span className="font-extrabold font-mono text-xs text-rose-500">R$ {activePoint.saidas.toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          {visibleLines.clientes && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />Clientes</span>
                              <span className="font-extrabold font-mono text-xs text-[#F59E0B]">{activePoint.clientes} ativos</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })()}

              {/* Wide Rect blocks overlays to lock mouse hover comfortably */}
              {chartPoints.map((p, idx) => {
                const x = mapXCoordinate(idx);
                const width = 800 / chartPoints.length;
                return (
                  <rect
                    key={idx}
                    x={x - width / 2}
                    y={10}
                    width={width}
                    height={310}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Column: Executive Intelligence Center (lg:col-span-3) - Stripe & Linear Inspired */}
        <div 
          id="ai-insights-panel"
          className={`lg:col-span-3 p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between h-full ${
            isDark 
              ? 'glass-dark bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-800 shadow-lg shadow-black/25' 
              : 'glass-light bg-gradient-to-b from-[#FAFAFA] via-white to-slate-50/50 border-slate-150/70 shadow-md shadow-slate-100/10'
          }`}
        >
          <div className="space-y-4">
            {/* Panel Header */}
            <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#1E94CF] to-purple-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                    Executive Intelligence
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Métricas e Alertas BI</p>
                </div>
              </div>
            </div>

            {/* List Body with sleek Linear/Stripe inspired rows */}
            <div className="space-y-3">
              {[
                {
                  id: 'major_rev',
                  label: 'Vetor de Faturamento',
                  valStr: `R$ ${highestOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                  subText: `Comitente: ${topClientNameStr}`,
                  priority: 'Alta',
                  priorityColor: 'text-[#1E94CF] bg-[#1E94CF]/10',
                  status: 'Auditado',
                  statusColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                  icon: DollarSign,
                  iconColor: 'text-[#1E94CF]',
                  tooltip: 'Maior faturamento operacional unitário processado no período selecionado. Indica o limite do ticket transacional.'
                },
                {
                  id: 'best_sku',
                  label: 'Giro de Sortimento',
                  valStr: bestSellingProduct,
                  subText: 'Giro volumétrico líder',
                  priority: 'Crítica',
                  priorityColor: 'text-rose-500 bg-rose-500/10',
                  status: 'Estável',
                  statusColor: 'text-green-500 bg-green-500/10 border-green-500/20',
                  icon: Boxes,
                  iconColor: 'text-[#8BC039]',
                  tooltip: 'Código de SKU líder de saída do centro de distribuição. Monitorado continuamente para repor lotes.'
                },
                {
                  id: 'best_client',
                  label: 'Comitente Líder',
                  valStr: topClientNameStr,
                  subText: 'Volume financeiro consolidado',
                  priority: 'Alta',
                  priorityColor: 'text-indigo-400 bg-indigo-400/10',
                  status: 'Parceiro',
                  statusColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
                  icon: UserCheck,
                  iconColor: 'text-indigo-400',
                  tooltip: 'Parceiro com maior faturamento consolidado acumulado. Reflete escala e menor risco de liquidez.'
                },
                {
                  id: 'trend_dir',
                  label: 'Vetor de Margem',
                  valStr: financialTrendStr,
                  subText: 'Comportamento pós deduções',
                  priority: 'Foco',
                  priorityColor: 'text-amber-500 bg-amber-500/10',
                  status: 'Projetado',
                  statusColor: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
                  icon: TrendingUp,
                  iconColor: 'text-purple-400',
                  tooltip: 'Indicador de tendência da margem líquida líquida pós-tributação sobre o mix de café trading vendido.'
                },
                {
                  id: 'forecast_val',
                  label: 'Projeção de Giro',
                  valStr: `R$ ${forecastNextMonth.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
                  subText: 'Estimativa Run-rate 30d',
                  priority: 'Foco',
                  priorityColor: 'text-purple-500 bg-purple-500/10',
                  status: 'Modelado',
                  statusColor: 'text-[#8BC039] bg-[#8BC039]/10 border-[#8BC039]/20',
                  icon: Calendar,
                  iconColor: 'text-[#8BC039]',
                  tooltip: 'Run-rate preditivo projetado sob regressão estatística ajustada para os próximos trinta dias.'
                }
              ].map((row) => {
                const isHovered = hoveredInsightId === row.id;
                return (
                  <div
                    key={row.id}
                    className={`p-3.5 rounded-xl border relative transition-all duration-300 hover:scale-[1.01] cursor-help ${
                      isDark 
                        ? 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800' 
                        : 'bg-white hover:bg-slate-50/80 border-slate-150 shadow-xs'
                    }`}
                    onMouseEnter={() => setHoveredInsightId(row.id)}
                    onMouseLeave={() => setHoveredInsightId(null)}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <row.icon className={`h-3.5 w-3.5 shrink-0 ${row.iconColor}`} />
                        <span className={`text-[9px] font-black uppercase tracking-wider truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {row.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${row.priorityColor}`}>
                          {row.priority}
                        </span>
                        <span className={`px-1 py-0.5 rounded border text-[7px] font-black uppercase ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <p className={`text-[13px] font-black truncate tracking-tight ${isDark ? 'text-slate-100' : 'text-[#1F3767]'}`}>
                        {row.valStr}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold truncate leading-none">
                        {row.subText}
                      </p>
                    </div>

                    {/* Highly aesthetic theme conforming animated tooltip list card */}
                    {isHovered && (
                      <div className={`absolute z-50 bottom-full mb-3 left-1/2 -translate-x-1/2 w-60 p-3 border rounded-xl shadow-2xl leading-normal text-[10px] font-bold text-center select-none pointer-events-none transition-all duration-200 animate-zoom-in ${
                        isDark 
                          ? 'bg-slate-950 border-slate-800 text-slate-200 shadow-black/80' 
                          : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
                      }`}>
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
                          isDark ? 'border-t-slate-950' : 'border-t-white'
                        }`} />
                        <p className="font-extrabold text-[#1E94CF] border-b border-slate-200/5 pb-1 mb-1">{row.label}</p>
                        <p className="leading-snug font-medium text-slate-500 dark:text-slate-400">{row.tooltip}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 5. COGNITIVE REVOLUTION: CENTRAL DE INTELIGÊNCIA */}
      <div 
        id="intelligence-center" 
        className={`p-6 md:p-8 rounded-3xl border transition-all duration-300 ${
          isDark ? 'glass-dark border-slate-800' : 'glass-light border-slate-100 shadow-sm'
        }`}
      >
        <div className="border-b border-slate-200/5 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="h-5 w-5 text-shimmer" />
            </div>
            <div>
              <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                🧠 CENTRAL DE INTELIGÊNCIA VCR
              </h4>
              <p className="text-xs text-slate-400 font-semibold">Conselho consultivo de alto padrão para distribuidoras gourmets.</p>
            </div>
          </div>
          
          <button
            onClick={generateAIAdvisory}
            disabled={loadingInsights}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#1E94CF] to-[#8BC039] text-white rounded-xl text-xs font-bold hover:brightness-110 cursor-pointer shadow-md shadow-[#1E94CF]/10 shrink-0"
          >
            <Sparkles className="h-4.5 w-4.5" />
            <span>Consultar Parecer IA</span>
          </button>
        </div>

        {/* AI Answer & Structured Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* AI Narrative Analysis (Markdown Renderer) */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-105'
            }`}>
              {loadingInsights ? (
                <div className="h-56 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#1E94CF]/25 border-t-[#1E94CF] rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-350 animate-pulse">{simulationLogs[currentLogIndex]}</p>
                </div>
              ) : insightReport ? (
                <div className="space-y-4 text-xs font-semibold leading-relaxed">
                  <div className="flex items-center justify-between border-b border-slate-200/5 pb-3">
                    <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <Cpu className="h-3 w-3" /> Relatório Prescritivo
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                      aiMethod?.includes('Heurística') || aiMethod?.includes('Contingência') || aiMethod?.includes('Local')
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                        : 'bg-emerald-500/10 text-[#8BC039] border-[#8BC039]/10'
                    }`}>
                      {aiMethod || 'SLA Ativo'}
                    </span>
                  </div>

                  <div className={`space-y-3 ${isDark ? 'text-slate-300' : 'text-[#1F3767]/90'}`}>
                    {insightReport.split('\n').map((line, lidx) => {
                      const cleanLine = line.trim();
                      if (!cleanLine) return null;

                      if (cleanLine.startsWith('###')) {
                        return (
                          <h5 key={lidx} className="font-extrabold text-[#1E94CF] uppercase tracking-wider text-[11px] border-l-2 border-[#1E94CF] pl-2.5 mt-3">
                            {cleanLine.replace('###', '').trim()}
                          </h5>
                        );
                      } else if (cleanLine.startsWith('##')) {
                        return (
                          <h4 key={lidx} className="font-black text-[#8BC039] text-xs uppercase tracking-wide mt-4">
                            {cleanLine.replace('##', '').trim()}
                          </h4>
                        );
                      } else if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
                        return (
                          <div key={lidx} className="flex items-start space-x-2 my-1 ml-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 translate-y-1.5 shrink-0" />
                            <span>{cleanLine.replace(/^[-*]\s*/, '').trim()}</span>
                          </div>
                        );
                      } else {
                        return <p key={lidx} className="my-1 text-xs">{cleanLine}</p>;
                      }
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 gap-2 text-center text-xs">
                  <Info className="h-8 w-8 text-slate-600 animate-pulse" />
                  <p className="font-bold">Ausência de análise de balanço.</p>
                  <p className="text-[10px] text-slate-500 max-w-xs">Clique no botão superior para que o oráculo carregue os dados.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats list (Copilot highlights) */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-105'
            }`}>
              <h5 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Activity className="h-3.5 w-3.5 text-[#1E94CF]" /> AUDITORIA CO-PILOT
              </h5>
              
              <div className="space-y-4">
                
                {/* 1. Produtos sem giro */}
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Estoque Estagnado (Sem Giro)</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {stagnantProducts.length} itens parados
                    </span>
                    <span className="text-rose-400 font-extrabold">
                      R$ {totalDormantCapital.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* 2. Top Clientes */}
                <div className="space-y-1.5 border-t border-slate-200/5 pt-3">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Clientes Estratégicos</span>
                  <div className="space-y-1">
                    {topRentableCustomers.map(c => (
                      <div key={c.id} className="flex justify-between items-center text-[11px] font-semibold">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{c.name}</span>
                        <span className="text-emerald-400 font-black">R$ {c.totalSpent.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Vendedor Destaque */}
                <div className="space-y-1.5 border-t border-slate-200/5 pt-3">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Vendedor Destaque</span>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Marcos Pinheiro</span>
                    <span className="text-cyan-400 font-black">Meta: 112%</span>
                  </div>
                </div>

                {/* 4. Previsão Financeira */}
                <div className="space-y-1.5 border-t border-slate-200/5 pt-3">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Previsão Mês Próximo</span>
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className={isDark ? 'text-slate-200' : 'text-slate-750'}>Faturamento Estimado</span>
                    <span className="text-emerald-400">R$ {forecastNextMonth.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 6. REAL TIMELINES GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* 6A. REAL TIMELINE FOR RECONCILIATIONS */}
        <div 
          id="financial-timeline-card" 
          className={`p-6 rounded-3xl border transition-all duration-300 ${
            isDark ? 'glass-dark border-slate-800 shadow-lg' : 'glass-light border-slate-100 shadow-sm'
          }`}
        >
          <div className="border-b border-slate-200/5 pb-4 mb-5 flex items-center justify-between">
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                FLUXÃO DE CAIXA EM TEMPO REAL
              </span>
              <h4 id="timeline-title" className={`text-base font-black ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                Últimos Balanços e Baixas Registradas
              </h4>
            </div>
            <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          </div>

          {/* Vertical Timeline Elements */}
          <div className="relative pl-6 space-y-6">
            <div className={`absolute left-[9px] top-2 bottom-3 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />

            {financialRecords.slice(0, 5).map((record) => {
              const isReceita = record.type === 'receita';
              const isPaid = record.status === 'Pago';

              const pointBorder = isReceita 
                ? isPaid ? 'border-[#8BC039]' : 'border-[#1E94CF]'
                : isPaid ? 'border-amber-500' : 'border-rose-500';

              return (
                <div 
                  key={record.id} 
                  className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Status Dot */}
                  <span className={`absolute -left-[22px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center z-10 transition-all ${pointBorder}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isReceita ? 'bg-[#8BC039]' : 'bg-rose-500'}`} />
                  </span>

                  <div className="space-y-1 select-none">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-black ${isDark ? 'text-slate-100' : 'text-[#1F3767]'}`}>
                        {record.description}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                        record.category === 'Vendas' 
                          ? 'bg-[#1E94CF]/10 text-[#1E94CF]' 
                          : 'bg-rose-500/10 text-rose-455'
                      }`}>
                        {record.category}
                      </span>
                    </div>
                    
                    <p className={`text-[11px] ${isDark ? 'text-slate-400 font-semibold' : 'text-slate-500 font-medium'}`}>
                      Favorecido/Fornecedor: <span className="font-extrabold">{record.partyName}</span>
                    </p>
                    
                    <p className={`text-[10px] ${isDark ? 'text-slate-500 font-bold' : 'text-slate-455 font-semibold'}`}>
                      Vencimento: <span className="font-semibold">{record.dueDate}</span> {record.paymentDate && `| Liquidação: ${record.paymentDate}`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 self-start md:self-center shrink-0">
                    <div className="text-right">
                      <p className={`text-xs font-black font-mono ${isReceita ? 'text-[#8BC039]' : 'text-rose-500'}`}>
                        {isReceita ? '+' : '-'} R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md block w-max ml-auto mt-1 ${
                        isPaid 
                          ? 'bg-[#8BC039]/10 text-[#8BC039] border border-[#8BC039]/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {record.status}
                      </span>
                    </div>

                    {/* Settle Action mapping */}
                    {onSettleTransaction && (
                      <button
                        onClick={() => onSettleTransaction(record.id, isPaid ? 'Pendente' : 'Pago')}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                          isPaid 
                            ? isDark 
                              ? 'border-slate-800 text-slate-500 hover:bg-slate-900' 
                              : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                              : 'border-[#1E94CF] text-[#1E94CF] bg-white dark:bg-slate-950 dark:border-slate-700 hover:bg-[#1E94CF] hover:text-white dark:hover:bg-[#1E94CF]'
                        }`}
                      >
                        {isPaid ? 'Estornar' : 'Reconciliar'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* 6B. REAL TIMELINE FOR STOCK MOVEMENTS */}
        <div 
          id="stock-timeline-card" 
          className={`p-6 rounded-3xl border transition-all duration-300 ${
            isDark ? 'glass-dark border-slate-800 shadow-lg' : 'glass-light border-slate-100 shadow-sm'
          }`}
        >
          <div className="border-b border-slate-200/5 pb-4 mb-5 flex items-center justify-between">
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                AUDITORIA INTERNA DE INVENTÁRIO
              </span>
              <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                Fluxo Histórico de Movimentações (Estoque)
              </h4>
            </div>
            <Boxes className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          </div>

          {/* Vertical Timeline Elements */}
          <div className="relative pl-6 space-y-6">
            <div className={`absolute left-[9px] top-2 bottom-3 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />

            {(stockMovements.length > 0 ? stockMovements.slice(0, 5) : [
              {
                id: 'mv-init-1',
                produto_nome: 'Azeite de Oliva Extra Virgem 500ml',
                produto_sku: 'AL-AZE-050',
                tipo: 'ENTRADA' as const,
                quantidade: 240,
                valor: 28.50,
                observacao: 'Abertura de estoque inicial do armazém',
                created_at: '2026-06-03T10:00:00Z'
              },
              {
                id: 'mv-init-2',
                produto_nome: 'Arroz Integral Cateto Orgânico 1kg',
                produto_sku: 'AL-ARR-102',
                tipo: 'ENTRADA' as const,
                quantidade: 450,
                valor: 8.20,
                observacao: 'Inserção de novos lotes de grãos',
                created_at: '2026-06-03T12:00:00Z'
              },
              {
                id: 'mv-init-3',
                produto_nome: 'Café Espresso Ristretto Cápsulas (C/10)',
                produto_sku: 'BE-CAF-301',
                tipo: 'SAIDA' as const,
                quantidade: 20,
                valor: 27.90,
                observacao: 'Baixa de mercadoria vendida',
                created_at: '2026-06-03T14:35:00Z'
              }
            ]).map((movement) => {
              const isEntrada = movement.tipo === 'ENTRADA';
              const isSaida = movement.tipo === 'SAIDA';
              const isAjuste = movement.tipo === 'AJUSTE';

              const pointBorder = isEntrada 
                ? 'border-emerald-500' 
                : isSaida 
                  ? 'border-rose-500' 
                  : 'border-amber-500';

              const qtySign = isEntrada ? '+' : isSaida ? '-' : 'Saldo: ';

              return (
                <div 
                  key={movement.id} 
                  className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 group animate-fade-in"
                >
                  {/* Status Dot */}
                  <span className={`absolute -left-[22px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center z-10 transition-all ${pointBorder}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isEntrada ? 'bg-emerald-500' : isSaida ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  </span>

                  <div className="space-y-1 select-none flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-black ${isDark ? 'text-slate-100' : 'text-[#1F3767]'}`}>
                        {movement.produto_nome || 'Produto'}
                      </span>
                      <code className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-650 px-1.5 py-0.25 rounded font-bold font-mono">
                        {movement.produto_sku}
                      </code>
                      <span className={`text-[8px] font-black px-1.5 py-0.25 rounded uppercase tracking-wider ${
                        isEntrada ? 'bg-emerald-50 text-emerald-600' :
                        isSaida ? 'bg-rose-50 text-rose-500' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {movement.tipo}
                      </span>
                    </div>
                    
                    {movement.observacao && (
                      <p className={`text-[11px] italic ${isDark ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>
                        Obs: {movement.observacao}
                      </p>
                    )}
                    
                    <p className={`text-[10px] ${isDark ? 'text-slate-500 font-semibold' : 'text-slate-450 font-bold'}`}>
                      Registro: <span className="font-semibold">{movement.created_at ? movement.created_at.substring(0, 16).replace('T', ' ') : 'Agendado'}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 self-start md:self-center shrink-0">
                    <div className="text-right">
                      <p className={`text-xs font-black font-mono ${
                        isEntrada ? 'text-emerald-500' : isSaida ? 'text-rose-500' : 'text-amber-500'
                      }`}>
                        {qtySign}{movement.quantidade} un
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block">
                        ref: R$ {movement.valor ? movement.valor.toFixed(2) : '0.00'}/un
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>

      </div> {/* End of Desktop layout wrapper */}

      {/* EXECUTIVE REPORT MODAL (UNDER GOVERNANCE) */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border z-10 p-6 md:p-8 transition-all duration-300 ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-white shadow-2xl shadow-black/80' 
                  : 'bg-white border-slate-100 text-slate-800 shadow-2xl shadow-slate-200/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-200/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#1E94CF] to-[#8BC039] text-white">
                    <FileText className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Gerar Relatório Executivo</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400 font-medium' : 'text-slate-500 font-semibold'}`}>
                      Mecanismo de governança corporativa e auditoria WAGON AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                
                {/* Left Side: Parameters Form (Columns 5) */}
                <div className="lg:col-span-5 space-y-5 lg:border-r border-slate-200/10 lg:pr-6 md:pr-0">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#1E94CF]">
                      1. Parâmetros de Filtro
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-medium`}>
                      Selecione o período do fechamento mercantil a ser consolidado.
                    </p>
                  </div>

                  {/* Period Input Select */}
                  <div className="space-y-1.5">
                    <label className={`text-[10px] uppercase font-black tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Período de Referência *
                    </label>
                    <select
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(e.target.value)}
                      className={`w-full p-3 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-1 focus:ring-brand-light cursor-pointer shadow-xs ${
                        isDark 
                          ? 'bg-slate-900 border border-slate-800 text-white focus:border-slate-700' 
                          : 'bg-white border border-slate-200 text-[#1F3767] focus:border-slate-300'
                      }`}
                    >
                      <option value="Hoje">Hoje (2026-06-03)</option>
                      <option value="Últimos 7 dias">Últimos 7 dias</option>
                      <option value="Últimos 15 dias">Últimos 15 dias</option>
                      <option value="Últimos 30 dias">Últimos 30 dias</option>
                      <option value="Este mês">Este mês (Junho/2026)</option>
                      <option value="Mês anterior">Mês anterior (Maio/2026)</option>
                      <option value="Este ano">Este ano (2026)</option>
                      <option value="Personalizado">Intervalo Personalizado...</option>
                      <option value="Todos">Todo o Histórico</option>
                    </select>
                  </div>

                  {/* Custom Dates (Conditional Render) */}
                  <AnimatePresence>
                    {reportPeriod === 'Personalizado' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Data Inicial
                            </label>
                            <input
                              type="date"
                              value={reportStartDate}
                              onChange={(e) => setReportStartDate(e.target.value)}
                              className={`w-full p-2.5 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-brand-light ${
                                isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-700'
                              }`}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Data Final
                            </label>
                            <input
                              type="date"
                              value={reportEndDate}
                              onChange={(e) => setReportEndDate(e.target.value)}
                              className={`w-full p-2.5 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-brand-light ${
                                isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-700'
                              }`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Footer Action */}
                  <div className="pt-2">
                    <button
                      disabled={reportGenerating}
                      onClick={handleGenerateExecutiveReport}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#1E94CF] to-[#8BC039] hover:brightness-110 disabled:opacity-50 text-white p-3.5 rounded-xl text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer border-none"
                    >
                      {reportGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Consolidando Metadados...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          <span>Gerar Relatório Corporativo</span>
                        </>
                      )}
                    </button>
                    <p className={`text-[10px] mt-2.5 leading-normal text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Emitente real cadastrado: <strong>14.571.417 Cristiane Aparecida Gonçalves</strong>. Emissões geradas em PDF A4 prontas para auditorias externas.
                    </p>
                  </div>
                </div>

                {/* Right Side: Saved Report Copies ("Database History") (Columns 7) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#8BC039]">
                        2. Histórico de Cópias (Banco de Dados)
                      </h4>
                      <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-medium`}>
                        Acessível por diretores/administradores (Edilson Mesquita)
                      </p>
                    </div>
                    <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md ${
                      isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {reportHistory.length} salvos
                    </span>
                  </div>

                  {/* History List */}
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {reportHistory.length === 0 ? (
                      <div className="text-center py-10 space-y-2 border border-dashed rounded-2xl border-slate-200/10 p-4">
                        <FileText className="h-8 w-8 text-slate-400 mx-auto opacity-40 animate-pulse" />
                        <h5 className={`text-xs font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Nenhum relatório emitido anteriormente
                        </h5>
                        <p className={`text-[10px] max-w-xs mx-auto leading-relaxed ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          Ao clicar em gerar relatório, uma cópia autenticada por chave digital será gravada no banco de dados local.
                        </p>
                      </div>
                    ) : (
                      reportHistory.map((report) => (
                        <div
                          key={report.id}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                            isDark 
                              ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' 
                              : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-black font-mono text-sky-450 uppercase">
                                {report.id}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded ${
                                isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-[#1F3767]'
                              }`}>
                                {report.period}
                              </span>
                            </div>
                            <h5 className={`text-xs font-extrabold truncate max-w-[200px] ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                              {report.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-semibold font-mono">
                              Faturamento: <strong className="text-emerald-400">R$ {report.metrics.totalFaturamento.toLocaleString('pt-BR')}</strong> | Emitido em: {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {/* Visualizar inline de dados básicos */}
                            <button
                              title="Visualizar Indicadores Rápidos"
                              onClick={() => {
                                alert(
                                  `🔐 AUDITORIA DE RELATÓRIO DO CANAL (${report.id})\n\n` +
                                  `Emitido por: Edilson Mesquita\n` +
                                  `Faturamento Geral: R$ ${report.metrics.totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                                  `Margem de Lucro: R$ ${report.metrics.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                                  `Total de Saídas: R$ ${report.metrics.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                                  `Vendas: ${report.metrics.totalVendas} ped\n` +
                                  `Ticket Médio: R$ ${report.metrics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                                  `Patrimônio em Estoque: R$ ${report.metrics.valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                );
                              }}
                              className={`p-2 rounded-xl border text-[10px] font-black cursor-pointer transition-all ${
                                isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-350' : 'border-slate-150 hover:bg-slate-100 text-slate-600'
                              }`}
                            >
                              Visualizar
                            </button>

                            {/* Baixar PDF novamente */}
                            <button
                              title="Baixar PDF do Histórico"
                              onClick={() => handleRedownloadReport(report)}
                              className="p-2 rounded-xl bg-gradient-to-r from-[#1E94CF] to-[#8BC039] text-white hover:opacity-90 active:scale-90 shadow-xs cursor-pointer border-none flex items-center justify-center"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                            {/* Excluir de novo */}
                            <button
                              title="Remover Registro do Banco"
                              onClick={() => handleDeleteReport(report.id)}
                              className={`p-2 rounded-xl border cursor-pointer hover:text-white transition-all text-slate-400 ${
                                isDark ? 'border-slate-800 hover:bg-rose-950/40 hover:border-rose-900' : 'border-slate-100 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

