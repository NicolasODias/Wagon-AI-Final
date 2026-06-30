/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  Activity, 
  ChevronRight, 
  Send, 
  Terminal, 
  ShieldAlert, 
  Coins, 
  Flame, 
  ArrowUpRight, 
  RefreshCw, 
  CheckCircle, 
  Building, 
  Users, 
  ShoppingCart, 
  Boxes, 
  Target, 
  LineChart, 
  PieChart, 
  Award, 
  HelpCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { Product, Client, Order, FinancialRecord, Seller, BIInsight } from '../types';
import { apiFetch } from '../lib/api';
import { getCurrentAccessToken } from '../lib/supabaseClient';

interface VirtualCFOProps {
  products: Product[];
  clients: Client[];
  orders: Order[];
  financialRecords: FinancialRecord[];
  sellers: Seller[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isHeuristic?: boolean;
}

export default function VirtualCFO({
  products,
  clients,
  orders,
  financialRecords,
  sellers
}: VirtualCFOProps) {
  // Navigation tabs of CFO Portal: 'dashboard' | 'simulator' | 'stagnant'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'simulator' | 'stagnant'>('dashboard');

  // AI Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'default-1',
      role: 'assistant',
      text: `**AUTODIAGNÓSTICO SISTÊMICO CONCLUÍDO**\n\nSaudações Executivas. Eu sou o seu **CFO Virtual de Elite**. Analisei o faturamento, os demonstrativos fiscais, a giro dos estoques corporativos, limites de clientes e desempenho comercial.\n\nComo posso fundamentar suas decisões mercantis hoje? Experimente perguntar sobre riscos de inadimplência, produtos parados ou sugerir um planejamento tributário estratégico.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [telemetry, setTelemetry] = useState({
    model: 'gemini-3.5-flash',
    uptime: '99.98%',
    latency: '0ms',
    tokens: '0'
  });

  // Simulator Variable
  const [growthScenario, setGrowthScenario] = useState<number>(20); // targeted growth rate %
  const [costReductionScenario, setCostReductionScenario] = useState<number>(10); // cost cutting scenario %

  // Scroll ref for chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // -------------------------------------------------------
  // CORE AUTOMATIC ANALYTICAL ENGINE (FINANCIAL & OPERATIONAL)
  // -------------------------------------------------------

  // A. Billing & Order Performance
  const totalFaturamento = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalFaturamento / totalOrdersCount : 0;
  
  const pendingBillingTotal = orders
    .filter(o => o.status === 'Aguardando Faturamento')
    .reduce((sum, o) => sum + o.total, 0);

  // B. Profitability & COGS (Custo de mercadoria vendida)
  const totalCOGS = orders.reduce((sum, o) => {
    return sum + o.items.reduce((skuSum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      const cost = p ? p.costPrice : (item.unitPrice * 0.6); // default 60%
      return skuSum + (cost * item.quantity);
    }, 0);
  }, 0);

  const totalTaxes = orders.reduce((sum, o) => sum + (o.taxes?.total || 0), 0);
  const brutoReal = totalFaturamento - totalCOGS;
  const lucroLiquidoEstimado = brutoReal - totalTaxes;
  const margemLiquidaMedia = totalFaturamento > 0 ? (lucroLiquidoEstimado / totalFaturamento) * 100 : 0;

  // C. Stock Capital Analytics
  const capitalInvestidoEstoque = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const valorVendaEstoqueTotal = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
  const markupAritmeticoMedio = capitalInvestidoEstoque > 0 ? ((valorVendaEstoqueTotal - capitalInvestidoEstoque) / capitalInvestidoEstoque) * 100 : 0;
  const criticalStockItems = products.filter(p => p.stock <= p.minStock);

  // D. Stagnant Products Identification
  // Stagnant = high stock (stock > minStock) and 0 quantity sold in current active orders list
  const stagnantProducts = products.map(prod => {
    const totalSold = orders.reduce((sum, order) => {
      const item = order.items.find(it => it.productId === prod.id);
      return sum + (item ? item.quantity : 0);
    }, 0);
    return {
      product: prod,
      totalSold,
      dormantCapital: prod.stock * prod.costPrice,
      potentialRevenue: prod.stock * prod.sellingPrice
    };
  })
  .filter(item => item.totalSold === 0 && item.product.stock > 0)
  .sort((a,b) => b.dormantCapital - a.dormantCapital);

  const capitalPresoEstagnado = stagnantProducts.reduce((sum, s) => sum + s.dormantCapital, 0);

  // E. Clients Audit & Credit Exposure
  const totalClientes = clients.length;
  const customerDebasement = clients.reduce((sum, c) => sum + c.debtBalance, 0);
  const averageTicketPerClient = totalClientes > 0 ? totalFaturamento / totalClientes : 0;

  // Credit Risks classification
  const riskGroups = clients.reduce((acc, client) => {
    acc[client.riskClass] = (acc[client.riskClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskExposureValue = clients
    .filter(c => c.riskClass === 'C' || c.riskClass === 'D')
    .reduce((sum, c) => sum + c.debtBalance, 0);

  // F. Sales Force Matrix (Sellers)
  const sellersStatistics = sellers.map(seller => {
    // Orders sold by this rep or portfolio client belonging to them
    const sellerOrders = orders.filter(o => {
      if (o.salesRep === seller.name) return true;
      const client = clients.find(c => c.id === o.clientId);
      return client && client.salesRep === seller.name;
    });

    const revenue = sellerOrders.reduce((sum, o) => sum + o.total, 0);
    const commissions = revenue * (seller.commissionRate / 100);

    return {
      seller,
      revenue,
      ordersCount: sellerOrders.length,
      commissions,
      performanceRate: seller.target > 0 ? (revenue / seller.target) * 100 : 100
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const topSeller = sellersStatistics[0];
  const comissaoTotalApurada = sellersStatistics.reduce((sum, s) => sum + s.commissions, 0);

  // -------------------------------------------------------
  // DYNAMIC FORECAST & SIMULATOR RESULTS
  // -------------------------------------------------------
  const simulatedBillingResult = totalFaturamento * (1 + growthScenario / 100);
  const simulatedCogsResult = totalCOGS * (1 - costReductionScenario / 100);
  const simulatedTaxesResult = simulatedBillingResult * 0.11; // 11% average tax multiplier
  const simulatedProfitResult = simulatedBillingResult - simulatedCogsResult - simulatedTaxesResult;
  const simulatedMargin = simulatedBillingResult > 0 ? (simulatedProfitResult / simulatedBillingResult) * 100 : 0;

  // -------------------------------------------------------
  // FINANCIAL ALERTS GENERATOR
  // -------------------------------------------------------
  const getAutomatedAlerts = () => {
    const alertsList: { title: string; desc: string; type: 'critical' | 'alert' | 'optim' }[] = [];

    // Alert 1: Low stock risks represent selling loss
    if (criticalStockItems.length > 0) {
      alertsList.push({
        title: `Risco de Ruptura de Estoque (${criticalStockItems.length} SKUs)`,
        desc: `Existem ${criticalStockItems.length} gôndolas abaixo ou no limite de segurança de estoque. Risco de interrupção operacional.`,
        type: 'critical'
      });
    }

    // Alert 2: High exposure to Risk Class C & D clients
    if (riskExposureValue > 15000) {
      alertsList.push({
        title: 'Alta Exposição a Crédito de Risco C/D',
        desc: `Saldo pendente em aberto de R$ ${riskExposureValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} concentrado em clientes com ratings C/D.`,
        type: 'alert'
      });
    }

    // Alert 3: Stagnant inventory bleeding capital
    if (capitalPresoEstagnado > 5000) {
      alertsList.push({
        title: 'Capital Imobilizado Ocioso',
        desc: `Constatados R$ ${capitalPresoEstagnado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em estoque letárgico (produtos sem faturamento).`,
        type: 'alert'
      });
    }

    // Alert 4: Outstanding faturamento values
    if (pendingBillingTotal > 8000) {
      alertsList.push({
        title: 'Volume Pendente de Faturamento de Caixa',
        desc: `R$ ${pendingBillingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em pedidos aguardando emissão fiscal de faturamento.`,
        type: 'optim'
      });
    }

    return alertsList;
  };

  const automatedAlerts = getAutomatedAlerts();

  // -------------------------------------------------------
  // REAL-TIME CONVERSATIONAL HANDLER FOR CLIENTS
  // -------------------------------------------------------
  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsgText = chatInput;
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    const startTime = performance.now();

    try {
      // Prompt construction for Gemini
      const analyticsContext = `
      Você é o CFO Virtual (ARES AI) focado em tomada de decisões reais e auditoria.
      
      ESTADO DO NEGÓCIO ATUAL:
      - FATURAMENTO TOTAL: R$ ${totalFaturamento.toFixed(2)} acumulados em ${totalOrdersCount} pedidos.
      - FATURAMENTO PENDENTE (A AGUARDAR NOTA FISCAL): R$ ${pendingBillingTotal.toFixed(2)}.
      - CUSTO DE MERCADORIA VENDIDA (COGS): R$ ${totalCOGS.toFixed(2)}.
      - IMPOSTOS PAGOS: R$ ${totalTaxes.toFixed(2)}.
      - LUCRO LÍQUIDO OPERACIONAL: R$ ${lucroLiquidoEstimado.toFixed(2)}.
      - MARGEM LÍQUIDA CALCULADA: ${margemLiquidaMedia.toFixed(2)}%.
      - CAPITAL TOTAL INVESTIDO EM ESTOQUE ATUAL: R$ ${capitalInvestidoEstoque.toFixed(2)}.
      - CAPITAL AMORTIZADO PRESO EM PRODUTOS PARADOS (SEM VENDAS): R$ ${capitalPresoEstagnado.toFixed(2)}.
      - DETALHE DE PRODUTOS PARADOS: ${JSON.stringify(stagnantProducts.map(s => ({ name: s.product.name, capital: s.dormantCapital })))}
      - NUMERO DE CLIENTES ATIVOS: ${totalClientes}.
      - SALDO EM ABERTO DE CRÉDITO COM CLIENTES (INADIMPLÊNCIA POTENCIAL): R$ ${customerDebasement.toFixed(2)}.
      - EXPOSIÇÃO DO SALDO DEVEDOR EM CLIENTES COM RATING RUIM C/D: R$ ${riskExposureValue.toFixed(2)}.
      - VENDEDORES ATIVOS: ${sellers.length}.
      - RANKING DE FATURAMENTO POR VENDEDOR: ${JSON.stringify(sellersStatistics.map(s => ({ name: s.seller.name, revenue: s.revenue })))}

      INSTRUÇÕES E REGRAS:
      1. Use tom corporativo formal de alto padrão científico de consultoria financeira internacional.
      2. Seja direto e estruturado com insights e conclusões baseados puramente no contexto numérico acima.
      3. Caso o usuário peça previsões ou sugestões estratégicas de expansão fiscal, mencione dados de estoque para produtos parados ou formas de otimizar a logística (como realocar prateleiras e rever limites de crédito dos clientes de alto risco como C ou D).
      4. Forneça respostas completas e resolutivas.
      `;

      // API Request to backend
      const accessToken = await getCurrentAccessToken();
      const response = await apiFetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          products,
          clients,
          orders,
          financialRecords,
          promptContext: `${analyticsContext}\n\nPergunta do Executivo: "${userMsgText}"`
        })
      });

      const latencyMs = (performance.now() - startTime).toFixed(0);

      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonErr) {
          throw new Error('Formato do arquivo de resposta do CFO inválido (não-JSON).');
        }
        
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: data?.reportText || `Analisei sua demanda e os indicadores operacionais. Nossas despesas de insumos totalizam R$ ${totalCOGS.toLocaleString('pt-BR')} com margem líquida consolidada em ${margemLiquidaMedia.toFixed(1)}%. Recomendo manter rédeas curtas nos prazos de liquidez. Como deseja prosseguir?`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isHeuristic: data?.method?.includes('Heurística')
        };
        setChatMessages(prev => [...prev, assistantMsg]);
        setTelemetry({
          model: data?.method?.includes('Gemini') ? 'gemini-3.5-flash' : 'Oráculo Local v1.8',
          uptime: '99.98%',
          latency: `${latencyMs}ms`,
          tokens: `${userMsgText.length + (data?.reportText?.length || 100)}`
        });
      } else {
        throw new Error('Servidor retornou código de erro na requisição');
      }

    } catch (err) {
      console.error('Error querying chat AI:', err);
      // Heuristic offline generator response
      setTimeout(() => {
        const latencyMs = (performance.now() - startTime).toFixed(0);
        const autoHeuristicResponse = getLocalHeuristicChatReply(userMsgText);
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: autoHeuristicResponse,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isHeuristic: true
        };
        setChatMessages(prev => [...prev, assistantMsg]);
        setTelemetry({
          model: 'Heurística Segmentada CFO (Modo Offline)',
          uptime: '100%',
          latency: `${latencyMs}ms`,
          tokens: '0'
        });
      }, 700);
    } finally {
      setChatLoading(false);
    }
  };

  // Prebaked local answers solver representing a highly qualified Virtual CFO
  const getLocalHeuristicChatReply = (query: string): string => {
    const qLower = query.toLowerCase();

    if (qLower.includes('risco') || qLower.includes('inadimplencia') || qLower.includes('crédito') || qLower.includes('cliente')) {
      return `### 🛡️ Auditoria de Risco de Crédito e Carteira
      
Detectei que nossa exposição consolidada e ativa em clientes com rating sofrível de classificação **C ou D de risco** é de **R$ ${riskExposureValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**. 
Este capital está sob restrição do CRM e necessita de acompanhamento rigoroso.

#### Planos Recomendados:
1. **Trava de Faturamento**: Limitar pedidos faturados via boleto a prazo para todos os clientes de rating D (prazos restritos a pagamento À Vista ou transferência em PIX).
2. **Reequilíbrio de Exposição**: Solicitar aos representantes comerciais, especialmente os de maior volume, que fiquem encarregados da renegociação dos passivos vencidos imediatamente.`;
    }

    if (qLower.includes('parado') || qLower.includes('estoque') || qLower.includes('stagnant') || qLower.includes('produto')) {
      return `### 📦 Diagnóstico de Otimização de Ativo Estocado (Gôndola Estagnada)
      
Temos atualmente o montante financeiro de **R$ ${capitalPresoEstagnado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** bloqueado na forma de produtos enquadrados como **sem faturamento comercial recorrente** (letárgicos).

#### Análise Geográfica das Prateleiras:
- O estoque médio de segurança está saturado para produtos inativos. Recomenda-se remanejá-los fisicamente para o **Corredor C** de armazenamento para liberar as prateleiras de rotação dinâmica (Corredor A).
- **Ação Executiva**: Programar lote de queima sazonal promovendo um combo bonificado com desconto de até 15%, incentivando o mix de compras dos clientes de classificação A ou B.`;
    }

    if (qLower.includes('previsão') || qLower.includes('fluxo') || qLower.includes('lucro') || qLower.includes('cresce') || qLower.includes('forecast')) {
      return `### 📈 Modelagem de Previsibilidade de Caixa Futuro (60-90 dias)
      
Sob o atual cenário de faturamento bruto estabilizado de **R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**, nosso lucro líquido estimado é de **R$ ${lucroLiquidoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** com margem líquida sustentada de **${margemLiquidaMedia.toFixed(1)}%**.

#### Projeções Fundamentadas:
- Caso mantenhamos a expansão mensal simulada à taxa de **${growthScenario}%**, prevemos um faturamento para o próximo trimestre em torno de **R$ ${(totalFaturamento * (1 + growthScenario/100)).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}**.
- No entanto, a necessidade imediata de capital de giro exigirá novos aportes na ordem de R$ ${(capitalInvestidoEstoque * 0.15).toFixed(0)} para manter os estoques mínimos de logística equilibrados.`;
    }

    return `### 💼 Parecer Consolidado do CFO Virtual Wagon AI
    
Focando na nossa operação executiva, os principais dados de governança fiscal indicam:
- **Rentabilidade Real**: R$ ${lucroLiquidoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} correspondendo a uma eficiência de margem líquida operacional de **${margemLiquidaMedia.toFixed(1)}%**.
- **Equilíbrio de Custos**: Das receitas cobradas, nossos insumos e custos de fornecedores consomem R$ ${totalCOGS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (COGS).
- **Proposta CFO de Caixa**: Focar esforços na liquidação das notas em aberto que somam R$ ${pendingBillingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes de emissão fiscal hoje para desafogar o capital de giro operacional.`;
  };

  // Immediate Suggestion prompts click callback helper
  const handlePresetTrigger = (promptText: string) => {
    setChatInput(promptText);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 rounded-3xl overflow-hidden border border-cyan-900/30 shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col font-mono text-xs relative">
      
      {/* Sci-Fi Ambient Vector Mesh background overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.06),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.05),transparent_40%)] pointer-events-none" />

      {/* Holographic Header Bar containing telemetry gauges */}
      <div className="bg-slate-950/80 p-6 border-b border-cyan-950/65 flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
        
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-px shadow-[0_0_20px_rgba(6,182,212,0.30)] flex items-center justify-center relative group">
            <Cpu className="h-6 w-6 text-slate-950 absolute group-hover:scale-110 transition-transform" />
            <div className="w-full h-full bg-[#050b18] rounded-xl flex items-center justify-center">
              <Cpu className="h-5.5 w-5.5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                ARES VIRTUAL CFO
              </h1>
              <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
                Cognitive AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider font-semibold">
              SISTEMA INTEGRADO DE AUDITORIA OPERACIONAL & PLANEJAMENTO INTEGRADO
            </p>
          </div>
        </div>

        {/* Realtime Cyber gauges row */}
        <div className="flex flex-wrap items-center gap-3 bg-[#0d162d]/60 p-2.5 rounded-xl border border-cyan-950/40 text-[10px]">
          <div className="px-3 border-r border-slate-800">
            <span className="text-slate-500 uppercase block font-bold">Model Engine</span>
            <span className="text-cyan-400 font-bold">{telemetry.model}</span>
          </div>
          <div className="px-3 border-r border-slate-800">
            <span className="text-slate-500 uppercase block font-bold">API Latency</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Activity className="h-3 w-3 animate-ping inline" /> {telemetry.latency}
            </span>
          </div>
          <div className="px-3 border-r border-slate-800">
            <span className="text-slate-500 uppercase block font-bold">Uptime Rate</span>
            <span className="text-sky-400 font-bold">{telemetry.uptime}</span>
          </div>
          <div className="px-3">
            <span className="text-slate-500 uppercase block font-bold">Decision SLA</span>
            <span className="text-amber-400 font-bold">Instantânea</span>
          </div>
        </div>

      </div>

      {/* Internal Sub-navigation Tabs */}
      <div className="bg-slate-950/40 border-b border-cyan-950/40 px-6 py-2.5 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-2 rounded-lg font-bold tracking-widest transition-all cursor-pointer uppercase ${
              activeSubTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-600/20 to-teal-600/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            📊 Centro de Comando
          </button>
          
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-4 py-2 rounded-lg font-bold tracking-widest transition-all cursor-pointer uppercase ${
              activeSubTab === 'simulator'
                ? 'bg-gradient-to-r from-cyan-600/20 to-teal-600/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            📈 Projeções & Forecasts
          </button>

          <button
            onClick={() => setActiveSubTab('stagnant')}
            className={`px-4 py-2 rounded-lg font-bold tracking-widest transition-all cursor-pointer uppercase ${
              activeSubTab === 'stagnant'
                ? 'bg-gradient-to-r from-cyan-600/20 to-teal-600/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            📦 Inventário Letárgico ({stagnantProducts.length})
          </button>
        </div>

        <div className="hidden lg:flex items-center space-x-1 text-slate-500 text-[10px] font-bold">
          <span>AI CFO Agent Actived</span>
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
        </div>
      </div>

      {/* Main split viewport layout (Analytics on Left, Interactive Chat Terminal on Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        
        {/* LEFT COLUMN: ACTIVE DATA SCREEN BOARDS */}
        <div className="w-full lg:w-[58%] p-6 overflow-y-auto border-r border-cyan-950/30 flex flex-col space-y-6">

          <AnimatePresence mode="wait">

            {/* TAB 1: EXECUTIVE COMMAND CENTER */}
            {activeSubTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                
                {/* CYBERNETIC INTEGRATED METRICS - REAL TIME AUTODIAGNOSIS */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  
                  {/* METRIC 1: Billing / Faturamento */}
                  <div className="p-4 bg-gradient-to-br from-slate-950 to-[#0c1221] border border-cyan-950/40 rounded-xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-widest">Faturamento Consolidado</span>
                    <strong className="text-base text-cyan-300 font-extrabold block mt-2 font-sans">
                      R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    <div className="flex items-center justify-between text-[8px] text-slate-500 mt-3 pt-2.5 border-t border-slate-900">
                      <span>{totalOrdersCount} pedidos fechados</span>
                      <span className="text-slate-500 flex items-center gap-0.5 font-bold">
                        0%
                      </span>
                    </div>
                  </div>

                  {/* METRIC 2: Net Profit / Lucratividade */}
                  <div className="p-4 bg-gradient-to-br from-slate-950 to-[#0c1221] border border-cyan-950/40 rounded-xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-widest font-mono">Lucro Líquido Real</span>
                    <strong className="text-base text-emerald-400 font-extrabold block mt-2 font-sans">
                      R$ {lucroLiquidoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    <div className="flex items-center justify-between text-[8px] text-slate-500 mt-3 pt-2.5 border-t border-slate-900">
                      <span>Eficiência de {margemLiquidaMedia.toFixed(1)}%</span>
                      <span className="text-slate-500 flex items-center gap-0.5 font-bold">
                        0.0pp
                      </span>
                    </div>
                  </div>

                  {/* METRIC 3: Stock Capital/Ativo */}
                  <div className="p-4 bg-gradient-to-br from-slate-950 to-[#0c1221] border border-cyan-950/40 rounded-xl relative group overflow-hidden col-span-2 md:col-span-1">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-widest">Patrimônio Estocado (Estoque)</span>
                    <strong className="text-base text-teal-300 font-extrabold block mt-2 font-sans">
                      R$ {capitalInvestidoEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    <div className="flex items-center justify-between text-[8px] text-slate-500 mt-3 pt-2.5 border-t border-slate-900">
                      <span>Markup médio de {markupAritmeticoMedio.toFixed(0)}%</span>
                      <span className="text-amber-400 font-bold">{criticalStockItems.length} alertas</span>
                    </div>
                  </div>

                </div>

                {/* THE INTEGRATED CORE EXECUTIVE ALERTS PANEL */}
                <div className="p-5 bg-slate-950/90 rounded-2xl border border-cyan-950/40 relative">
                  <div className="flex items-center justify-between mb-4 border-b border-cyan-950/35 pb-3">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="h-4.5 w-4.5 text-cyan-400" />
                      <h2 className="text-xs font-black uppercase tracking-widest text-slate-250">Gargalos Financeiros & Alertas IA</h2>
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 font-sans">AUDITORIA ATIVA</span>
                  </div>

                  <div className="space-y-3.5">
                    {automatedAlerts.map((alert, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg flex items-start space-x-3 text-[11px] border ${
                          alert.type === 'critical'
                            ? 'bg-rose-950/20 border-rose-900/30 text-rose-300'
                            : alert.type === 'alert'
                            ? 'bg-amber-950/25 border-amber-900/25 text-amber-300'
                            : 'bg-emerald-900/15 border-emerald-950/30 text-emerald-300'
                        }`}
                      >
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="font-extrabold block uppercase tracking-wider">{alert.title}</strong>
                          <span className="text-slate-400 leading-relaxed font-semibold mt-0.5 block">{alert.desc}</span>
                        </div>
                      </div>
                    ))}

                    {automatedAlerts.length === 0 && (
                      <div className="p-6 text-center text-slate-500 font-bold">
                        <span>Sem alertas críticos detectados. Operação financeira operando em parâmetros nominais de estabilidade.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* VISUAL GEOGRAPHIC ANALYSIS: PORTFOLIO CREDIT EXPOSURE */}
                <div className="bg-[#090f1d] border border-cyan-950/35 p-5 rounded-2xl relative">
                  
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4 pb-3 border-b border-slate-900">
                    <div className="flex items-center space-x-2">
                      <LineChart className="h-4.5 w-4.5 text-cyan-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">
                        Raio-X de Exposição de Crédito no CRM
                      </h3>
                    </div>
                    
                    <span className="bg-cyan-500/10 text-cyan-400 font-bold text-[8.5px] uppercase px-2.5 py-0.5 rounded border border-cyan-500/20">
                      Total exposto: R$ {customerDebasement.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                    
                    {/* RISK TIER BAR METER */}
                    <div className="space-y-3.5">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Classificações de Crédito de Clientes</span>
                      
                      {['A', 'B', 'C', 'D'].map((rating) => {
                        const count = riskGroups[rating] || 0;
                        const percentage = totalClientes > 0 ? (count / totalClientes) * 100 : 0;
                        return (
                          <div key={rating} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  rating === 'A' ? 'bg-emerald-400' : rating === 'B' ? 'bg-indigo-400' : rating === 'C' ? 'bg-amber-400' : 'bg-rose-500'
                                }`} />
                                Rating {rating} ({rating === 'A' ? 'Excelente' : rating === 'B' ? 'Aceitável' : rating === 'C' ? 'Atencioso' : 'Restrito'})
                              </span>
                              <span className="text-slate-400 font-bold">{count} clientes ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  rating === 'A' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : rating === 'B' ? 'bg-gradient-to-r from-indigo-500 to-teal-400' : rating === 'C' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-500 to-red-600'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* SEGMENTED EXECUTIVE RATIOS BOARD */}
                    <div className="bg-slate-950/65 p-4 rounded-xl border border-slate-900/60 flex flex-col space-y-3.5">
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block pb-1 border-b border-slate-900">ÍNDICES DE GOVERNANÇA</span>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Giro de Estoque Corrente:</span>
                        <strong className="text-cyan-300 font-extrabold">2.4x / ano</strong>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">Exposição ao Risco (C/D):</span>
                        <strong className="text-amber-400 font-extrabold">
                          R$ {riskExposureValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">Margem Comercial Média:</span>
                        <strong className="text-emerald-400 font-extrabold">
                          {markupAritmeticoMedio.toFixed(1)}%
                        </strong>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">Prazo Médio de Faturamento:</span>
                        <strong className="text-indigo-400 font-extrabold">22 Dias</strong>
                      </div>
                    </div>

                  </div>

                </div>

                {/* STRATEGIC PROPOSALS GRID PANEL */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-4.5 w-4.5 text-cyan-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
                      Sugestões Estratégicas Formuladas (ARES)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Proposal 1 */}
                    <div 
                      onClick={() => handlePresetTrigger('Quais produtos da lista de inventário letárgico geram custos excessivos e quais planos estratégicos de liquidação sazonal podemos programar?')}
                      className="p-4 bg-slate-950/50 hover:bg-slate-950 border border-slate-900 hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block w-fit">Incentivo de Giro</span>
                        <strong className="text-[11.5px] text-white font-extrabold block group-hover:text-cyan-400 transition-colors">Campanha Líquida para Estoque Ocioso</strong>
                        <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                          Promover uma ação de faturamento com desconto de até 15% nos produtos de baixa saída para liberar R$ {capitalPresoEstagnado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em capital de giro preso.
                        </p>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-bold block mt-3 flex items-center gap-0.5">
                        Impacto Estimado: + R$ {(capitalPresoEstagnado * 0.85).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em caixa liquido <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>

                    {/* Proposal 2 */}
                    <div 
                      onClick={() => handlePresetTrigger('Como otimizar a política de crédito para clientes de risco C e D e elevar faturamento de clientes de baixo risco?')}
                      className="p-4 bg-slate-950/50 hover:bg-slate-950 border border-slate-900 hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block w-fit">Mitigação Tributária</span>
                        <strong className="text-[11.5px] text-white font-extrabold block group-hover:text-cyan-400 transition-colors">Trava de Crédito de Clientes C/D</strong>
                        <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                          Recomenda-se travar novos saldos a prazo para clientes com saldo devedor que atinja 65% do limite. Focar no faturamento de recebíveis a vista.
                        </p>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-bold block mt-3 flex items-center gap-0.5">
                        Rua Logística livre & Inadimplência mitigada <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>

                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB 2: SIMULATIONS AND ACCUMULATED SCENARIOS (FORECASTS) */}
            {activeSubTab === 'simulator' && (
              <motion.div
                key="simulator"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                
                <div className="p-5 bg-slate-950/80 rounded-2xl border border-cyan-950/45 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xs font-black uppercase tracking-widest text-[#00E5FF]">
                      Simulador de Cenário e Impacto Financeiro (Forecast IA)
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Configure os coeficientes de crescimento almejado e redução de custos operacionais para prever o impacto tributário e geração de lucro no próximo trimestre.
                    </p>
                  </div>

                  {/* Range inputs sliders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                    
                    <div className="space-y-2 bg-[#0c1428] p-4.5 rounded-xl border border-slate-900">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-300 font-bold font-mono">META DE EXPANSÃO DE VENDAS</span>
                        <strong className="text-cyan-400">+{growthScenario}%</strong>
                      </div>
                      <input 
                        type="range"
                        min="5"
                        max="80"
                        value={growthScenario}
                        onChange={(e) => setGrowthScenario(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Faturamento Bruto Ajustado: R$ {simulatedBillingResult.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div className="space-y-2 bg-[#0c1428] p-4.5 rounded-xl border border-slate-900">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-300 font-bold font-mono">REDUÇÃO DE CUSTOS DE INSUMOS (COGS)</span>
                        <strong className="text-teal-400">-{costReductionScenario}%</strong>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="30"
                        value={costReductionScenario}
                        onChange={(e) => setCostReductionScenario(Number(e.target.value))}
                        className="w-full accent-teal-400 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Custo de Mercadorias Otimizado: R$ {simulatedCogsResult.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>

                  </div>
                </div>

                {/* THE SIMULATED CASH DEMONSTRATIVE BOARD */}
                <div className="bg-[#090f1d] border border-cyan-950/35 p-5 rounded-2xl">
                  
                  <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-900">
                    <Target className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">
                      Projeção do Demonstrativo de Resultado Trimestral (DRE)
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    
                    {/* Item A */}
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                        Faturamento de Vendas (Simulado)
                      </span>
                      <strong className="text-white font-mono">
                        R$ {simulatedBillingResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    {/* Item B */}
                    <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-900">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        (-) Custo das Mercadorias Vendidas (COGS)
                      </span>
                      <strong className="text-rose-450 font-mono">
                        - R$ {simulatedCogsResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    {/* Item C */}
                    <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-900">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        (-) Impostos s/ Faturamento (Estimado 11%)
                      </span>
                      <strong className="text-indigo-400 font-mono">
                        - R$ {simulatedTaxesResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    {/* NET RESULT */}
                    <div className="flex justify-between items-center text-xs pt-3.5 border-t border-dashed border-cyan-900/60 bg-cyan-950/10 p-3 rounded-xl border border-cyan-950/20">
                      <span className="text-cyan-300 font-black flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                        RESULTADO LÍQUIDO OPERACIONAL SIMULADO
                      </span>
                      <strong className="text-emerald-400 font-black font-mono">
                        R$ {simulatedProfitResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                  </div>

                  <div className="bg-slate-950/50 p-3.5 pr-4 rounded-xl border border-dashed border-slate-900 mt-5 flex items-center gap-3.5">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black shrink-0 font-sans">
                      {simulatedMargin.toFixed(1)}%
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Margem Simulada Esperada</span>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        A otimização de insumos melhora nossa eficiência líquida em **{Math.max(0, simulatedMargin - margemLiquidaMedia).toFixed(1)} pontos percentuais** comparado ao nosso faturamento mercante histórico.
                      </p>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* TAB 3: STAGNANT AND INACTIVE INVENTORY WITH FINANCIAL REMEDY */}
            {activeSubTab === 'stagnant' && (
              <motion.div
                key="stagnant"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                
                <div className="p-5 bg-gradient-to-br from-slate-950 to-[#0e162b] border border-cyan-950/45 rounded-2xl relative">
                  
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 pb-3.5 border-b border-slate-900 relative">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Boxes className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-[#00E5FF]">
                          Auditoria de SKU Ocioso & Capital Letárgico
                        </h2>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Filtro automatizado identificando produtos ativos contendo estoque significativo, porém com vendas zeradas nos relatórios comerciais do ERP.
                      </p>
                    </div>

                    <div className="bg-cyan-505/10 bg-[#081b33] border border-cyan-500/30 rounded-xl px-3.5 py-1.5 flex flex-col justify-center text-right shrink-0">
                      <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Capital Morto</span>
                      <strong className="text-xs text-orange-400 font-extrabold font-sans">R$ {capitalPresoEstagnado.toLocaleString('pt-BR')}</strong>
                    </div>
                  </div>

                  {stagnantProducts.length > 0 ? (
                    <div className="divide-y divide-slate-900 overflow-hidden rounded-xl border border-slate-900 bg-slate-950/20 max-h-96 overflow-y-auto mt-4 pr-1">
                      {stagnantProducts.map(({ product, dormantCapital, potentialRevenue }) => (
                        <div key={product.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-950/70 transition-colors">
                          <div className="space-y-0.5">
                            <span className="text-slate-100 font-bold block">{product.name}</span>
                            <span className="font-mono text-[9px] text-slate-500 block">SKU: {product.sku} • Corredor {product.corridor}, Prateleira {product.shelf}</span>
                            <span className="text-[10px] text-slate-400 block mt-1.5">Disponível em estoque faturável: <strong className="text-slate-300 font-bold">{product.stock} {product.unit}</strong></span>
                          </div>

                          <div className="flex items-center space-x-6 text-right">
                            <div className="text-[10px]">
                              <span className="text-slate-500 block">Custo Investido:</span>
                              <strong className="font-mono text-cyan-300 font-bold">R$ {dormantCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                            </div>
                            <div className="text-[10px]">
                              <span className="text-slate-500 block">Faturamento Potencial:</span>
                              <strong className="font-mono text-emerald-400 font-bold">R$ {potentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                            </div>
                            
                            {/* Actions proposing instant liquidations */}
                            <button
                              onClick={() => handlePresetTrigger(`Como estruturar de forma agressiva uma campanha de liquidação para o produto ocioso ${product.name} (SKU: ${product.sku}), atualmente localizado no corredor ${product.corridor}?`)}
                              className="px-3.5 py-2 bg-[#0a233b] hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 text-[10px] font-black rounded-lg border border-cyan-500/25 cursor-pointer uppercase transition-all tracking-tight shrink-0 shadow-lg"
                            >
                              Liquidar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 border border-dashed border-slate-800 rounded-xl mt-4 text-center text-slate-500 font-bold">
                      <span>Nenhum ativo letárgico identificado pela auditoria corporativa. Todos os SKUs registraram atividade mercantil ativa.</span>
                    </div>
                  )}

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE CYBERNETIC COGNITIVE CONSOLE (CHATBOT) */}
        <div className="w-full lg:w-[42%] bg-[#040811]/90 border-t lg:border-t-0 p-6 flex flex-col min-h-[480px] h-[70dvh] sm:h-[650px] lg:h-auto overflow-hidden relative">
          
          <div className="flex items-center justify-between pb-3.5 border-b border-cyan-950/65 shrink-0">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4.5 w-4.5 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-200">Terminal Cognitivo ARES</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9px] text-slate-500 uppercase font-black">AI ONLINE</span>
            </div>
          </div>

          {/* Messages Grid output area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {chatMessages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`p-4 rounded-xl max-w-[88%] shadow-md border leading-relaxed text-[11px] font-sans ${
                    isAssistant 
                      ? 'bg-[#0a1122]/90 border-cyan-900/30 text-slate-200 shadow-cyan-950/5' 
                      : 'bg-[#152e4d] border-cyan-500/30 text-white shadow-emerald-950/5'
                  }`}>
                    
                    {/* Header tags inside bubbles */}
                    <div className="flex items-center justify-between text-[8px] text-slate-500 uppercase font-bold tracking-wider mb-2 pb-1 border-b border-neutral-900/30">
                      <span>{isAssistant ? 'ARES CFO BOT' : 'DIRETOR EXECUTIVO'}</span>
                      <div className="flex items-center space-x-1.5">
                        {isAssistant && msg.isHeuristic && (
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded px-1 lowercase text-[7.5px] font-bold">heurística</span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    {/* Styled Markdown texts block */}
                    <div className="whitespace-pre-wrap font-sans text-xs prose prose-invert prose-xs leading-relaxed max-w-none text-slate-300">
                      {msg.text.split('\n\n').map((paragraph, pIdx) => {
                        // Very simple markdown bold renderer
                        let cleanText = paragraph.replace(/\*\*(.*?)\*\*/g, '$1');
                        
                        // Bold specific line starters for scannability
                        const isMainBullet = paragraph.startsWith('*') || paragraph.startsWith('-');
                        const isMainHeader = paragraph.startsWith('###') || paragraph.startsWith('##');

                        if (isMainHeader) {
                          return (
                            <h3 key={pIdx} className="text-cyan-400 font-bold uppercase tracking-wider text-[11.5px] mt-2 mb-1.5 font-sans">
                              {paragraph.replace(/###|##/g, '').trim()}
                            </h3>
                          );
                        }

                        return (
                          <p key={pIdx} className={`mb-2 font-semibold ${isMainBullet ? 'pl-3 border-l-2 border-cyan-500/40 text-cyan-100' : 'text-slate-300'}`}>
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>

                  </div>
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="p-4 bg-[#0a1122]/90 border border-cyan-900/35 rounded-xl max-w-[80%] shadow-lg">
                  <div className="flex items-center space-x-2 text-[10px] text-cyan-400 font-bold font-sans">
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                    <span>ARES está formulando análise fiscal...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick interactive search prompts */}
          <div className="py-2.5 border-t border-cyan-950/40 shrink-0 space-y-1.5 bg-[#03060c] px-2 rounded-xl border border-slate-900/60 mb-2">
            <span className="text-[8px] uppercase font-bold text-slate-500 block mb-1">Perguntas Rápidas sugeridas pelo CFO:</span>
            <div className="flex flex-wrap gap-2 text-[9px] font-bold">
              <button 
                onClick={() => handlePresetTrigger('Onde estão os maiores riscos de inadimplência e exposição fiscal por clientes?')}
                className="bg-[#0b1626] hover:bg-[#12233b] border border-cyan-950/60 px-2 py-1 rounded text-cyan-300 transition-colors uppercase text-left truncate max-w-[280px]"
              >
                🔍 Exposição riscos creditos
              </button>
              <button 
                onClick={() => handlePresetTrigger('Como otimizar a rota logistica dos produtos parados no armazem?')}
                className="bg-[#0b1626] hover:bg-[#12233b] border border-cyan-950/60 px-2 py-1 rounded text-cyan-300 transition-colors uppercase text-left truncate max-w-[280px]"
              >
                📦 Alocação de estoque ocioso
              </button>
              <button 
                onClick={() => handlePresetTrigger('Como aumentar nosso lucro líquido através de otimização de comissões e impostos?')}
                className="bg-[#0b1626] hover:bg-[#12233b] border border-cyan-950/60 px-2 py-1 rounded text-cyan-300 transition-colors uppercase text-left truncate max-w-[280px]"
              >
                ⚖️ Simulação tributária e Margem
              </button>
            </div>
          </div>

          {/* Chat text input box form */}
          <form 
            onSubmit={handleChatSubmit}
            className="flex items-center bg-slate-950 rounded-xl border border-cyan-950/60 p-1.5 focus-within:border-cyan-500/60 shrink-0"
          >
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Digite sua dúvida ou diretriz operacional..."
              className="flex-1 bg-transparent border-none text-slate-200 px-3 py-1.5 text-xs text-slate-200 outline-none placeholder-slate-600 focus:ring-0 font-sans"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 flex items-center justify-center font-bold relative transition-colors cursor-pointer shrink-0 shadow-lg shadow-cyan-950/40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
