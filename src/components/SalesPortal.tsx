/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Target, 
  ChevronRight, 
  X, 
  Briefcase, 
  Percent, 
  Check, 
  MapPin, 
  Mail,
  Phone,
  ArrowUpRight,
  Coins,
  ShieldCheck,
  AlertCircle,
  ShoppingCart,
  History,
  Sparkles,
  Search,
  Building,
  ChevronLeft,
  QrCode,
  FileText,
  Printer,
  Trash2,
  Lock,
  ArrowRight,
  Package,
  Clock,
  Calendar,
  Plus,
  PlusCircle,
  User,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  ArrowUp,
  Download,
  Share2,
  Copy,
  Send
} from 'lucide-react';
import { Client, Order, FinancialRecord, Seller, Product, OrderItem } from '../types';
import { AuthUser } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';

interface SalesPortalProps {
  sellers: Seller[];
  clients: Client[];
  products: Product[];
  orders: Order[];
  onAddOrder: (order: Order) => void | Promise<void>;
  financialRecords: FinancialRecord[];
  onAddClient?: (client: Client) => void | Promise<void>;
  currentUser?: AuthUser | null; // usuário logado — auto-seleciona o seller correto
}

export default function SalesPortal({
  sellers,
  clients,
  products,
  orders,
  onAddOrder,
  financialRecords,
  onAddClient,
  currentUser
}: SalesPortalProps) {
  // Se for VENDEDOR logado, encontra o seller correspondente ao auth_id
  // Se for ADMIN visualizando, usa o primeiro ativo como padrão
  const activeSellers = sellers.filter(s => s.status === 'Ativo');

  const getInitialSellerId = () => {
    if (currentUser?.role === 'VENDEDOR') {
      const match = sellers.find(s => s.id === currentUser.id);
      if (match) return match.id;
    }
    return activeSellers.length > 0 ? activeSellers[0].id : (sellers[0]?.id || '');
  };

  const [selectedSellerId, setSelectedSellerId] = useState<string>(() => getInitialSellerId());

  // Atualiza a seleção quando o estado de sellers muda (fetch assíncrono do Supabase)
  React.useEffect(() => {
    if (currentUser?.role === 'VENDEDOR' && sellers.length > 0) {
      const match = sellers.find(s => s.id === currentUser.id);
      if (match && match.id !== selectedSellerId) {
        setSelectedSellerId(match.id);
      }
    }
  }, [currentUser?.id, sellers.length]);

  // Target Seller Object
  const currentSeller = sellers.find(s => s.id === selectedSellerId) || sellers[0];

  // Portal view states: 'central' | 'dashboard' | 'history' | 'new-sale'
  const [portalMode, setPortalMode] = useState<'central' | 'dashboard' | 'history' | 'new-sale'>('central');

  // CLIENT REGISTRATION MODAL STATES
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [cnpjInput, setCnpjInput] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientSuccessMessage, setClientSuccessMessage] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // SCROLL TO TOP STATE & HANDLERS
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 200) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // SHARE STATES & HANDLERS
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareOrder, setShareOrder] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const handleSharePDF = async (order: Order) => {
    const text = `Pedido ${order.id}\nCliente: ${order.clientName}\nValor: R$ ${order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const shareUrl = `https://app.wagon.ai/pedido/${order.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pedido ${order.id} - Wagon AI`,
          text: text,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.warn('[Web Share API Error, opening fallback modal]', err);
      }
    }

    // Web Share API not available or failed -> Open fallback modal!
    setShareOrder(order);
    setIsShareModalOpen(true);
    setCopiedText(false);
  };

  // CNPJ AND PHONE MASK HELPERS
  const formatCNPJ = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`;
  };

  const formatPhone = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpjInput(formatCNPJ(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneInput(formatPhone(e.target.value));
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !cnpjInput) {
      alert('Por favor, preencha o Nome do Negócio e o CNPJ.');
      return;
    }

    setIsSavingClient(true);
    try {
      const newClient: Client = {
        id: `CLI-${Math.floor(1000 + Math.random() * 9000).toString()}`,
        name: businessName,
        cnpj: cnpjInput,
        owner: ownerInput || 'Não informado',
        phone: phoneInput || 'Não informado',
        city: cityInput || 'Não informada',
        endereco: addressInput || 'Não informado',
        email: `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'venda'}@wagon.com`,
        creditLimit: 30000,
        debtBalance: 0,
        region: 'Sudeste',
        purchaseCount: 0,
        totalSpent: 0,
        riskClass: 'A',
        status: 'Ativo',
        consignments: [],
        salesRep: currentSeller?.name || 'Vendedor',
        vendedor_id: currentSeller?.id
      };

      if (onAddClient) {
        await onAddClient(newClient);
      }

      setClientSuccessMessage(`Cliente "${businessName}" cadastrado com sucesso! Sincronizado imediatamente com a conta ADM.`);
      
      // Clear fields
      setBusinessName('');
      setCnpjInput('');
      setOwnerInput('');
      setPhoneInput('');
      setCityInput('');
      setAddressInput('');

      setTimeout(() => {
        setClientSuccessMessage(null);
        setIsClientModalOpen(false);
      }, 3000);

    } catch (error) {
      console.error(error);
      alert('Erro ao cadastrar cliente.');
    } finally {
      setIsSavingClient(false);
    }
  };

  // Currently focused order (for showing invoice/receipt modal)
  const [focusOrder, setFocusOrder] = useState<Order | null>(null);

  // Search queries
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // ----------------------------------------------------
  // INDIVIDUAL METRICS AND SALES CALCULATIONS FOR SELLER
  // ----------------------------------------------------
  const sellerClients = clients.filter(c =>
    currentSeller && (
      c.vendedor_id === currentSeller.id ||
      (!c.vendedor_id && (c.salesRep || '').trim().toLowerCase() === currentSeller.name.trim().toLowerCase())
    )
  );
  
  const activeClientsCount = sellerClients.filter(c => (c.status || 'Ativo') === 'Ativo').length;

  // Seller orders: either explicitly tagged with seller name or belonging to seller's portfolio clients
  const sellerOrders = currentSeller ? orders.filter(o =>
    o.vendedor_id === currentSeller.id ||
    (!o.vendedor_id && (o.salesRep === currentSeller.name || sellerClients.some(c => c.id === o.clientId)))
  ) : [];

  const totalSold = sellerClients.reduce((sum, c) => sum + c.totalSpent, 0);

  // Commission Metrics
  const commissionRate = currentSeller ? currentSeller.commissionRate : 5.0;
  const totalCommissionsGenerated = totalSold * (commissionRate / 100);

  // Initial Paid Seed commissions
  let initialPaid = 0;
  if (currentSeller) {
    if (currentSeller.id === 'REP-001') initialPaid = 18000;
    if (currentSeller.id === 'REP-002') initialPaid = 1200;
    if (currentSeller.id === 'REP-003') initialPaid = 5500;
  }

  // Deduct paid logs
  const ledgerPaid = currentSeller ? financialRecords
    .filter(f => f.type === 'despesa' && f.category === 'Folha Pgto' && f.partyName.trim().toLowerCase() === currentSeller.name.trim().toLowerCase() && f.status === 'Pago')
    .reduce((sum, f) => sum + f.amount, 0) : 0;

  const commissionPaid = initialPaid + ledgerPaid;
  const commissionPending = Math.max(0, totalCommissionsGenerated - commissionPaid);

  // ----------------------------------------------------
  // NEW ORDER WIZARD STATE
  // ----------------------------------------------------
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardClient, setWizardClient] = useState<Client | null>(null);
  
  // Cart item represents state of selection during checkout step
  interface CartItem {
    product: Product;
    quantity: number;
    discountPercent: number; // custom discount per SKU item
    discountType?: 'percent' | 'value';
    discountValueAmount?: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentTerm, setPaymentTerm] = useState<'Vista' | '7 Dias' | '15 Dias' | '30 Dias' | '45 Dias'>('30 Dias');
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'PIX' | 'Cartão' | 'Boleto' | 'Consignado'>('Boleto');
  const [removalProduct, setRemovalProduct] = useState<{ id: string; name: string } | null>(null);

  // Triggering new sale start
  const handleStartNewSale = () => {
    setWizardClient(null);
    setCart([]);
    setWizardStep(1);
    setPaymentTerm('30 Dias');
    setPaymentMethod('Boleto');
    setClientSearch('');
    setProductSearch('');
    setPortalMode('new-sale');
  };

  const handleDecrementQuantity = (productId: string) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    if (item.quantity > 1) {
      handleUpdateCartQuantity(productId, item.quantity - 1);
    } else {
      setRemovalProduct({ id: productId, name: item.product.name });
    }
  };

  // Add Item to cart helpers
  const handleAddCartItem = (product: Product) => {
    const exists = cart.find(item => item.product.id === product.id);
    if (exists) {
      if (exists.quantity >= product.stock) {
        alert(`Atenção: Limite máximo atingido de acordo com o estoque atual (${product.stock} ${product.unit}).`);
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      if (product.stock <= 0) {
        alert('Estoque esgotado para esse item no sistema central.');
        return;
      }
      setCart([...cart, { product, quantity: 1, discountPercent: 0, discountType: 'percent', discountValueAmount: 0 }]);
    }
  };

  const handleUpdateCartQuantity = (productId: string, val: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    
    const newQty = Math.max(1, val);
    if (newQty > item.product.stock) {
      alert(`Quantidade desejada excede o estoque físico disponível (${item.product.stock} ${item.product.unit}).`);
      return;
    }

    setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i));
  };

  const handleUpdateCartDiscount = (productId: string, val: number) => {
    const rawVal = Math.max(0, val);
    setCart(cart.map(i => i.product.id === productId ? { ...i, discountPercent: rawVal } : i));
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(cart.filter(i => i.product.id !== productId));
  };

  // Advanced subtotal logic
  const calculateCartTotals = () => {
    // subtotal before discounts
    const rawSubtotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
    
    // total after distinct margins and item-wise discounts
    const totalAfterDiscounts = cart.reduce((sum, item) => {
      const originalItemTotal = item.product.sellingPrice * item.quantity;
      let discountAmount = 0;
      if (item.discountType === 'value' && item.discountValueAmount !== undefined) {
        discountAmount = Math.min(originalItemTotal, item.discountValueAmount);
      } else {
        discountAmount = originalItemTotal * (item.discountPercent / 100);
      }
      return sum + (originalItemTotal - discountAmount);
    }, 0);

    const discountSum = rawSubtotal - totalAfterDiscounts;

    // Fixed legal tax calculation (ICMS 18%, IPI 5%, PIS/COFINS 9.25%)
    const icms = totalAfterDiscounts * 0.18;
    const ipi = totalAfterDiscounts * 0.05;
    const pisCofins = totalAfterDiscounts * 0.0925;
    const taxTotal = icms + ipi + pisCofins;

    const grandTotal = totalAfterDiscounts; // Note: In this distribution, taxes are styled as included or calculated over subtotal
    
    return {
      subtotal: rawSubtotal,
      discountTotal: discountSum,
      taxes: {
        icms,
        ipi,
        pisCofins,
        total: taxTotal
      },
      total: grandTotal,
      marginPercent: 32 // Simulated representative gross margin
    };
  };

  const cartTotals = calculateCartTotals();

  // Placing the actual order synchronously
  const handleConfirmOrder = async () => {
    if (!wizardClient) return;
    if (cart.length === 0) return;

    // Convert wizard cart to system order details
    const orderItems: OrderItem[] = cart.map(item => {
      const originalTotal = item.product.sellingPrice * item.quantity;
      let discount = 0;
      if (item.discountType === 'value' && item.discountValueAmount !== undefined) {
        discount = Math.min(originalTotal, item.discountValueAmount);
      } else {
        discount = originalTotal * (item.discountPercent / 100);
      }
      return {
        id: `Item-${Math.floor(1000 + Math.random() * 9000).toString()}`,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        total: originalTotal - discount
      };
    });

    const generatedUuid = crypto.randomUUID();
    const generatedId = `PED-${Date.now().toString(36).toUpperCase()}-${generatedUuid.slice(0, 6).toUpperCase()}`;

    const newOrder: Order = {
      id: generatedId,
      uuid: generatedUuid,
      pdfUrl: `https://app.wagon.ai/pedido/${generatedId}/pdf`,
      clientId: wizardClient.id,
      clientName: wizardClient.name,
      date: new Date().toISOString().split('T')[0],
      items: orderItems,
      subtotal: cartTotals.subtotal,
      taxes: {
        icms: cartTotals.taxes.icms,
        ipi: cartTotals.taxes.ipi,
        pisCofins: cartTotals.taxes.pisCofins,
        total: cartTotals.taxes.total
      },
      total: cartTotals.total,
      marginPercent: cartTotals.marginPercent,
      status: 'Aguardando Faturamento',
      paymentTerm: paymentTerm,
      salesRep: currentSeller?.name,
      vendedor_id: currentSeller?.id
    };

    // Commit through the existing global flow. In Supabase this is transactional.
    setIsCreatingOrder(true);
    try {
      await onAddOrder(newOrder);
    } catch (error: any) {
      alert(error?.message || 'Não foi possível concluir o pedido.');
      return;
    } finally {
      setIsCreatingOrder(false);
    }

    // Auto-generate and cache PDF Base64 string directly on order creation
    generateInvoicePDF(newOrder, clients, products, { isDownload: false }).then(doc => {
      try {
        const dataUri = doc.output('datauristring');
        const updatedOrder = { ...newOrder, pdfUrl: dataUri };
        
        // Update both focus target and persistent storage
        setFocusOrder(updatedOrder);
        const cachedOrders = localStorage.getItem('vertice_erp_orders');
        if (cachedOrders) {
          const allOrders: Order[] = JSON.parse(cachedOrders);
          const index = allOrders.findIndex(o => o.id === newOrder.id);
          if (index !== -1) {
            allOrders[index].pdfUrl = dataUri;
            localStorage.setItem('vertice_erp_orders', JSON.stringify(allOrders));
          }
        }
      } catch (err) {
        console.error('Error auto-generating PDF on order confirmation:', err);
      }
    });

    // Zoom into invoice/receipt
    setFocusOrder(newOrder);

    // Reset wizard and redirect to history
    setPortalMode('history');
    setWizardStep(1);
    setWizardClient(null);
    setCart([]);
  };

  // Filter clients representing target seller's designated grid
  const filteredClientsForWizard = sellerClients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.cnpj.includes(clientSearch)
  );

  const filteredProductsForWizard = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Dynamic invoice URL for QR code
  const getReceiptURL = (orderId: string) => {
    return `https://app.wagon.ai/pedido/${orderId}`;
  };

  return (
    <div className="h-full min-h-0 w-full bg-[#111827] text-slate-100 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans">
      
      {/* Top Professional Portal branding header */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center justify-center text-white">
            <Sparkles className="h-5.5 w-5.5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              PORTAL DE VENDAS <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-500/20 tracking-widest">Atendimento Externo</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">Sincronização Ativa com Central corporativa</p>
          </div>
        </div>

        {/* Seletor de identidade — só visível para ADMIN */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Selector para ADMIN: pode trocar entre vendedores */}
          {(!currentUser || currentUser.role === 'ADMIN') && (
            <div className="bg-slate-950/80 p-2 py-1.5 rounded-xl border border-slate-800/80 flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-extrabold text-[9px] uppercase tracking-wider block">Agente Comercial:</span>
              <select
                value={selectedSellerId}
                onChange={(e) => {
                  setSelectedSellerId(e.target.value);
                  setPortalMode('central');
                }}
                className="bg-slate-900 text-emerald-400 font-bold focus:outline-none cursor-pointer text-xs pr-1"
              >
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id.substring(0, 8)}...) {s.status === 'Inativo' ? ' - Licenciado' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Badge de identidade fixa para VENDEDOR — sem opção de troca */}
          {currentUser?.role === 'VENDEDOR' && (
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-emerald-800/40 flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">Agente:</span>
              <span className="text-emerald-400 font-bold">{currentSeller?.name || currentUser.name}</span>
            </div>
          )}

          {/* Quick simulation banner */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-800 px-3 py-1.5 rounded-lg text-slate-400 text-[10px]">
            <Lock className="h-3 w-3 text-slate-500" />
            <span>Perfil: Representante Comercial</span>
          </div>

        </div>
      </div>

      {/* Navigation tabs row exclusive style */}
      {portalMode !== 'central' && (
        <div className="shrink-0 bg-slate-900/60 px-4 sm:px-6 py-3 border-b border-slate-800/45 flex flex-wrap justify-between items-center gap-3">
          
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setPortalMode('central')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-extrabold mr-2 hover:text-white transition-all cursor-pointer text-[10.5px]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Voltar à Central</span>
            </button>

            <button
              onClick={() => setPortalMode('dashboard')}
              className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                portalMode === 'dashboard'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Acompanhamento Geral
            </button>
            
            <button
              onClick={() => setPortalMode('history')}
              className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                portalMode === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Histórico de Faturamentos ({sellerOrders.length})
            </button>
          </div>

          {/* Dynamic primary trigger */}
          <button
            onClick={handleStartNewSale}
            className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/10 transform transition-all cursor-pointer hover:scale-102 active:scale-97"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Faturar Nova Venda</span>
          </button>

        </div>
      )}

      {/* Main active portal page area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="mobile-scroll min-h-0 flex-1 p-4 sm:p-6 overflow-y-auto relative scroll-smooth"
      >
        
        <AnimatePresence mode="wait">

          {/* CENTRAL OPERACIONAL DE VENDAS */}
          {portalMode === 'central' && (
            <motion.div
              key="central"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center max-w-4xl mx-auto py-8 px-4"
            >
              <div className="text-center max-w-xl space-y-2 mb-10">
                <span className="inline-flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span>Sincronização Ativa</span>
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Central de Operações Comerciais</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gerencie sua carteira de estabelecimentos e lance novos pedidos de faturamento para distribuição nacional em poucos segundos.
                </p>
              </div>

              {/* TWO main action cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                
                {/* CARD 1: Cadastrar Novo Cliente */}
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="group bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700/80 p-8 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between space-y-6 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer shadow-xl h-full min-h-[220px]"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-all">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                        ➕ Cadastrar Novo Cliente
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        Cadastrar um novo estabelecimento na carteira comercial.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-sky-400 font-extrabold uppercase tracking-wider group-hover:translate-x-1 transition-all pt-2">
                    <span>Cadastrar agora</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>

                {/* CARD 2: Registrar Nova Venda */}
                <button
                  type="button"
                  onClick={handleStartNewSale}
                  className="group bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700/80 p-8 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between space-y-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer shadow-xl h-full min-h-[220px]"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg group-hover:scale-105 transition-all">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                        🤝 Registrar Nova Venda
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        Selecione o estabelecimento, monte o carrinho e fature em tempo real.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-extrabold uppercase tracking-wider group-hover:translate-x-1 transition-all pt-2">
                    <span>Registrar venda</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>

              </div>

              {/* SECONDARY DASHBOARD NAVIGATION SWITCH */}
              <div className="mt-12 flex flex-col items-center space-y-2">
                <button
                  type="button"
                  onClick={() => setPortalMode('dashboard')}
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-7 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-slate-950/20 active:scale-97"
                >
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Acessar Meu Dashboard</span>
                </button>
                <span className="text-[10.5px] text-slate-500 font-bold">Faturamento, comissões pendentes e carteira ativa</span>
              </div>

            </motion.div>
          )}
          
          {/* DASHBOARD MODE */}
          {portalMode === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              
              {/* Profile card summary info */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-slate-800/10 rounded-full blur-3xl"></div>
                
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                    <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Painel Pessoal Ativo</span>
                  </div>
                  <h2 className="text-2xl font-black text-white leading-none">Boas-vindas, {currentSeller?.name}!</h2>
                  <p className="text-xs text-slate-400 max-w-lg">
                    Monitore sua comissão líquida, consulte clientes e gere pedidos diretamente no smartphone ou notebook. Todas as movimentações alteram o faturamento da central em tempo real.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 py-3 border border-slate-800 rounded-xl relative z-10 flex items-center space-x-4">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-black">
                    {commissionRate}%
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Comissão Pessoal</span>
                    <strong className="text-sm font-black text-white">Acordo Comercial de Distribuição</strong>
                  </div>
                </div>
              </div>

              {/* Meta de Vendas Pessoal */}
              {currentSeller && (
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#1E94CF] uppercase font-black tracking-wider block">Meta de Vendas Estipulada</span>
                      <p className="text-xs text-slate-400">
                        Seu progresso de faturamento em relação à meta definida pela gerência para este ciclo.
                      </p>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] uppercase font-semibold text-slate-500 block">Progresso Realizado</span>
                      <div className="flex items-baseline space-x-1 sm:justify-end">
                        <strong className="text-emerald-400 font-mono font-black text-sm">
                          R$ {totalSold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                        <span className="text-slate-500 font-semibold text-[10px]">/</span>
                        <strong className="text-white font-mono font-black text-sm">
                          R$ {(currentSeller.target || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 z-10 relative">
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          (totalSold / (currentSeller.target || 1)) * 100 >= 100 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : 'bg-gradient-to-r from-[#1E94CF] to-indigo-500'
                        }`}
                        style={{ width: `${Math.min((totalSold / (currentSeller.target || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-black">
                      <span>0%</span>
                      <span className="text-[#1E94CF] uppercase tracking-wide">
                        {((totalSold / (currentSeller.target || 1)) * 100).toFixed(1)}% Alcançado
                      </span>
                      <span>100%+</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FIVE SPECIFIC MANDATED BULLET STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. Total vendido */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden group">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Vendido</span>
                  <strong className="text-xl font-black block text-emerald-400 mt-2">
                    R$ {totalSold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  <div className="text-[10px] text-slate-400 font-semibold mt-2.5 pt-2 border-t border-slate-800">
                    Acumulado de carteira ativa
                  </div>
                </div>

                {/* 2. Comissão paga */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden group">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Comissão Recebida</span>
                  <strong className="text-xl font-black block text-indigo-400 mt-2">
                    R$ {commissionPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  <div className="text-[10px] text-slate-400 font-semibold mt-2.5 pt-2 border-t border-slate-800">
                    Saldos liquidados na folha
                  </div>
                </div>

                {/* 3. Comissão pendente */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden group">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Comissão Pendente</span>
                  <strong className={`text-xl font-black block mt-2 ${commissionPending > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    R$ {commissionPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  <div className="text-[10px] text-slate-400 font-semibold mt-2.5 pt-2 border-t border-slate-800">
                    Aguardando liquidação do ERP
                  </div>
                </div>

                {/* 4. Clientes ativos */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden group">
                  <span className="text-[10px] uppercase font-bold text-slate-405 block tracking-wider">Clientes Ativos</span>
                  <strong className="text-xl font-black block text-white mt-2">
                    {activeClientsCount} estabelecimentos
                  </strong>
                  <div className="text-[10px] text-slate-400 font-semibold mt-2.5 pt-2 border-t border-slate-800">
                    Em um portfólio de {sellerClients.length} contatos
                  </div>
                </div>

                {/* 5. Quantidade de pedidos */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden group">
                  <span className="text-[10px] uppercase font-bold text-slate-405 block tracking-wider">Quantidade de Pedidos</span>
                  <strong className="text-xl font-black block text-white mt-2">
                    {sellerOrders.length} faturamentos
                  </strong>
                  <div className="text-[10px] text-slate-400 font-semibold mt-2.5 pt-2 border-t border-slate-800">
                    Registrados no canal de vendas
                  </div>
                </div>

              </div>

              {/* Bento Box showcasing assigned portfolio clients */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Minha Carteira Exclusiva de Clientes</h3>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded border border-emerald-500/20">
                    {sellerClients.length} contatos autorizados
                  </span>
                </div>

                {sellerClients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerClients.map((client) => {
                      const isCliActive = (client.status || 'Ativo') === 'Ativo';
                      return (
                        <div key={client.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-slate-100 font-bold block truncate max-w-[190px] text-xs">
                                {client.name}
                              </strong>
                              <span className="font-mono text-[9px] text-slate-500 block mt-0.5">{client.cnpj}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isCliActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {client.status || 'Ativo'}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-semibold mt-3 flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-650" />
                            <span>{client.city || 'São Paulo'} ({client.region})</span>
                          </div>

                          <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-500">Saldo Faturado:</span>
                            <strong className="text-emerald-400 font-black">R$ {client.totalSpent.toLocaleString('pt-BR')}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 font-semibold">
                    <span>Você não possui estabelecimentos atribuídos a sua carteira corporativa. Entre em contato com o D.O. para solicitar atribuições.</span>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* REGISTER SALES WIZARD (NEW SALE STEP BY STEP FLOW) */}
          {portalMode === 'new-sale' && (
            <motion.div
              key="new-sale"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative max-w-4xl mx-auto"
            >
              
              {/* Wizard progress header bar layout */}
              <div className="flex justify-between items-center pb-5 border-b border-slate-800 gap-4">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Wizard Automatizado de Faturamento</h3>
                </div>

                <button
                  onClick={() => setPortalMode('dashboard')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-transform scale-100 hover:scale-102 active:scale-95 cursor-pointer"
                >
                  Sair do Wizard
                </button>
              </div>

              {/* Progress Indicator Dots */}
              <div className="flex items-center justify-between max-w-xl mx-auto text-[10px] font-bold text-slate-500 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                <div className={`flex items-center space-x-1.5 ${wizardStep >= 1 ? 'text-emerald-400' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black ${wizardStep >= 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'}`}>1</span>
                  <span>Cliente</span>
                </div>
                <div className="h-px bg-slate-850 flex-1 mx-2"></div>
                <div className={`flex items-center space-x-1.5 ${wizardStep >= 2 ? 'text-emerald-400' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black ${wizardStep >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'}`}>2</span>
                  <span>Produtos</span>
                </div>
                <div className="h-px bg-slate-850 flex-1 mx-2"></div>
                <div className={`flex items-center space-x-1.5 ${wizardStep >= 3 ? 'text-emerald-400' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black ${wizardStep >= 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'}`}>3 & 4</span>
                  <span>Qtd & Descontos</span>
                </div>
                <div className="h-px bg-slate-850 flex-1 mx-2"></div>
                <div className={`flex items-center space-x-1.5 ${wizardStep >= 5 ? 'text-emerald-400' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black ${wizardStep >= 5 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'}`}>5 & 6</span>
                  <span>Revisão & Confirmar</span>
                </div>
              </div>

              {/* STEP 1: SELECT CLIENT */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Passo 1: Selecionar o Estabelecimento Comercial</h4>
                    <p className="text-[10px] text-slate-405 font-semibold">Escolha um dos clientes autorizados na sua carteira corporativa</p>
                  </div>

                  {/* Search query field */}
                  <div className="relative text-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Filtrar por razão social, sigla ou CNPJ do contato..."
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Client Selector Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {filteredClientsForWizard.map((client) => {
                      const isSelected = wizardClient?.id === client.id;
                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => setWizardClient(client)}
                          className={`p-3.5 rounded-xl border text-left transition-all relative ${
                            isSelected 
                              ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500 text-white' 
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-xs block truncate pr-3">{client.name}</span>
                            {isSelected && (
                              <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          
                          <span className="font-mono text-[9px] text-slate-500 block mt-1">{client.cnpj}</span>
                          
                          <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400">
                            <span>{client.city} ({client.region})</span>
                            <span className="font-semibold block">Risco: <strong className="text-slate-300">{client.riskClass}</strong></span>
                          </div>
                        </button>
                      );
                    })}

                    {filteredClientsForWizard.length === 0 && (
                      <p className="p-8 text-center text-slate-500 font-semibold col-span-2">
                        Nenhum estabelecimento comercial encontrado com este termo.
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex justify-between">
                    <div></div>
                    <button
                      type="button"
                      disabled={!wizardClient}
                      onClick={() => setWizardStep(2)}
                      className="flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      <span>Escolher Produtos</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CHOOSE PRODUCTS */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  
                  <div className="flex justify-between items-start flex-col sm:flex-row sm:items-center gap-2">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Passo 2: Escolher itens do carrinho faturável</h4>
                      <p className="text-[10px] text-slate-405 font-semibold">Cliente: <strong className="text-emerald-400">{wizardClient?.name}</strong></p>
                    </div>

                    <div className="bg-slate-950/60 px-3 py-1.5 border border-slate-800 rounded-lg text-[10.5px]">
                      Itens selecionados: <strong className="text-white font-bold">{cart.length} SKUs</strong>
                    </div>
                  </div>

                  {/* Search query field */}
                  <div className="relative text-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Localizar produto por nome, marca ou categoria da gondola..."
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Products Grid selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {filteredProductsForWizard.map((product) => {
                      const itemInCart = cart.find(i => i.product.id === product.id);
                      const isOutOfStock = product.stock <= 0;
                      
                      return (
                        <div
                          key={product.id}
                          className={`p-3.5 rounded-xl border flex justify-between items-center gap-3 ${
                            itemInCart 
                              ? 'bg-emerald-500/5 border-emerald-500/60 text-white' 
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <span className="font-extrabold text-xs block text-slate-200 truncate">{product.name}</span>
                            <span className="font-mono text-[9px] text-slate-500 block">SKU: {product.sku} • {product.category}</span>
                            
                            <div className="flex items-center space-x-3 text-[10px] text-slate-450 mt-1">
                              <span>Unitário: <strong className="text-emerald-400 font-bold">R$ {product.sellingPrice.toLocaleString('pt-BR')}</strong></span>
                              <span>Estoque: <strong className={isOutOfStock ? 'text-rose-500' : 'text-slate-350'}>{product.stock} {product.unit}</strong></span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isOutOfStock ? (
                              <span className="bg-rose-500/10 text-rose-450 border border-rose-500/20 text-[9px] font-black uppercase px-2 py-1 rounded">Sem Estoque</span>
                            ) : itemInCart ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleDecrementQuantity(product.id)}
                                  className="w-7 h-7 bg-slate-800 hover:bg-slate-755 text-slate-300 hover:text-white rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs font-black text-white w-6 text-center">
                                  {itemInCart.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddCartItem(product)}
                                  className="w-7 h-7 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddCartItem(product)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[10px] transition-all cursor-pointer uppercase tracking-tight"
                              >
                                Adicionar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredProductsForWizard.length === 0 && (
                      <p className="p-8 text-center text-slate-500 font-semibold col-span-2">
                        Nenhum produto cadastrado coincide com esse termo.
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Voltar ao Cliente</span>
                    </button>
                    
                    <button
                      type="button"
                      disabled={cart.length === 0}
                      onClick={() => setWizardStep(3)}
                      className="flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      <span>Ajustar Quantidades & Descontos</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              )}

              {/* STEP 3 & 4: ADAPT QUANTITIES AND CUSTOM DISCOUNTS */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Passos 3 & 4: Definir Volumes & Aplicar Descontos por SKU</h4>
                    <p className="text-[10px] text-slate-405 font-semibold">Inspecione o limite de desconto individual por item ou mude a quantidade abaixo</p>
                  </div>

                  {/* Cart review table */}
                  <div className="mobile-scroll border border-slate-800/80 rounded-xl overflow-x-auto bg-slate-950/20">
                    <table className="w-full min-w-[900px] text-left font-sans text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-[9.5px] uppercase font-black text-slate-500">
                        <tr>
                          <th className="p-3">Item / SKU</th>
                          <th className="p-3 text-center">Quantidade</th>
                          <th className="p-3 text-center">Desconto (% ou R$)</th>
                          <th className="p-3 text-right">Preço de Tabela</th>
                          <th className="p-3 text-right">Total Faturado</th>
                          <th className="p-3 text-center">Excluir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-medium text-slate-300">
                        {cart.map((item) => {
                          const originalItemTotal = item.product.sellingPrice * item.quantity;
                          let discountAmount = 0;
                          if (item.discountType === 'value' && item.discountValueAmount !== undefined) {
                            discountAmount = Math.min(originalItemTotal, item.discountValueAmount);
                          } else {
                            discountAmount = originalItemTotal * (item.discountPercent / 100);
                          }
                          const cleanItemTotal = originalItemTotal - discountAmount;
                          
                          return (
                            <tr key={item.product.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="p-3">
                                <span className="font-bold text-slate-100 block">{item.product.name}</span>
                                <span className="font-mono text-[9px] text-slate-500 block">Estoque: {item.product.stock} {item.product.unit} disponível</span>
                              </td>
                              
                              {/* Quantity slider/numeric */}
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDecrementQuantity(item.product.id)}
                                    className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded-lg flex items-center justify-center font-bold font-mono text-slate-300 cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateCartQuantity(item.product.id, Number(e.target.value))}
                                    className="w-12 bg-slate-950 border border-slate-800 text-center rounded-lg p-1.5 font-bold text-white focus:outline-none"
                                  />
 
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQuantity(item.product.id, item.quantity + 1)}
                                    className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded-lg flex items-center justify-center font-bold font-mono text-slate-300 cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
 
                              {/* Discount Percentage or fixed select slider */}
                              <td className="p-3">
                                <div className="flex flex-col items-center space-y-1.5 justify-center max-w-[210px] mx-auto">
                                  <div className="flex items-center bg-slate-950 p-1 rounded-md border border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCart(cart.map(i => i.product.id === item.product.id ? { ...i, discountType: 'percent' } : i));
                                      }}
                                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        (item.discountType || 'percent') === 'percent'
                                          ? 'bg-emerald-500 text-slate-950 font-black'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      % Porc.
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCart(cart.map(i => i.product.id === item.product.id ? { ...i, discountType: 'value' } : i));
                                      }}
                                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        item.discountType === 'value'
                                          ? 'bg-emerald-500 text-slate-950 font-black'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      R$ Valor
                                    </button>
                                  </div>
                                  
                                  <div className="flex flex-col items-center">
                                    {(item.discountType || 'percent') === 'percent' ? (
                                      <div className="space-y-1.5 flex flex-col items-center">
                                        <div className="flex items-center space-x-1.5">
                                          <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={Math.min(100, item.discountPercent)}
                                            onChange={(e) => handleUpdateCartDiscount(item.product.id, Number(e.target.value))}
                                            className="w-24 accent-emerald-500 cursor-pointer text-xs"
                                          />
                                          <span className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-bold shrink-0">
                                            {item.discountPercent}%
                                          </span>
                                        </div>
                                        
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">ou digite o desconto</span>
                                        
                                        <input
                                          type="number"
                                          min="0"
                                          max="150"
                                          value={item.discountPercent}
                                          onChange={(e) => handleUpdateCartDiscount(item.product.id, Number(e.target.value))}
                                          placeholder="0"
                                          className={`w-20 bg-slate-950 border text-center rounded p-1 text-[11px] font-mono font-bold focus:outline-none ${
                                            item.discountPercent > 100 
                                              ? 'border-rose-500 text-rose-550 focus:ring-1 focus:ring-rose-500' 
                                              : 'border-slate-800 text-slate-200 focus:ring-1 focus:ring-emerald-500'
                                          }`}
                                        />

                                        {item.discountPercent > 100 && (
                                          <span className="text-[9px] text-rose-500 font-black leading-tight text-center max-w-[130px] block animate-pulse mt-0.5">
                                            O desconto máximo permitido é 100%.
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1 mt-1">
                                        <span className="text-slate-500 text-[10px]">R$</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max={originalItemTotal}
                                          value={item.discountValueAmount || 0}
                                          onChange={(e) => {
                                            const val = Math.max(0, Math.min(originalItemTotal, Number(e.target.value)));
                                            setCart(cart.map(i => i.product.id === item.product.id ? { ...i, discountValueAmount: val } : i));
                                          }}
                                          className="w-20 bg-slate-100 text-slate-950 font-mono font-black text-center rounded p-1 text-[10.5px] focus:outline-none"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 text-right text-slate-450 font-mono">
                                R$ {item.product.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3 text-right text-emerald-400 font-bold font-mono">
                                R$ {cleanItemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCartItem(item.product.id)}
                                  className="p-1.5 hover:bg-rose-500/10 hover:text-rose-450 rounded text-slate-500 transition-colors cursor-pointer"
                                  title="Remover item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment methods and term */}
                    <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">Forma de Pagamento</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Dinheiro', 'PIX', 'Cartão', 'Boleto', 'Consignado'] as const).map((method) => {
                            const isSel = paymentMethod === method;
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`p-2 text-center rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-slate-205'
                                }`}
                              >
                                {method}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {paymentMethod === 'Boleto' ? (
                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">Prazo de Pagamento Acordado</label>
                          <select
                            value={paymentTerm}
                            onChange={(e) => setPaymentTerm(e.target.value as any)}
                            className="bg-slate-900 border border-slate-805 text-emerald-400 font-bold text-xs p-2 rounded-lg w-full focus:outline-none cursor-pointer"
                          >
                            <option value="Vista">À Vista (Boleto antecipado)</option>
                            <option value="7 Dias">Boleto - 7 Dias diretos</option>
                            <option value="15 Dias">Boleto - 15 Dias</option>
                            <option value="30 Dias">Boleto - 30 Dias (Standard)</option>
                            <option value="45 Dias">Boleto - 45 Dias (BNDES)</option>
                          </select>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[10px] text-slate-450 font-medium">
                          Modalidade: <strong className="text-emerald-400">{paymentMethod}</strong> (Prazo de compensação padrão de 24h).
                        </div>
                      )}
                    </div>

                    {/* Real-time totals summary */}
                    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3.5 shadow-xl">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Resumo do Pedido em Tempo Real</span>
                      
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Subtotal Bruto:</span>
                        <strong className="font-mono text-slate-205">
                          R$ {cartTotals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-xs text-rose-450">
                        <span>Descontos Aplicados:</span>
                        <strong className="font-mono">
                          - R$ {cartTotals.discountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      {cartTotals.discountTotal > 0 && (
                        <div className="bg-emerald-550/5 border border-emerald-500/10 p-2.5 rounded-xl text-[10px] text-emerald-400 font-extrabold flex items-center space-x-1.5 leading-tight">
                          <span>ℹ️ Economia agregada: R$ {cartTotals.discountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({((cartTotals.discountTotal / (cartTotals.subtotal || 1)) * 100).toFixed(0)}% de desconto médio)</span>
                        </div>
                      )}

                      <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Total Final:</span>
                        <strong className="text-lg font-black font-mono text-emerald-400 leading-none">
                          R$ {cartTotals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {cart.some(i => i.discountPercent > 100) && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl text-center text-rose-450 text-xs font-black uppercase tracking-tight flex items-center justify-center space-x-2 animate-pulse">
                      <span>⚠️ O desconto máximo permitido é 100%.</span>
                    </div>
                  )}

                  <div className="pt-5 border-t border-slate-800/80 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Voltar aos Itens</span>
                    </button>
                    
                    <button
                      type="button"
                      disabled={cart.length === 0 || cart.some(i => i.discountPercent > 100)}
                      onClick={() => setWizardStep(5)}
                      className="flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      <span>Revisar e Concluir Venda</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              )}

              {/* STEP 5: REVIEW AND CONFIRM DEALS */}
              {wizardStep === 5 && (
                <div className="space-y-6">
                  
                  {/* Top Header */}
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <ShieldCheck className="h-4.5 w-4.5 animate-pulse" />
                        <h4 className="text-xs font-black tracking-widest uppercase text-white">Revisão do Pedido • Faturamento Seguro</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Checkout de alta fidelidade. Confirme todos os dados fiscais e financeiros abaixo.</p>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg flex items-center space-x-2 font-black text-[10px] text-emerald-400 font-mono">
                      <span>✓ PRONTO PARA EMISSÃO</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left & Middle Column (Details) */}
                    <div className="lg:col-span-2 space-y-5">
                      
                      {/* CLIENTE DETAILS */}
                      <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
                        <div className="flex items-center space-x-2 text-slate-350 border-b border-slate-850 pb-2.5">
                          <User className="h-4 w-4 text-sky-450" />
                          <h5 className="text-[10.5px] uppercase font-black tracking-wider text-slate-205">Informações do Cliente</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-400">
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">Razão Social / Nome</span>
                            <strong className="text-white text-sm font-black">{wizardClient?.name}</strong>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">CNPJ</span>
                            <span className="font-mono text-slate-200 font-bold bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[10.5px]">
                              {wizardClient?.cnpj}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">Cidade / Endereço</span>
                            <p className="text-slate-200 font-bold">
                              {wizardClient?.city || 'Não informada'} {wizardClient?.endereco ? `• ${wizardClient.endereco}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PRODUTOS LIST / CADERNO */}
                      <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-3">
                        <div className="flex items-center space-x-2 text-slate-350 border-b border-slate-850 pb-2.5">
                          <ShoppingBag className="h-4 w-4 text-emerald-455" />
                          <h5 className="text-[10.5px] uppercase font-black tracking-wider text-slate-205">Itens Selecionados ({cart.length} SKUs)</h5>
                        </div>

                        <div className="overflow-x-auto p-0.5">
                          <table className="w-full text-left font-sans text-xs">
                            <thead className="bg-slate-900 border-b border-slate-800 text-[9px] uppercase font-bold text-slate-500">
                              <tr>
                                <th className="p-2.5">Produto</th>
                                <th className="p-2.5 text-center">Quantidade</th>
                                <th className="p-2.5 text-right">Valor Unitário</th>
                                <th className="p-2.5 text-right">Subtotal faturado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 font-semibold text-slate-300">
                              {cart.map((item) => {
                                const originalItemTotal = item.product.sellingPrice * item.quantity;
                                let itemDiscount = 0;
                                if (item.discountType === 'value' && item.discountValueAmount !== undefined) {
                                  itemDiscount = Math.min(originalItemTotal, item.discountValueAmount);
                                } else {
                                  itemDiscount = originalItemTotal * (item.discountPercent / 100);
                                }
                                const cleanItemTotal = originalItemTotal - itemDiscount;

                                return (
                                  <tr key={item.product.id} className="hover:bg-slate-900/40 transition-colors">
                                    <td className="p-2.5">
                                      <span className="font-extrabold text-slate-200 block">{item.product.name}</span>
                                      {item.discountPercent > 0 && (
                                        <span className="text-[9px] text-emerald-400 font-black">
                                          🏷️ Desconto de {item.discountPercent}% concedido neste item.
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-bold text-white">
                                      {item.quantity} {item.product.unit}
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-slate-400">
                                      R$ {item.product.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-emerald-400 font-extrabold">
                                      R$ {cleanItemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* PAYMENT OPTIONS REVIEW */}
                      <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
                        <div className="flex items-center space-x-2 text-slate-350 border-b border-slate-850 pb-2.5">
                          <CreditCard className="h-4 w-4 text-sky-455" />
                          <h5 className="text-[10.5px] uppercase font-black tracking-wider text-slate-205">Forma & Condição de Pagamento</h5>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 bg-slate-900 duration-200 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
                            <span className="text-xl">💳</span>
                            <div>
                              <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Forma Definida</span>
                              <strong className="text-white text-xs font-black uppercase tracking-wider">{paymentMethod}</strong>
                            </div>
                          </div>
                          
                          {paymentMethod === 'Boleto' ? (
                            <div className="flex-1 bg-slate-900 duration-200 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
                              <span className="text-xl">📅</span>
                              <div>
                                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Prazo de Cobrança</span>
                                <strong className="text-emerald-400 text-xs font-black">{paymentTerm}</strong>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 bg-slate-900 duration-200 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
                              <span className="text-xl">⚡</span>
                              <div>
                                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Compensação de Cobrança</span>
                                <strong className="text-slate-300 text-xs font-black">À Vista / Imediata</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right Hand Column (Financial Review & Confirm button) */}
                    <div className="space-y-5">
                      
                      {/* RESUMO FINANCEIRO */}
                      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block pb-2.5 border-b border-slate-800">
                          Resumo Financeiro Consolidado
                        </span>

                        <div className="space-y-3.5 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Subtotal Bruto:</span>
                            <span className="font-mono text-slate-205 font-bold">
                              R$ {cartTotals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex justify-between text-rose-450">
                            <span>Total Desconto:</span>
                            <span className="font-mono font-bold">
                              - R$ {cartTotals.discountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-850/50 space-y-2 text-[10px] text-slate-405 leading-none">
                            <div className="flex justify-between">
                              <span>Provisão ICMS (18%):</span>
                              <span className="font-mono">R$ {cartTotals.taxes.icms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Provisão IPI (5%):</span>
                              <span className="font-mono">R$ {cartTotals.taxes.ipi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Estimado Impostos Integrados:</span>
                              <span className="font-mono text-slate-355">R$ {cartTotals.taxes.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>

                          <div className="pt-3.5 border-t border-slate-800 flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-inner">
                            <strong className="text-[11px] uppercase text-white font-bold tracking-wider">Líquido Final:</strong>
                            <strong className="text-lg text-emerald-400 font-extrabold font-mono leading-none">
                              R$ {cartTotals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* CONFIRMAÇÃO DE DESCONTO */}
                      {cartTotals.discountTotal > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4.5 rounded-2xl text-xs space-y-2.5">
                          <div className="flex items-center space-x-2 text-amber-500">
                            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                            <strong className="uppercase font-black text-[10px] tracking-wider">Aviso de Bonificação Ativa</strong>
                          </div>

                          <p className="text-[11.5px] text-slate-300 leading-normal">
                            ⚠️ Desconto médio aplicado: <strong className="text-amber-400 font-extrabold">{Math.round((cartTotals.discountTotal / (cartTotals.subtotal || 1)) * 100)}%</strong>
                          </p>

                          <div className="text-[10px] text-slate-400 space-y-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850/50 font-semibold font-mono">
                            <div className="flex justify-between">
                              <span>Valor original:</span>
                              <span>R$ {cartTotals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-emerald-400">
                              <span>Valor final:</span>
                              <span className="font-extrabold">R$ {cartTotals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-amber-400">
                              <span>Economia concedida:</span>
                              <span className="font-extrabold">R$ {cartTotals.discountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FINAL CONFIRMATION BLOCK */}
                      <div className="bg-slate-950/70 p-5 rounded-2xl border border-sky-500/25 space-y-4 shadow-2xl relative overflow-hidden">
                        
                        <div className="space-y-1.5 relative z-10">
                          <span className="text-[9px] uppercase font-black tracking-widest text-sky-400 font-mono block">AVALIAÇÃO DE CREDIBILIDADE</span>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Confirmar Pedido?</h4>
                          <p className="text-[10px] text-slate-450 leading-normal">Faturamentos de estoque e crédito do cliente serão validados na mesa nacional.</p>
                        </div>

                        <div className="flex space-x-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setWizardStep(3)}
                            className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Voltar
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleConfirmOrder}
                            disabled={isCreatingOrder}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-450 disabled:opacity-60 disabled:cursor-wait text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-550/15 cursor-pointer text-center flex items-center justify-center space-x-1.5"
                          >
                            <Check className="h-4.5 w-4.5" />
                            <span>{isCreatingOrder ? 'Processando...' : 'Confirmar'}</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </motion.div>
          )}

          {/* PORTAL HISTORIC LIST VIEW SCREEN */}
          {portalMode === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-4 px-0.5 w-4 text-emerald-450" />
                    <span>Carteira de Pedidos e Notas Digitais</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Examine notas fiscais eletrônicas, re-imprima cupons de venda ou acompanhe entregas com geolocalização do ERP.</p>
                </div>

                {/* Sub-search field */}
                <div className="relative text-xs w-full max-w-xs">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Filtrar pedidos por cliente..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[11px] text-slate-200 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* History elegant list rendering */}
              <div className="grid grid-cols-1 gap-3">
                {sellerOrders
                  .filter(o => o.clientName.toLowerCase().includes(historySearch.toLowerCase()))
                  .map((order) => {
                    const isDelivered = order.status === 'Entregue';
                    const isSeparating = order.status === 'Em Separação';
                    const isWaiting = order.status === 'Aguardando Faturamento';
                    
                    return (
                      <div 
                        key={order.id} 
                        className="bg-slate-900 rounded-xl border border-slate-800/80 p-4.5 hover:border-slate-700 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-semibold text-slate-300"
                      >
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center space-x-2.5">
                            <span className="bg-slate-950 font-mono text-[10px] text-slate-400 p-1.5 rounded font-black border border-slate-800/50">
                              {order.id}
                            </span>
                            <strong className="text-slate-100 text-sm font-black truncate block max-w-[280px]">
                              {order.clientName}
                            </strong>
                          </div>

                          <div className="flex flex-wrap items-center gap-3.5 text-[10px] text-slate-450 mt-1 font-mono">
                            <span className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              {order.date}
                            </span>
                            
                            <span className="flex items-center">
                              <Package className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              {order.items.length} itens cadastrados
                            </span>

                            <span className="flex items-center mt-0.5">
                              <Clock className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              Prazo: <strong className="text-white ml-0.5">{order.paymentTerm}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Status tracker */}
                        <div className="flex items-center space-x-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t border-slate-850 md:border-none pt-3 md:pt-0">
                          
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Total Faturado</span>
                            <strong className="font-mono text-emerald-400 font-extrabold text-sm">
                              R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded inline-block ${
                              isDelivered 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                : isSeparating 
                                ? 'bg-[#1E94CF]/15 text-[#1E94CF] border border-[#1e94cf]/20' 
                                : isWaiting
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                                : 'bg-slate-850 text-slate-400'
                            }`}>
                              {order.status}
                            </span>

                            <button
                              onClick={() => setFocusOrder(order)}
                              className="p-2 bg-[#1E94CF]/10 hover:bg-[#1E94CF] text-[#1E94CF] hover:text-slate-950 rounded-lg font-bold hover:shadow-md transition-all cursor-pointer flex items-center space-x-1"
                              title="Visualizar Nota de Venda Profissional"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="text-[10px] uppercase font-bold pr-1">Nota Fiscal</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}

                {sellerOrders.length === 0 && (
                  <div className="p-10 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500 font-semibold space-y-2">
                    <p>Você ainda não realizou nenhuma venda sincronizada no ERP Corporativo.</p>
                    <button
                      onClick={handleStartNewSale}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs tracking-wide uppercase transition-colors inline-block cursor-pointer mt-1"
                    >
                      Realizar Primeiro Pedido
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* DETAILED PROFESSIONAL SALES INVOICE MODAL WITH QR READER FOR CLIENT RECEIPTS */}
      <AnimatePresence>
        {focusOrder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full text-slate-900 shadow-2xl overflow-hidden border border-slate-200 text-xs font-semibold flex flex-col max-h-[90vh]"
            >
              
              {/* Header Actionable Bar */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4.5 w-4.5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-black tracking-tight uppercase">Nota de Venda Profissional</h3>
                    <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider leading-none mt-0.5">14.571.417 Cristiane Aparecida Gonçalves</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-350 hover:text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider border border-slate-700/50"
                    title="Imprimir Cupom Auxiliar"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Imprimir</span>
                  </button>

                   <button
                    onClick={async () => {
                      if (!focusOrder) return;
                      setIsGeneratingPDF(true);
                      try {
                        if (focusOrder.pdfUrl && focusOrder.pdfUrl.startsWith('data:application/pdf')) {
                          const link = document.createElement('a');
                          link.href = focusOrder.pdfUrl;
                          link.download = `WAGON-PEDIDO-${focusOrder.id}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } else {
                          const doc = await generateInvoicePDF(focusOrder, clients, products, { isDownload: false });
                          const dataUri = doc.output('datauristring');
                          
                          // Cache PDF data
                          focusOrder.pdfUrl = dataUri;
                          const cachedOrders = localStorage.getItem('vertice_erp_orders');
                          if (cachedOrders) {
                            const allOrders: Order[] = JSON.parse(cachedOrders);
                            const index = allOrders.findIndex(o => o.id === focusOrder.id);
                            if (index !== -1) {
                              allOrders[index].pdfUrl = dataUri;
                              localStorage.setItem('vertice_erp_orders', JSON.stringify(allOrders));
                            }
                          }

                          const link = document.createElement('a');
                          link.href = dataUri;
                          link.download = `WAGON-PEDIDO-${focusOrder.id}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch (err) {
                        console.error('[PDF Generation Error]', err);
                      } finally {
                        setIsGeneratingPDF(false);
                      }
                    }}
                    disabled={isGeneratingPDF}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-350 hover:text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider border border-slate-700/50 disabled:opacity-50"
                    title="Gerar e Baixar PDF"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="hidden md:inline">{isGeneratingPDF ? 'Baixando...' : 'Baixar PDF'}</span>
                  </button>

                  <button
                    onClick={() => focusOrder && handleSharePDF(focusOrder)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-350 hover:text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider border border-slate-700/50"
                    title="Compartilhar Nota"
                  >
                    <Share2 className="h-3.5 w-3.5 text-sky-400" />
                    <span className="hidden md:inline">Compartilhar</span>
                  </button>

                  <button
                    onClick={() => setFocusOrder(null)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-350 hover:text-white transition-colors cursor-pointer border border-slate-700/50"
                  >
                    <X className="h-3.5 w-3.5 text-rose-400" />
                  </button>
                </div>
              </div>

              {/* Scrollable Printable Note Body */}
              <div id="sales-receipt-printable" className="flex-1 overflow-y-auto p-6 space-y-6 printable-container select-text">
                
                {/* Visual Corporate ticket header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-dashed border-slate-200 pb-5 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-white bg-[#1E94CF] px-2.5 py-1 rounded inline-block tracking-wider uppercase">
                      Documento Auxiliar de Venda
                    </span>
                    <h4 className="text-base font-black text-slate-850">Nº Pedido: {focusOrder.id}</h4>
                    <p className="text-[10.5px] text-slate-400 font-mono">Emissão Digital: {focusOrder.date} às 10:15 UTC-3</p>
                  </div>

                  <div className="text-left sm:text-right text-[10.5px] text-slate-500 font-medium">
                    <strong className="text-slate-800 font-bold uppercase">14.571.417 Cristiane Aparecida Gonçalves</strong>
                    <p className="mt-0.5">CNPJ: <span className="font-mono font-bold">14.571.417/0001-19</span></p>
                    <p>IE: <span className="font-mono font-bold">001867602.00-43</span> | Status: <span className="text-emerald-600 font-black">ATIVA</span></p>
                  </div>
                </div>

                {/* Cliente / Destinatário */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-slate-405 block tracking-wider">Identificação do Destinatário</span>
                    <strong className="font-bold text-slate-800 text-xs block">{focusOrder.clientName}</strong>
                    <div className="space-y-1 font-medium text-slate-500">
                      <p>CNPJ / CPF: <strong className="text-slate-700 font-mono">{clients.find(c => c.id === focusOrder.clientId)?.cnpj || 'Cálculo Ativo'}</strong></p>
                      <p>E-mail: <strong className="text-slate-700">{clients.find(c => c.id === focusOrder.clientId)?.email || 'vendas@canal.com.br'}</strong></p>
                      <p>Telefone: <strong className="text-slate-700">{clients.find(c => c.id === focusOrder.clientId)?.phone || '(15) 99881-2233'}</strong></p>
                    </div>
                  </div>

                  <div className="sm:text-right space-y-2">
                    <span className="text-[10px] uppercase font-black text-slate-405 block tracking-wider">Representação / Canal</span>
                    <p className="font-bold text-slate-800 text-xs">{focusOrder.salesRep || currentSeller?.name}</p>
                    <div className="space-y-1 font-medium text-slate-505">
                      <p>Condição: <strong className="text-indigo-600 font-bold">{focusOrder.paymentTerm}</strong></p>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-amber-50 text-amber-500 border border-amber-100 text-[9px] font-bold mt-1 uppercase">
                        {focusOrder.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Products detail grid list inside the note */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black text-slate-405 block tracking-wider pl-1 font-bold">Relação de Bens e Produtos Faturados</span>
                  
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-55 border-b border-slate-205 text-[9.5px] uppercase font-black text-slate-500">
                        <tr>
                          <th className="p-3">Mercadoria</th>
                          <th className="p-3 text-center">Quantidade</th>
                          <th className="p-3 text-right">Unitário</th>
                          <th className="p-3 text-right">Descontos</th>
                          <th className="p-3 text-right font-bold">Preço Líquido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-105 font-medium text-slate-650">
                        {focusOrder.items.map((item) => {
                          // Try to fetch products categories
                          const matchingProd = products.find(p => p.id === item.productId);
                          const matchingUnit = matchingProd ? matchingProd.unit : 'un';
                          const originalItemTotal = item.unitPrice * item.quantity;
                          const discountSum = originalItemTotal - item.total;
                          const discountPct = originalItemTotal > 0 ? (discountSum / originalItemTotal) * 100 : 0;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <span className="font-extrabold text-slate-800 text-xs block">{item.productName}</span>
                                <span className="font-mono text-[9px] text-slate-405 block">ID: {item.productId}</span>
                              </td>
                              
                              <td className="p-3 text-center font-bold font-mono">
                                {item.quantity} {matchingUnit}
                              </td>

                              <td className="p-3 text-right font-mono">
                                R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3 text-right text-rose-500 font-mono">
                                {discountPct > 0 ? (
                                  <>
                                    - R$ {discountSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    <span className="text-[9px] font-bold block">({discountPct.toFixed(0)}% Off)</span>
                                  </>
                                ) : (
                                  '0.00'
                                )}
                              </td>

                              <td className="p-3 text-right font-black font-mono text-slate-800 text-xs">
                                R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subtotals & tax breakdowns inside invoice sheet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  
                  {/* Dynamic QR Code for Digital Receipt scanning */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center space-x-4">
                    <div className="p-1.5 bg-white border border-slate-200 rounded-xl shrink-0 flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(getReceiptURL(focusOrder.id))}&color=0f172a`}
                        alt="QR Code Cupom de Venda"
                        className="w-20 h-20"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="space-y-1.5 text-[10px] text-slate-450 leading-relaxed min-w-0">
                      <strong className="text-slate-800 uppercase tracking-widest font-black text-[9px] block">Comprovante Eletrônico</strong>
                      <p>Código autenticador de conformidade tributária.</p>
                      <span className="font-mono text-[8.5px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded truncate block mt-1">
                        Selo: Simples Nacional (MEI)
                      </span>
                    </div>
                  </div>

                  {/* Financial amounts summation sheet */}
                  <div className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600 font-medium">
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Bruto de Itens:</span>
                      <span className="font-mono">R$ {focusOrder.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between text-rose-500 font-bold">
                      <span>Total de Desconto:</span>
                      <span className="font-mono">- R$ {(focusOrder.subtotal - focusOrder.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-105">
                      <span>Impostos Declarados (Provisão):</span>
                      <span className="font-mono text-slate-700">R$ {focusOrder.taxes.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200 font-black text-slate-800">
                      <strong className="text-xs uppercase tracking-wider">LÍQUIDO A PAGAR CNPJ:</strong>
                      <strong className="text-base text-emerald-600 font-black font-mono">
                        R$ {focusOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                  </div>

                </div>

                {/* Footer disclaimer disclaimer */}
                <div className="border-t border-slate-150 pt-4 text-center text-[9px] text-slate-400 leading-normal space-y-1">
                  <p>Documento emitido através da plataforma Wagon AI.</p>
                  <p>Emitente: <strong>14.571.417 Cristiane Aparecida Gonçalves</strong> | CNPJ: <strong>14.571.417/0001-19</strong></p>
                  <p className="font-mono">Chave de Emissão Autorizada: 1526 8820 4410 0980 1522 9901 0288 #441A9</p>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200/60 flex space-x-2 shrink-0">
                <button
                  onClick={() => setFocusOrder(null)}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider text-center transition-colors hover:bg-slate-800 cursor-pointer"
                >
                  Confirmar e Fechar Nota
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM CLIENT REGISTRATION MODAL */}
      <AnimatePresence>
        {isClientModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden font-sans"
            >
              {/* Header */}
              <div className="bg-slate-950/60 p-6 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shadow-inner">
                    <Plus className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">Cadastrar Novo Cliente</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Vendedor Atribuído: <span className="text-emerald-400 font-black">{currentSeller?.name}</span></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Body Form */}
              <form onSubmit={handleSaveClient} className="p-6 space-y-4">
                
                {clientSuccessMessage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-2xl text-center space-y-3"
                  >
                    <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto text-xl font-black">
                      ✓
                    </div>
                    <p className="text-xs font-extrabold leading-relaxed">{clientSuccessMessage}</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Nome do Negócio */}
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Nome do Negócio *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Comercial Wagon S.A."
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-slate-600 font-bold"
                        />
                      </div>

                      {/* CNPJ */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">CNPJ *</label>
                        <input
                          type="text"
                          required
                          placeholder="00.000.000/0001-00"
                          value={cnpjInput}
                          onChange={handleCnpjChange}
                          maxLength={18}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-slate-600 font-mono font-bold"
                        />
                      </div>

                      {/* Proprietário */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Proprietário / Responsável</label>
                        <input
                          type="text"
                          placeholder="Ex: Carlos de Souza"
                          value={ownerInput}
                          onChange={(e) => setOwnerInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-slate-600 font-bold"
                        />
                      </div>

                      {/* Telefone */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Telefone / WhatsApp</label>
                        <input
                          type="text"
                          placeholder="(15) 99881-2233"
                          value={phoneInput}
                          onChange={handlePhoneChange}
                          maxLength={15}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-slate-600 font-mono font-bold"
                        />
                      </div>

                      {/* Cidade */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Cidade</label>
                        <input
                          type="text"
                          placeholder="Ex: Sorocaba"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-slate-600 font-bold"
                        />
                      </div>

                      {/* Endereço */}
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-450">Endereço Completo</label>
                        <input
                          type="text"
                          placeholder="Ex: Av. Paulistano, 1420 - Sala 3"
                          value={addressInput}
                          onChange={(e) => setAddressInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-slate-600 font-bold"
                        />
                      </div>

                    </div>

                    <div className="pt-4 border-t border-slate-850 flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsClientModalOpen(false)}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingClient}
                        className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center space-x-2"
                      >
                        {isSavingClient ? (
                          <span>Aguarde...</span>
                        ) : (
                          <>
                            <Plus className="h-4.5 w-4.5" />
                            <span>Confirmar Cadastro</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FALLBACK SHARE MODAL */}
      <AnimatePresence>
        {isShareModalOpen && shareOrder && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-6 font-sans text-slate-100"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-sky-400">
                  <Share2 className="h-4.5 w-4.5" />
                  <h3 className="text-sm font-black uppercase tracking-wider">Compartilhar Pedido</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Order Info Preview */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
                <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Resumo do Compartilhamento</p>
                <div className="space-y-1 font-bold">
                  <p className="text-white">Pedido: <span className="text-sky-400">{shareOrder.id}</span></p>
                  <p className="text-slate-300">Cliente: <span className="text-slate-100">{shareOrder.clientName}</span></p>
                  <p className="text-slate-305 font-mono">Total: <span className="text-emerald-400 font-extrabold">R$ {shareOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                </div>
              </div>

              {/* Interactive Actions Grid */}
              <div className="space-y-4">
                
                {/* Copy Link Row */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Link Público de Validação</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://app.wagon.ai/pedido/${shareOrder.id}`}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-sky-305 font-mono select-all focus:outline-none focus:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://app.wagon.ai/pedido/${shareOrder.id}`);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 200);
                      }}
                      className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wide transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      {copiedText ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedText ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Grid layout for channels */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  
                  {/* Whatsapp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Pedido *${shareOrder.id}*\nCliente: *${shareOrder.clientName}*\nValor: *R$ ${shareOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\nValide seu comprovante online:\nhttps://app.wagon.ai/pedido/${shareOrder.id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 p-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Send className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=Pedido ${shareOrder.id} - Wagon AI&body=${encodeURIComponent(
                      `Olá,\n\nGeramos o comprovante auxiliar digitizado do seu pedido, com total segurança e autenticidade eletrônica.\n\nNúmero: ${shareOrder.id}\nCliente: ${shareOrder.clientName}\nValor: R$ ${shareOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nPara visualizar os detalhes e baixar o arquivo PDF homologado, acesse o link de validação pública:\nhttps://app.wagon.ai/pedido/${shareOrder.id}\n\nEmitido via Wagon AI Integrada.`
                    )}`}
                    className="flex items-center justify-center space-x-2 p-3 bg-[#1F3767]/20 hover:bg-[#1E94CF]/20 text-[#1E94CF] border border-[#1E94CF]/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Mail className="h-4 w-4" />
                    <span>E-mail</span>
                  </a>

                </div>

                {/* Direct PDF Downloader Button */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsGeneratingPDF(true);
                    try {
                      await generateInvoicePDF(shareOrder, clients, products, { isDownload: true });
                    } catch (err) {
                      console.error('[Fallback Modal PDF Generation Error]', err);
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                  }}
                  disabled={isGeneratingPDF}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>{isGeneratingPDF ? 'Gerando Notas...' : 'Baixar Nota em PDF'}</span>
                </button>

              </div>
              
              {/* Footer */}
              <div className="text-center text-[9px] text-slate-500 border-t border-slate-800 pt-3">
                Selo de validação: SEFIP-A882-VRT. Criptografia homologada.
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern floating button to scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="absolute bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3 rounded-full shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-emerald-400/20"
            title="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
