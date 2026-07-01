/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  MapPin, 
  Package, 
  AlertTriangle, 
  Edit3, 
  Download, 
  Search, 
  ChevronRight, 
  FileEdit,
  Save,
  HelpCircle,
  Truck,
  Plus,
  Trash2,
  X,
  Filter,
  DollarSign,
  Tag,
  Percent,
  Receipt,
  Layers,
  AlertCircle,
  Check,
   TrendingUp,
   Info,
   FileSpreadsheet,
   Settings,
   History
 } from 'lucide-react';
import { Product, FinancialRecord, StockMovement } from '../types';

interface InventoryProps {
  products: Product[];
  stockMovements?: StockMovement[];
  onUpdateProduct: (updatedProduct: Product) => void;
  onReceiveStock: (productId: string, qtyToAdd: number, observation?: string, unitValue?: number) => void;
  onAddProduct: (newProduct: Product) => void;
  onAddTransaction?: (record: FinancialRecord) => void;
  isDark?: boolean;
}

export default function Inventory({ 
  products, 
  stockMovements = [],
  onUpdateProduct, 
  onReceiveStock,
  onAddProduct,
  onAddTransaction,
  isDark = false
}: InventoryProps) {
  
  // Applet state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id || null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'info' | 'editar' | 'lancar_entrada' | 'historico'>('info');
  const [activeInventoryTab, setActiveInventoryTab] = useState<'catalog' | 'audit_log'>('catalog');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'ALL' | 'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ALL');

  // Launch Stock Entry form states
  const [launchQty, setLaunchQty] = useState<number>(50);
  const [launchUnitValue, setLaunchUnitValue] = useState<number>(0);
  const [launchSupplier, setLaunchSupplier] = useState<string>('');
  const [launchPaymentMethod, setLaunchPaymentMethod] = useState<string>('Conta Bancária');
  const [launchPaymentDate, setLaunchPaymentDate] = useState<string>('2026-06-03');
  const [launchPaymentMode, setLaunchPaymentMode] = useState<'PAGO' | 'A PRAZO'>('PAGO');
  const [launchObservation, setLaunchObservation] = useState<string>('');

  const [stockLogs, setStockLogs] = useState<any[]>(() => {
    const cached = localStorage.getItem('vertice_stock_entry_logs');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'ENT-601',
        productId: '1',
        productName: 'Café Especial Arábica Gourmet',
        quantity: 120,
        unitValue: 35.0,
        totalValue: 4200.0,
        supplier: 'Fazenda Santa Maria',
        paymentMethod: 'Conta Bancária',
        paymentDate: '2026-06-01',
        paymentStatus: 'PAGO',
        observation: 'Lote de inverno - grãos selecionados',
        entryDate: '2026-06-01'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('vertice_stock_entry_logs', JSON.stringify(stockLogs));
  }, [stockLogs]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [safetyFilter, setSafetyFilter] = useState('all');
  
  // Modal configurations
  const [showAddModal, setShowAddModal] = useState(false);
  const [highlightCriticalOnly, setHighlightCriticalOnly] = useState(false);
 
  // Input states for the SKU adjustments side panel
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [editCorridor, setEditCorridor] = useState('');
  const [editShelf, setEditShelf] = useState('');
  const [editMinStock, setEditMinStock] = useState<number>(0);
  const [editBrand, setEditBrand] = useState('');
  const [editCommissionPercent, setEditCommissionPercent] = useState<number>(2.5);
  const [editImpostoPercent, setEditImpostoPercent] = useState<number>(15.0);
  const [restockQty, setRestockQty] = useState<number>(100);

  // Error and feedback indicators
  const [errorStatus, setErrorStatus] = useState('');
  const [successStatus, setSuccessStatus] = useState('');

  // Floating helper key
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // PREMIUM MODAL: NEW PRODUCT FORM STATES
  // ---------------------------------------------------------------------------
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Gourmet');
  const [newBrand, setNewBrand] = useState('');
  const [newQty, setNewQty] = useState('50');
  const [newCost, setNewCost] = useState('');
  const [newSelling, setNewSelling] = useState('');
  const [newMinStock, setNewMinStock] = useState('20');
  const [newUnit, setNewUnit] = useState('un');
  const [newCommissionPercent, setNewCommissionPercent] = useState('2.5');
  const [newImpostoPercent, setNewImpostoPercent] = useState('15.0');
  const [newCorridor, setNewCorridor] = useState('A-02');
  const [newShelf, setNewShelf] = useState('Nível 1');

  // Double-sync formula: Comissão R$ can be shown/calculated as custom field or synced!
  // R$ commission = SellingPrice * (CommissionPercent / 100)
  const getCalculatedCommissionValue = (price: number, percent: number) => {
    return price * (percent / 100);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Load product parameters into panel states when clicked or initial mount
  useEffect(() => {
    if (selectedProduct) {
      setEditPrice(selectedProduct.sellingPrice);
      setEditCost(selectedProduct.costPrice);
      setEditCorridor(selectedProduct.corridor);
      setEditShelf(selectedProduct.shelf);
      setEditMinStock(selectedProduct.minStock);
      setEditBrand(selectedProduct.brand || 'Diverso');
      setEditCommissionPercent(selectedProduct.commissionPercent ?? 2.5);
      setEditImpostoPercent(selectedProduct.impostoPercent ?? 15.0);
      setErrorStatus('');
      setSuccessStatus('');
    }
  }, [selectedProductId, selectedProduct]);

  // Keep selected product ID synchronous with product list changes
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setActiveDetailsTab('info');
    setIsDetailsModalOpen(true);
    setLaunchUnitValue(prod.costPrice);
    setLaunchSupplier(prod.brand || 'Cooperativa Regional');
    setErrorStatus('');
    setSuccessStatus('');
  };

  // Confirm stock input entry and integrate with Finance Ledger
  const handleConfirmStockLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (launchQty <= 0) {
      setErrorStatus('Quantidade inválida para lançamento.');
      return;
    }
    if (launchUnitValue < 0) {
      setErrorStatus('Valor unitário inválido.');
      return;
    }

    // 1. Update product quantity in local state via parent callback
    onReceiveStock(selectedProduct.id, Number(launchQty));

    // 2. Add log entry to stock logs list
    const newLog = {
      id: `ENT-${Math.floor(1000 + Math.random() * 9000)}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: Number(launchQty),
      unitValue: Number(launchUnitValue),
      totalValue: Number(launchQty) * Number(launchUnitValue),
      supplier: launchSupplier || 'Cooperativa Regional',
      paymentMethod: launchPaymentMethod,
      paymentDate: launchPaymentDate,
      paymentStatus: launchPaymentMode,
      observation: launchObservation || 'Entrada manual registrada no ERP',
      entryDate: new Date().toISOString().split('T')[0]
    };
    
    setStockLogs([newLog, ...stockLogs]);

    // 3. Integrate with Finance Ledger callback if provided
    if (onAddTransaction) {
      const transactionId = `FIN-ENT-${Math.floor(100 + Math.random() * 900)}`;
      const totalCost = Number(launchQty) * Number(launchUnitValue);
      
      const newTransaction = {
        id: transactionId,
        type: 'despesa' as const,
        description: `Entrada de Estoque SKU: ${selectedProduct.sku} (${selectedProduct.name})`,
        amount: totalCost,
        dueDate: launchPaymentDate,
        ...(launchPaymentMode === 'PAGO' ? { paymentDate: launchPaymentDate } : {}),
        status: (launchPaymentMode === 'PAGO' ? 'Pago' : 'Pendente') as 'Pago' | 'Pendente',
        partyName: launchSupplier || 'Fornecedor avulso',
        category: 'Compra de Mercadoria' as const
      };

      onAddTransaction(newTransaction);
    }

    setSuccessStatus(`Lançamento de +${launchQty} un concluído e sincronizado ao Financeiro!`);
    setLaunchQty(50);
    setLaunchObservation('');
    
    // Smooth navigation back
    setTimeout(() => {
      setSuccessStatus('');
      setActiveDetailsTab('info');
    }, 2000);
  };

  // Submit adjustment edits
  const handleSaveProductConfig = () => {
    if (!selectedProduct) return;
    if (editPrice <= editCost) {
      setErrorStatus('Restrição Comercial: Preço de Venda deve superar o Preço de Custo.');
      return;
    }
    
    const updated: Product = {
      ...selectedProduct,
      sellingPrice: Number(editPrice),
      costPrice: Number(editCost),
      corridor: editCorridor,
      shelf: editShelf,
      minStock: Number(editMinStock),
      brand: editBrand,
      commissionPercent: Number(editCommissionPercent),
      impostoPercent: Number(editImpostoPercent),
      status: selectedProduct.stock <= Number(editMinStock) * 0.4 
        ? 'critico' 
        : (selectedProduct.stock <= Number(editMinStock) ? 'baixo_estoque' : 'normal')
    };

    onUpdateProduct(updated);
    setErrorStatus('');
    setSuccessStatus('SKU reconfigurado com sucesso.');
    setTimeout(() => setSuccessStatus(''), 2500);
  };

  // Restock batch addition
  const handleRestockOrder = () => {
    if (!selectedProduct || restockQty <= 0) return;
    onReceiveStock(selectedProduct.id, Number(restockQty));
    setRestockQty(100);
    setSuccessStatus(`Recebimento Efetuado: +${restockQty} un registradas.`);
    setTimeout(() => setSuccessStatus(''), 2500);
  };

  // Handle premium product registration
  const handleRegisterProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const costNum = Number(newCost);
    const sellNum = Number(newSelling);
    const qtyNum = Number(newQty);
    const minNum = Number(newMinStock);
    const commPercentNum = Number(newCommissionPercent);
    const taxNum = Number(newImpostoPercent);

    if (!newName || !newCategory || !newCost || !newSelling) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (sellNum <= costNum) {
      alert('Operação Negada: O Preço de Venda precisa ser maior do que o Preço de Custo para garantir margem saudável.');
      return;
    }

    // Auto-generate elegant SKU
    const initials = newCategory.substring(0, 2).toUpperCase() + '-' + newName.substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(100 + Math.random() * 899);
    const generatedSku = `${initials}-${randomSuffix}`;
    
    // Determine initial status based on limits
    let initialStatus: 'normal' | 'baixo_estoque' | 'critico' = 'normal';
    if (qtyNum === 0) {
      initialStatus = 'critico';
    } else if (qtyNum <= minNum * 0.4) {
      initialStatus = 'critico';
    } else if (qtyNum <= minNum) {
      initialStatus = 'baixo_estoque';
    }

    const newProduct: Product = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      name: newName,
      sku: generatedSku,
      category: newCategory,
      brand: newBrand || 'Diverso',
      stock: qtyNum,
      minStock: minNum,
      unit: newUnit,
      costPrice: costNum,
      sellingPrice: sellNum,
      corridor: newCorridor,
      shelf: newShelf,
      status: initialStatus,
      commissionPercent: commPercentNum,
      impostoPercent: taxNum
    };

    onAddProduct(newProduct);
    
    // Clear modal states
    setNewName('');
    setNewBrand('');
    setNewQty('50');
    setNewCost('');
    setNewSelling('');
    setNewMinStock('20');
    setNewUnit('un');
    setNewCommissionPercent('2.5');
    setNewImpostoPercent('15.0');
    setNewCorridor('A-02');
    setNewShelf('Nível 1');

    setShowAddModal(false);
    setSelectedProductId(newProduct.id);
    
    // Confirmation alert
    alert(`SKU "${newName}" cadastrado com sucesso! Código gerado: ${generatedSku}`);
  };

  // ---------------------------------------------------------------------------
  // THE 5 CORE REQUIRED AGGREGATE CALCULATIONS
  // ---------------------------------------------------------------------------
  const produtosCadastradosCount = products.length;
  
  const totalQuantidadeEstoque = products.reduce((sum, p) => sum + p.stock, 0);
  
  const valorTotalEstoqueCusto = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
  const valorTotalEstoqueVenda = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);

  // Baixo estoque criteria: Stock is below or equal to safety line, but greater than 0
  const produtosEstoqueBaixoCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;

  // Zerados criteria: Stock is exactly 0
  const produtosZeradosCount = products.filter(p => p.stock === 0).length;

  // Safety filter queries
  const categories = Array.from(new Set(products.map(p => p.category)));
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    
    let matchesSafety = true;
    if (safetyFilter === 'low') {
      matchesSafety = p.stock <= p.minStock && p.stock > 0;
    } else if (safetyFilter === 'critical') {
      matchesSafety = p.stock <= p.minStock * 0.4 || p.stock === 0;
    } else if (safetyFilter === 'zerado') {
      matchesSafety = p.stock === 0;
    } else if (safetyFilter === 'normal') {
      matchesSafety = p.stock > p.minStock;
    }

    const matchesCriticalHighlight = !highlightCriticalOnly || p.stock <= p.minStock;
    
    return matchesSearch && matchesCategory && matchesSafety && matchesCriticalHighlight;
  });

  return (
    <div id="inventory-workspace" className="space-y-6">
      
      {/* HEADER PANEL */}
      <div id="inventory-header" className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-slate-200/60 gap-4">
        <div>
          <span className="text-xs font-bold text-brand-light uppercase tracking-wider block">Logística, Suprimentos & Almoxarifado</span>
          <h2 className="text-2xl font-black text-[#1F3767] tracking-tight mt-0.5">Mestre de Controle de Estoque</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestão abrangente de produtos, precificação corporativa, comissionamento e cálculo dinâmico de segurança contra rupturas.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {produtosEstoqueBaixoCount + produtosZeradosCount > 0 && (
            <button
              onClick={() => setHighlightCriticalOnly(!highlightCriticalOnly)}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                highlightCriticalOnly 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${highlightCriticalOnly ? 'animate-bounce' : ''}`} />
              <span>{highlightCriticalOnly ? 'Remover Filtro Crítico' : 'Focar Anomalias'}</span>
              <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full ml-1">
                {produtosEstoqueBaixoCount + produtosZeradosCount}
              </span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-[#1F3767] hover:bg-[#1E94CF] text-white px-4.5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer active:scale-95 text-nowrap"
          >
            <Plus className="h-4.5 w-4.5 font-bold" />
            <span>Novo SKU</span>
          </button>
        </div>
      </div>

      {/* THE 5 CORE REQUIRED ANALYTIC DIGITAL CARDS ROW */}
      <div id="inventory-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Produtos cadastrados */}
        <div
          id="kpi-products-registered"
          onMouseEnter={() => setHoveredCard('cadastrados')}
          onMouseLeave={() => setHoveredCard(null)}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative cursor-default"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block">Produtos Cadastrados</span>
              <h3 className="text-xl font-black text-[#1F3767] font-mono">{produtosCadastradosCount}</h3>
              <p className="text-[10px] text-slate-400 font-semibold">SKUs catalogados no ERP</p>
            </div>
            <div className="p-2 bg-blue-50/80 text-[#1E94CF] rounded-xl shadow-3xs">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          {hoveredCard === 'cadastrados' && (
            <div className="absolute z-40 bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 p-3 bg-slate-900 border border-slate-705 text-white text-[10px] font-semibold rounded-xl shadow-lg leading-relaxed pointer-events-none transition-all">
              <p className="font-extrabold text-[#1E94CF] mb-1">Mestre de SKUs</p>
              Representa o número total de itens catalogados no banco de dados ativo do ERP.
            </div>
          )}
        </div>

        {/* Card 2: Quantidade em estoque */}
        <div
          id="kpi-products-quantity"
          onMouseEnter={() => setHoveredCard('quantidade')}
          onMouseLeave={() => setHoveredCard(null)}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative cursor-default"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block">Quantidade em Estoque</span>
              <h3 className="text-xl font-black text-[#1F3767] font-mono">{totalQuantidadeEstoque.toLocaleString('pt-BR')}</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Unidades físicas estocadas</p>
            </div>
            <div className="p-2 bg-[#8BC039]/10 text-brand-green rounded-xl shadow-3xs">
              <Package className="h-5 w-5" />
            </div>
          </div>
          {hoveredCard === 'quantidade' && (
            <div className="absolute z-40 bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 p-3 bg-slate-900 border border-slate-705 text-white text-[10px] font-semibold rounded-xl shadow-lg leading-relaxed pointer-events-none transition-all">
              <p className="font-extrabold text-brand-green mb-1">Inventário Físico</p>
              Quantitativo de caixas, unidades e fardos armazenados atualmente nos depósitos de expedição.
            </div>
          )}
        </div>

        {/* Card 3: Valor total em estoque */}
        <div
          id="kpi-products-value"
          onMouseEnter={() => setHoveredCard('valortotal')}
          onMouseLeave={() => setHoveredCard(null)}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative cursor-default sm:col-span-1 lg:col-span-1"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5 col-span-2">
              <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block">Valor Total em Estoque</span>
              <h3 className="text-base font-black text-[#1F3767] font-mono tracking-tight">
                R$ {valorTotalEstoqueCusto.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[9px] text-[#8BC039] font-extrabold leading-none">
                Est. Venda: R$ {valorTotalEstoqueVenda.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-3xs">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          {hoveredCard === 'valortotal' && (
            <div className="absolute z-40 bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 p-3 bg-slate-900 border border-slate-705 text-white text-[10px] font-semibold rounded-xl shadow-lg leading-relaxed pointer-events-none transition-all">
              <p className="font-extrabold text-emerald-400 mb-1">Custo vs. Venda</p>
              Mostra o capital alocado avaliado a preço de compra (ativo de giro), com a margem bruta estimada a preço de venda pública.
            </div>
          )}
        </div>

        {/* Card 4: Estoque baixo */}
        <div
          id="kpi-products-lowstock"
          onMouseEnter={() => setHoveredCard('baixoestaque')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`bg-white p-4.5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative cursor-default ${
            produtosEstoqueBaixoCount > 0 ? 'border-amber-100 bg-amber-50/20' : 'border-slate-100'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block">Estoque Baixo</span>
              <h3 className={`text-xl font-black font-mono ${produtosEstoqueBaixoCount > 0 ? 'text-amber-500 font-extrabold' : 'text-[#1F3767]'}`}>
                {produtosEstoqueBaixoCount}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">SKUs abaixo de segurança</p>
            </div>
            <div className={`p-2 bg-amber-50 text-amber-500 rounded-xl shadow-3xs ${
              produtosEstoqueBaixoCount > 0 ? 'animate-pulse bg-amber-100/50' : ''
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          {hoveredCard === 'baixoestaque' && (
            <div className="absolute z-40 bottom-full mb-2 left-1/2 -translate-x-1/2 w-63 p-3 bg-slate-900 border border-slate-705 text-white text-[10px] font-semibold rounded-xl shadow-lg leading-relaxed pointer-events-none transition-all">
              <p className="font-extrabold text-amber-400 mb-1">Gargalos de Abastecimento</p>
              Produtos cujo saldo atual atingiu ou ultrapassou a linha de estoque de segurança delimitada. Requer nova Nota de Compra.
            </div>
          )}
        </div>

        {/* Card 5: Produtos zerados */}
        <div
          id="kpi-products-rupture"
          onMouseEnter={() => setHoveredCard('zerados')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`bg-white p-4.5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative cursor-default ${
            produtosZeradosCount > 0 ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block">Produtos Zerados</span>
              <h3 className={`text-xl font-black font-mono ${produtosZeradosCount > 0 ? 'text-rose-600 animate-pulse font-black' : 'text-[#1F3767]'}`}>
                {produtosZeradosCount}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">SKUs em rotura iminente</p>
            </div>
            <div className={`p-2 bg-rose-50 text-rose-500 rounded-xl shadow-3xs ${
              produtosZeradosCount > 0 ? 'bg-rose-100/50 text-rose-600' : ''
            }`}>
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          {hoveredCard === 'zerados' && (
            <div className="absolute z-40 bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 p-3 bg-slate-900 border border-slate-705 text-white text-[10px] font-semibold rounded-xl shadow-lg leading-relaxed pointer-events-none transition-all">
              <p className="font-extrabold text-red-400 mb-1">Ruptura Comercial</p>
              Produtos com saldo físico absolutamente zerado, impedindo faturamentos automáticos no pipeline de logística ou CRM.
            </div>
          )}
        </div>

      </div>

      {/* SELETOR DE ABAS LOGÍSTICAS */}
      <div className="flex border-b border-slate-200/60 pb-px gap-6 mb-1">
        <button
          type="button"
          onClick={() => setActiveInventoryTab('catalog')}
          className={`pb-3 text-sm font-black transition-all border-b-2 text-nowrap cursor-pointer active:scale-95 ${
            activeInventoryTab === 'catalog'
              ? 'border-[#1E94CF] text-[#1E94CF]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Catálogo Geral de SKUs ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveInventoryTab('audit_log')}
          className={`pb-3 text-sm font-black transition-all border-b-2 text-nowrap cursor-pointer active:scale-95 ${
            activeInventoryTab === 'audit_log'
              ? 'border-[#1E94CF] text-[#1E94CF]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Histórico Geral de Movimentações ({stockMovements?.length || 0})
        </button>
      </div>

      {activeInventoryTab === 'catalog' ? (
        <>
          {/* CRITICAL STOCK VISUAL ALERTS BANNER BAR */}
      {(produtosEstoqueBaixoCount > 0 || produtosZeradosCount > 0) && (
        <div id="critical-warnings-banner" className="bg-amber-50 text-amber-850 p-4 rounded-2xl border border-amber-200/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in text-xs leading-normal">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-3xs shrink-0 self-center">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-[13px]">Alerta Crítico: Ponto de Encomenda Atingido</p>
              <p className="text-slate-500 font-semibold text-[11px] leading-relaxed mt-0.5">
                Há <span className="text-amber-600 font-bold font-mono">{produtosEstoqueBaixoCount}</span> produtos abaixo do estoque mínimo operacional 
                {produtosZeradosCount > 0 ? (
                  <span> e <span className="text-rose-600 font-extrabold font-mono">{produtosZeradosCount} em ruptura total</span></span>
                ) : ''}. 
                Isso compromete a taxa de serviço e pode provocar cancelamento de faturas de CRM de vendas.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => { setCategoryFilter('all'); setSafetyFilter('critical'); }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3 py-1.5 rounded-lg transition-all"
            >
              Exibir Estoque Crítico
            </button>
            
            {safetyFilter === 'critical' && (
              <button
                onClick={() => setSafetyFilter('all')}
                className="bg-white border border-slate-200 text-slate-500 hover:text-slate-800 font-bold px-3 py-1.5 rounded-lg"
              >
                Limpar Filtro
              </button>
            )}
          </div>
        </div>
      )}

      {/* CORE CONTROL AREA: EXPANDED FULL-WIDTH LIST PANEL */}
      <div id="inventory-control-split" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MAIN LEDGER DATA TABLE (Spans full width now, sidebar details moved to popup) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-12 overflow-hidden">
          
          {/* SEARCH, CATEGORIES & ALERTS PANEL HEADERS */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Real Search Input bar */}
            <div className="relative flex-1 max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por SKU, nome, marca..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-brand-light focus:outline-none text-slate-700"
              />
            </div>

            {/* Quick selectivity switches */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Category Filter picklist */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-light cursor-pointer"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Stock Status selector */}
              <select
                value={safetyFilter}
                onChange={(e) => setSafetyFilter(e.target.value)}
                className="bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-light cursor-pointer"
              >
                <option value="all">Filtro de Saldo (Todos)</option>
                <option value="normal">Estoque Confortável</option>
                <option value="low">Estoque Baixo</option>
                <option value="critical">Estoque Crítico</option>
                <option value="zerado">Quantidade Zerada</option>
              </select>

            </div>

          </div>

          {/* MAIN PRODUCT TABLE (Completamente Reestruturada) */}
          <div className="overflow-x-auto w-full">
            {filteredProducts.length > 0 ? (
              <table className="w-full min-w-[1050px] text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-500 text-center">
                    <th className="p-4 text-left">Código (SKU)</th>
                    <th className="p-4 text-left">Produto</th>
                    <th className="p-4 text-left">Categoria</th>
                    <th className="p-4 text-left">Marca</th>
                    <th className="p-4 text-right">Quantidade</th>
                    <th className="p-4 text-right">Valor Compra</th>
                    <th className="p-4 text-right">Valor Venda</th>
                    <th className="p-4 text-center">Comissão</th>
                    <th className="p-4 text-center">Imposto</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-center text-xs">
                  {filteredProducts.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    const isLow = prod.stock <= prod.minStock && prod.stock > 0;
                    const isRupture = prod.stock === 0;

                    // Compute commission inline values
                    const commPercentVal = prod.commissionPercent ?? 2.5;
                    const commRsVal = prod.sellingPrice * (commPercentVal / 100);

                    // Tax parameter
                    const taxPercentVal = prod.impostoPercent ?? 15.0;

                    return (
                      <tr
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${
                          isSelected ? 'bg-sky-50/60' : ''
                        }`}
                      >
                        {/* 1. Código (SKU) */}
                        <td className="p-4 text-left">
                          <code className="bg-[#1F3767]/5 text-[#1F3767] font-bold font-mono px-2 py-0.5 rounded text-[10.5px]">
                            {prod.sku}
                          </code>
                        </td>

                        {/* 2. Produto (Name and Unit status) */}
                        <td className="p-4 text-left max-w-xs">
                          <div className="font-extrabold text-[#1F3767] leading-tight mb-0.5">
                            {prod.name}
                          </div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-205">
                            {prod.unit}
                          </span>
                        </td>

                        {/* 3. Categoria */}
                        <td className="p-4 text-left font-semibold text-slate-500">
                          {prod.category}
                        </td>

                        {/* 4. Marca */}
                        <td className="p-4 text-left font-bold text-[#1E94CF]">
                          {prod.brand || 'Marca Própria'}
                        </td>

                        {/* 5. Quantidade (Colored Status highlights) */}
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-black text-sm tracking-tight ${
                              isRupture ? 'text-rose-600' :
                              isLow ? 'text-amber-500' :
                              'text-brand-green'
                            }`}>
                              {prod.stock.toLocaleString('pt-BR')}
                            </span>
                            
                            {/* Color-coded alert dots */}
                            <span className={`inline-flex items-center space-x-1 text-[9px] font-black px-1.5 py-0.25 rounded-md mt-0.5 border ${
                              isRupture ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                              isLow ? 'bg-amber-50 text-amber-500 border-amber-100' :
                              'bg-emerald-50 text-brand-green border-emerald-100'
                            }`}>
                              {isRupture ? 'Sem Saldo' : isLow ? 'Fase Crítica' : 'Estável'}
                            </span>
                          </div>
                        </td>

                        {/* 6. Valor Compra */}
                        <td className="p-4 text-right font-bold text-slate-500 font-mono">
                          R$ {prod.costPrice.toFixed(2)}
                        </td>

                        {/* 7. Valor Venda */}
                        <td className="p-4 text-right font-extrabold text-[#1F3767] font-mono">
                          R$ {prod.sellingPrice.toFixed(2)}
                        </td>

                        {/* 8. Comissão (% and R$ combined) */}
                        <td className="p-4 text-center font-semibold text-slate-650">
                          <div className="text-[11px] font-bold text-slate-600">
                            {commPercentVal.toFixed(1)}%
                          </div>
                          <div className="text-[9px] font-black text-purple-600">
                            R$ {commRsVal.toFixed(2)}
                          </div>
                        </td>

                        {/* 9. Imposto */}
                        <td className="p-4 text-center font-mono font-bold text-amber-700">
                          {taxPercentVal.toFixed(1)}%
                        </td>

                        {/* Interactivity details pointer */}
                        <td className="p-4 text-slate-400">
                          <ChevronRight className="h-4 w-4" />
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center text-slate-400 space-y-3 font-semibold">
                <AlertCircle className="h-10 w-10 text-slate-350 mx-auto animate-pulse" />
                <p className="text-xs">Uau! Nenhum produto condizente com estes filtros no momento.</p>
                <p className="text-[10px] text-slate-450 normal-case font-normal max-w-sm mx-auto leading-relaxed">
                  Verifique os termos inseridos na barra de busca ou redefina a seleção de categoria para o padrão global.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setSafetyFilter('all'); }}
                  className="bg-[#1F3767] hover:bg-[#1E94CF] text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer"
                >
                  Resetar Painel
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* DETAILED LEDGER COMPLIANCE INFO AT FOOTER */}
      <div id="inventory-compliance-info" className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-[11px] text-slate-500 font-semibold leading-normal flex items-start space-x-3.5">
        <Info className="h-5 w-5 text-[#1E94CF] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-slate-750 font-black leading-none">Mecanismo Integrado Antirruptura Wagon AI</p>
          <p className="text-slate-450 text-[10px] font-medium leading-relaxed">
            As alterações de preços de venda propagam-se instantaneamente para novos pedidos do CRM Comercial, bem como o indicador analítico de controladoria. A comissão é rateada proporcionalmente ao percentual estipulado neste módulo. Garantido pelo Oráculo de Auditoria de Custos do Balanço.
          </p>
        </div>
      </div>
        </>
      ) : (() => {
        const filteredAuditLogs = (stockMovements || []).filter(item => {
          const matchesQuery = 
            (item.produto_nome || '').toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
            (item.produto_sku || '').toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
            (item.observacao || '').toLowerCase().includes(auditSearchQuery.toLowerCase());
          
          const matchesType = auditTypeFilter === 'ALL' || item.tipo === auditTypeFilter;
          return matchesQuery && matchesType;
        });

        return (
          <div id="inventory-audit-log-view" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6 animate-fade-in text-slate-800">
            {/* HEADER AND CONTROLS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-[#1E94CF] uppercase tracking-wider block">Logística & Rastreabilidade</span>
                <h3 className="text-base font-black text-[#1F3767]">Registro Histórico de Auditoria Geral</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                  Todas as entradas, baixas automáticas de vendas, e ajustes manuais de estoque em tempo real.
                </p>
              </div>

              {/* Type buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-max">
                {(['ALL', 'ENTRADA', 'SAIDA', 'AJUSTE'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAuditTypeFilter(type)}
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      auditTypeFilter === type
                        ? 'bg-white text-slate-800 shadow-3xs'
                        : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {type === 'ALL' ? 'TUDO' : type === 'SAIDA' ? 'SAÍDA' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER SEARCH BAR */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por SKU, Código, Tipo ou Observação..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1E94CF] focus:bg-white transition-all text-slate-700"
              />
            </div>

            {/* TABLE OF REGISTERS */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs font-semibold text-slate-650">
                <thead className="bg-slate-50 text-slate-450 text-[10px] uppercase font-black tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="p-4">SKU / CÓDIGO</th>
                    <th className="p-4">PRODUTO</th>
                    <th className="p-4">TIPO DE TRANSAÇÃO</th>
                    <th className="p-4 text-right">QUANTIDADE</th>
                    <th className="p-4 text-right">VALOR REF.</th>
                    <th className="p-4">DATA & HORA REGISTRO</th>
                    <th className="p-4">OBSERVAÇÃO DA OPERAÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.map((item) => {
                      const isEntrada = item.tipo === 'ENTRADA';
                      const isSaida = item.tipo === 'SAIDA';
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-4 font-mono font-black text-slate-800">
                            {item.produto_sku || 'PROD-N/A'}
                          </td>
                          <td className="p-4 font-black text-[#1F3767]">
                            {item.produto_nome || 'Produto Desconhecido'}
                          </td>
                          <td className="p-4">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isEntrada ? 'bg-emerald-50 text-emerald-600 font-extrabold' :
                              isSaida ? 'bg-rose-50 text-rose-550 font-extrabold' :
                              'bg-amber-50 text-amber-600 font-extrabold'
                            }`}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-black ${
                            isEntrada ? 'text-emerald-500' : isSaida ? 'text-rose-500' : 'text-amber-500'
                          }`}>
                            {isEntrada ? '+' : isSaida ? '-' : ''}{item.quantidade} un
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500 font-normal">
                            R$ {item.valor ? item.valor.toFixed(2) : '0.00'}
                          </td>
                          <td className="p-4 text-slate-450 text-[11px] font-medium font-sans">
                            {item.created_at ? item.created_at.substring(0, 16).replace('T', ' ') : 'Agendado'}
                          </td>
                          <td className="p-4 text-slate-500 font-medium italic text-[11px] max-w-xs truncate">
                            {item.observacao || 'Sem anotações de auditoria'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <Boxes className="h-8 w-8 mx-auto text-slate-300 opacity-65 mb-2 animate-bounce" />
                        <p className="text-xs">Nenhuma movimentação de estoque encontrada para os filtros atuais.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* SUMMARY STATISTICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Aportes (ENTRADAS)</span>
                <p className="text-sm font-black text-emerald-500 font-sans">
                  +{filteredAuditLogs.filter(m => m.tipo === 'ENTRADA').reduce((a, b) => a + b.quantidade, 0)} unidades
                </p>
              </div>
              <div className="space-y-0.5 border-t md:border-t-0 md:border-x border-slate-200 md:px-6 pt-2 md:pt-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Faturamentos (SAÍDAS)</span>
                <p className="text-sm font-black text-rose-500 font-sans">
                  -{filteredAuditLogs.filter(m => m.tipo === 'SAIDA').reduce((a, b) => a + b.quantidade, 0)} unidades
                </p>
              </div>
              <div className="space-y-0.5 pt-2 md:pt-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ajustes manuais</span>
                <p className="text-sm font-black text-amber-500 font-sans">
                  {filteredAuditLogs.filter(m => m.tipo === 'AJUSTE').length} operações de balanço
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DETAILED PRODUCT WORKSPACE MODAL (On Product SKU Click) */}
      {isDetailsModalOpen && selectedProduct && (
        <div id="product-details-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 overflow-y-auto">
          <div id="product-details-modal-container" className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#1F3767] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Boxes className="h-6 w-6 text-[#8BC039]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-[#1E94CF] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {selectedProduct.sku}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                      selectedProduct.stock === 0 ? 'bg-rose-500 text-white animate-pulse' :
                      selectedProduct.stock <= selectedProduct.minStock ? 'bg-amber-500 text-white' :
                      'bg-emerald-500 text-white'
                    }`}>
                      {selectedProduct.stock === 0 ? 'RUPTURA' :
                       selectedProduct.stock <= selectedProduct.minStock ? 'ESTOQUE CRÍTICO' : 'SEGURO'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg text-white mt-0.5 leading-tight">{selectedProduct.name}</h3>
                </div>
              </div>

              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-white/60 hover:text-white p-1.5 bg-white/5 hover:bg-white/10 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-all active:scale-95 text-xs font-black"
                title="Fechar Detalhes"
              >
                ✕
              </button>
            </div>

            {/* TAB SELECTOR BAR */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-2 flex items-center space-x-1 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => setActiveDetailsTab('info')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-nowrap cursor-pointer ${
                  activeDetailsTab === 'info'
                    ? 'bg-[#1F3767] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Detalhamento</span>
              </button>

              <button
                onClick={() => setActiveDetailsTab('editar')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-nowrap cursor-pointer ${
                  activeDetailsTab === 'editar'
                    ? 'bg-[#1F3767] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Reconfigurar SKU</span>
              </button>

              <button
                onClick={() => setActiveDetailsTab('lancar_entrada')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-nowrap cursor-pointer ${
                  activeDetailsTab === 'lancar_entrada'
                    ? 'bg-[#1F3767] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <Truck className="h-4 w-4" />
                <span>Lançar Entrada</span>
              </button>

              <button
                onClick={() => setActiveDetailsTab('historico')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-nowrap cursor-pointer ${
                  activeDetailsTab === 'historico'
                    ? 'bg-[#1F3767] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Histórico ({stockLogs.filter(log => log.productId === selectedProduct.id).length})</span>
              </button>
            </div>

            {/* SCROLLABLE MODAL BODY CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-650">

              {errorStatus && (
                <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-[11px] text-rose-600 font-bold flex items-center animate-shake">
                  <AlertTriangle className="h-4.5 w-4.5 mr-2 shrink-0 text-rose-500" />
                  <span>{errorStatus}</span>
                </div>
              )}

              {successStatus && (
                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-[11px] text-brand-green font-black flex items-center animate-fade-in animate-once">
                  <Check className="h-4.5 w-4.5 mr-2 shrink-0 text-brand-green" />
                  <span>{successStatus}</span>
                </div>
              )}

              {/* -------------------- TAB: INFO (Detalhamento) -------------------- */}
              {activeDetailsTab === 'info' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Cards de Métricas Principais */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider font-mono">Saldo Físico</span>
                      <span className={`text-xl font-black mt-2 leading-none ${
                        selectedProduct.stock === 0 ? 'text-rose-500' :
                        selectedProduct.stock <= selectedProduct.minStock ? 'text-amber-500' : 'text-brand-green'
                      }`}>
                        {selectedProduct.stock} <span className="text-xs font-normal text-slate-400">({selectedProduct.unit})</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold mt-1.5">Mínimo: {selectedProduct.minStock} un</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider font-mono">Preço Comercial</span>
                      <span className="text-xl font-black text-[#1F3767] mt-2 leading-none font-mono">
                        R$ {selectedProduct.sellingPrice.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold mt-1.5 flex justify-between pr-1">
                        <span>Custo: R$ {selectedProduct.costPrice.toFixed(2)}</span>
                        <span className="text-[#8BC039]">+{(((selectedProduct.sellingPrice - selectedProduct.costPrice) / selectedProduct.sellingPrice) * 100).toFixed(0)}%</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider font-mono">Comissionamento</span>
                      <span className="text-xl font-black text-purple-600 mt-2 leading-none font-mono">
                        {selectedProduct.commissionPercent || 2.5}%
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold mt-1.5">
                        Vol: R$ {getCalculatedCommissionValue(selectedProduct.sellingPrice, selectedProduct.commissionPercent || 2.5).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes de Logística & Auditoria Fiscal */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3.5">
                    <h4 className="text-xs uppercase font-extrabold text-[#1F3767] tracking-wider border-b border-slate-100 pb-2">Informações de Localização & Impostos</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs text-slate-600 font-semibold">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                        <span className="text-slate-400">Categoria Geral:</span>
                        <span className="font-extrabold text-slate-800">{selectedProduct.category}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                        <span className="text-slate-400">Marca / Fornecedor:</span>
                        <span className="font-extrabold text-[#1E94CF]">{selectedProduct.brand || 'Cooperativa Regional'}</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                        <span className="text-slate-400">Corredor Galpão:</span>
                        <span className="font-mono font-black text-slate-800">{selectedProduct.corridor || 'Padrão'}</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                        <span className="text-slate-400">Prateleira Nível:</span>
                        <span className="font-mono font-black text-slate-800">{selectedProduct.shelf || 'Nível Geral'}</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                        <span className="text-slate-400">Provisão de Impostos Base:</span>
                        <span className="font-bold text-amber-700">{selectedProduct.impostoPercent || 15.0}% (Dinâmico)</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                        <span className="text-slate-400">Markup Proporcional:</span>
                        <span className="font-bold text-brand-green">
                          R$ {(selectedProduct.sellingPrice - selectedProduct.costPrice).toFixed(2)} por unidade
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance alert banner */}
                  <div className="bg-[#1E94CF]/5 border border-[#1E94CF]/20 p-4 rounded-xl text-[10.5px] text-slate-600 leading-relaxed font-medium">
                    <p className="font-black text-[#1E94CF] mb-1">Módulo Controlador Tributário & Fiscal</p>
                    O preço de custo de <span className="font-bold">R$ {selectedProduct.costPrice.toFixed(2)}</span> é utilizado para apurar o passivo real na entrada de produtos, depreciando o balancete líquido e fornecendo margem justa corporativa sobre o Markup real.
                  </div>

                </div>
              )}

              {/* -------------------- TAB: EDITAR (Configurações SKU) -------------------- */}
              {activeDetailsTab === 'editar' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    
                    <div className="col-span-2">
                      <label className="block text-slate-450 uppercase tracking-wider mb-1 font-extrabold text-[9px]">Código Identificador SKU (Bloqueado)</label>
                      <input
                        type="text"
                        disabled
                        value={selectedProduct.sku}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 font-bold font-mono focus:outline-none text-slate-450 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-450 uppercase tracking-wider mb-1 font-extrabold text-[9px]">Preço de Compra (Custo R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCost}
                        onChange={(e) => setEditCost(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 font-bold font-mono focus:outline-none focus:bg-white text-slate-800 focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-450 uppercase tracking-wider mb-1 font-extrabold text-[9px]">Preço de Venda (Tabela R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 font-bold font-mono focus:outline-none focus:bg-white text-slate-800 focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-450 uppercase tracking-wider mb-1 font-extrabold text-[9px]">Taxa de Comissão (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editCommissionPercent}
                        onChange={(e) => setEditCommissionPercent(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 font-bold focus:outline-none focus:bg-white text-slate-800 focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-450 uppercase tracking-wider mb-1 font-extrabold text-[9px]">Imposto Base de Saída (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editImpostoPercent}
                        onChange={(e) => setEditImpostoPercent(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 font-bold focus:outline-none focus:bg-white text-slate-800 focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-450 uppercase tracking-wider mb-1 font-extrabold text-[9px]">Localização: Corredor Galpão</label>
                      <input
                        type="text"
                        value={editCorridor}
                        onChange={(e) => setEditCorridor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 font-bold focus:outline-none focus:bg-white text-slate-800 focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-450 uppercase tracking-wider mb-1 font-extrabold text-[9px]">Localização: Prateleira Nível</label>
                      <input
                        type="text"
                        value={editShelf}
                        onChange={(e) => setEditShelf(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 font-bold focus:outline-none focus:bg-white text-slate-800 focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-450 uppercase tracking-wider mb-1 font-extrabold text-[9px]">Alerta de Estoque Mínimo de Segurança</label>
                      <input
                        type="number"
                        value={editMinStock}
                        onChange={(e) => setEditMinStock(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-center text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveProductConfig}
                      className="w-full flex items-center justify-center space-x-2 bg-[#1F3767] hover:bg-[#1E94CF] text-white text-xs font-black py-4 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <Save className="h-4.5 w-4.5 text-white" />
                      <span>Salvar Configurações SKU</span>
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------- TAB: LANÇAR ENTRADA (Balanço Integrado) -------------------- */}
              {activeDetailsTab === 'lancar_entrada' && (
                <form onSubmit={handleConfirmStockLaunch} className="space-y-4 animate-fade-in text-slate-600">
                  <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl text-[10.5px] leading-relaxed text-slate-650 flex items-start space-x-2.5">
                    <AlertTriangle className="h-5 w-5 text-amber-550 shrink-0" />
                    <span>
                      <strong className="text-[#1F3767]">Sincronização Integrada:</strong> Lançar a entrada físico-química incrementará instantaneamente o saldo disponível para o CRM de vendas e lançará uma nova despesa de <strong className="font-extrabold">Compra de Mercadoria</strong> no Financeiro.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#1F3767] font-extrabold mb-1 uppercase tracking-wide text-[9.5px]">Quantidade de Entrada *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={launchQty}
                        onChange={(e) => setLaunchQty(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-extrabold font-mono text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#1F3767] font-extrabold mb-1 uppercase tracking-wide text-[9.5px]">Valor Unitário Pago (Custo) R$ *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={launchUnitValue}
                        onChange={(e) => setLaunchUnitValue(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-extrabold text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[#1F3767] font-extrabold mb-1 uppercase tracking-wide text-[9.5px]">Fornecedor Credor *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do produtor / fazenda"
                        value={launchSupplier}
                        onChange={(e) => setLaunchSupplier(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-bold focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#1F3767] font-extrabold mb-1 uppercase tracking-wide text-[9.5px]">Forma de Lançamento / Pagamento</label>
                      <select
                        value={launchPaymentMethod}
                        onChange={(e) => setLaunchPaymentMethod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E94CF]"
                      >
                        <option value="Conta Bancária">Conta Bancária / TED</option>
                        <option value="PIX Direto">PIX Direto Corporativo</option>
                        <option value="Boleto Corporate">Boleto Corporate</option>
                        <option value="Dinheiro Caixa">Dinheiro em Espécie</option>
                        <option value="Cartão Corporativo">Cartão de Crédito Corporativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#1F3767] font-extrabold mb-1 uppercase tracking-wide text-[9.5px]">Status da Transação</label>
                      <div className="grid grid-cols-2 gap-2 mt-0.5">
                        <button
                          type="button"
                          onClick={() => setLaunchPaymentMode('PAGO')}
                          className={`py-2 rounded-xl text-xs font-black border transition-all ${
                            launchPaymentMode === 'PAGO'
                              ? 'bg-emerald-50 border-emerald-300 text-brand-green'
                              : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50'
                          }`}
                        >
                          Lançar PAGO
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaunchPaymentMode('A PRAZO')}
                          className={`py-2 rounded-xl text-xs font-black border transition-all ${
                            launchPaymentMode === 'A PRAZO'
                              ? 'bg-amber-50 border-amber-300 text-amber-600'
                              : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50'
                          }`}
                        >
                          A PRAZO (À Pagar)
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[#1F3767] font-extrabold mb-1 uppercase tracking-wide text-[9.5px]">Data de Vencimento / Compensação</label>
                      <input
                        type="date"
                        value={launchPaymentDate}
                        onChange={(e) => setLaunchPaymentDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E94CF]"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[#1F3767] font-extrabold mb-1 uppercase tracking-wide text-[9.5px]">Observações de Auditoria</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Lote n° 102 - Classificação premium com nota fiscal inclusa."
                        value={launchObservation}
                        onChange={(e) => setLaunchObservation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E94CF] leading-normal"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Investimento Total Provisório</span>
                      <strong className="text-lg font-mono font-black text-[#1F3767]">R$ {(launchQty * launchUnitValue).toFixed(2)}</strong>
                    </div>

                    <button
                      type="submit"
                      className="bg-brand-green hover:bg-emerald-600 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center cursor-pointer"
                    >
                      <Plus className="h-4.5 w-4.5 mr-1.5" />
                      <span>Efetuar Recebimento Físico</span>
                    </button>
                  </div>
                </form>
              )}

              {/* -------------------- TAB: HISTÓRICO DE ENTRADAS (Trânsito de Notas) -------------------- */}
              {activeDetailsTab === 'historico' && (() => {
                const prodMovements = (stockMovements || []).filter(m => m.produto_id === selectedProduct.id);
                const hasMovements = prodMovements.length > 0;
                
                return (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                       <span className="text-[11px] font-black text-[#1F3767] uppercase tracking-wider">Histórico de Nota Fiscal & Movimentações</span>
                       <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                         {prodMovements.length} lançamentos de auditoria encontrados
                       </span>
                    </div>

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                      {hasMovements ? (
                        prodMovements.map((m: any) => {
                          const isEntrada = m.tipo === 'ENTRADA';
                          const isSaida = m.tipo === 'SAIDA';
                          const isAjuste = m.tipo === 'AJUSTE';
                          
                          return (
                            <div key={m.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-black text-slate-800 text-[10.5px]"># {m.id.substring(0, 8)}</span>
                                    <span className={`text-[8.5px] font-black px-1.5 py-0.25 rounded uppercase ${
                                      isEntrada ? 'bg-emerald-100 text-emerald-700' :
                                      isSaida ? 'bg-rose-100 text-rose-750' :
                                      'bg-amber-100 text-amber-700'
                                    }`}>
                                      {m.tipo}
                                    </span>
                                  </div>
                                  <p className="text-[9.5px] text-slate-450 mt-1">
                                    Data: <span className="font-bold text-slate-600">{m.created_at ? m.created_at.replace('T', ' ').substring(0, 16) : 'Agendado'}</span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`font-black block leading-none font-sans ${isEntrada ? 'text-brand-green' : isSaida ? 'text-rose-500' : 'text-amber-500'}`}>
                                    {isEntrada ? '+' : isSaida ? '-' : ''}{m.quantidade} {selectedProduct.unit}
                                  </span>
                                  <span className="text-[9.5px] text-slate-450 mt-1 font-mono block">R$ {m.valor ? m.valor.toFixed(2) : '0.00'}/un</span>
                                </div>
                              </div>

                              {m.observacao && (
                                <p className="border-t border-slate-100/50 pt-2 mt-2 text-[10px] text-slate-500 font-medium italic leading-relaxed">
                                  Obs: {m.observacao}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        stockLogs.filter(log => log.productId === selectedProduct.id).length > 0 ? (
                          stockLogs.filter(log => log.productId === selectedProduct.id).map((log: any) => (
                            <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-black text-slate-800 text-[10.5px]"># {log.id}</span>
                                    <span className="bg-emerald-150 text-brand-green text-[8.5px] font-black px-1.5 py-0.25 rounded uppercase">
                                      CONCLUÍDO (PAGO)
                                    </span>
                                  </div>
                                  <p className="text-[9.5px] text-slate-450 mt-1">Data: <span className="font-bold text-slate-600">{log.entryDate}</span> | Fornecedor: <span className="font-bold text-slate-700">{log.supplier}</span></p>
                                </div>
                                <div className="text-right">
                                  <span className="font-black text-brand-green block leading-none font-sans">+{log.quantity} {selectedProduct.unit}</span>
                                  <span className="text-[9.5px] text-slate-450 mt-1 font-mono block">R$ {log.unitValue.toFixed(2)}/un</span>
                                </div>
                              </div>

                              {log.observation && (
                                <p className="border-t border-slate-100/50 pt-2 mt-2 text-[10px] text-slate-500 font-medium italic leading-relaxed">
                                  Obs: {log.observation}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center bg-slate-50/50 rounded-xl text-slate-400">
                            <History className="h-8 w-8 mx-auto text-slate-300 opacity-60 mb-2" />
                            <p className="text-xs">Nenhum lote ou reabastecimento logado para este produto ainda.</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Modal Bottom actions */}
            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400 font-bold">
                Wagon AI Logística • Sincronização em tempo real
              </span>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="bg-[#1F3767] hover:bg-[#1E94CF] text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all h-9 cursor-pointer active:scale-95"
              >
                Fechar Painel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PREMIUM MATRICULA MODAL DE CADASTRO (Novo SKU) */}
      {showAddModal && (
        <div id="add-product-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 overflow-y-auto">
          <div id="premium-sku-modal-container" className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#1F3767] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded uppercase font-black tracking-wider block w-max text-[#8BC039]">Módulo Controladoria</span>
                <h3 className="font-black text-base text-white mt-1">Cadastro Premium de Novo Produto (SKU)</h3>
                <p className="text-[10px] text-slate-350 mt-0.5 font-medium">Incorpore produtos com provisão tributária e comissão integradas.</p>
              </div>

              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white p-1.5 bg-white/5 hover:bg-white/10 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-all active:scale-95 text-xs font-black"
                title="Fechar formulário"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleRegisterProductSubmit} className="p-6 space-y-5 text-xs font-semibold text-slate-650 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* 1. Nome do Produto (Required) */}
                <div className="col-span-2">
                  <label className="block text-slate-450 uppercase mb-1.5 font-black text-[9px] tracking-wider">Nome de Identificação Comercial*</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Queijo Parmesão Artesanal Curado 500g"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-light font-sans text-xs transition-colors"
                  />
                </div>

                {/* 2. Categoria Selectable */}
                <div>
                  <label className="block text-slate-450 uppercase mb-1.5 font-black text-[9px] tracking-wider">Categoria Fiscal*</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-750 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Gourmet">Gourmet / Especiais</option>
                    <option value="Grãos">Grãos / Cereais</option>
                    <option value="Bebidas">Bebidas / Destilados</option>
                    <option value="Doces">Doces / Sobremesas</option>
                    <option value="Laticínios">Laticínios / Derivados</option>
                    <option value="Panificação">Panificação / Massas</option>
                    <option value="Outros">Outros Insumos</option>
                  </select>
                </div>

                {/* 3. Marca (Required) */}
                <div>
                  <label className="block text-slate-450 uppercase mb-1.5 font-black text-[9px] tracking-wider">Marca / Fabricante*</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Ex: Fazenda da Canastra"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-bold focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-light font-sans text-xs transition-colors"
                  />
                </div>

                {/* 4. Quantidade Inicial */}
                <div>
                  <label className="block text-slate-450 uppercase mb-1.5 font-black text-[9px] tracking-wider">Quantidade Inicial em Estoque*</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-850 font-black font-mono focus:outline-none focus:bg-white transition-all text-center"
                  />
                </div>

                {/* 5. Unidade de Medida */}
                <div>
                  <label className="block text-slate-450 uppercase mb-1.5 font-black text-[9px] tracking-wider">Medida de Embarque</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-bold cursor-pointer"
                  >
                    <option value="un">un (Unitário)</option>
                    <option value="kg">kg (Quilograma)</option>
                    <option value="caixa">caixa (Lote Emb.)</option>
                    <option value="fardo">fardo</option>
                    <option value="litro">litro</option>
                  </select>
                </div>

                {/* 6. Valor de Compra (Custo) */}
                <div>
                  <label className="block text-slate-450 uppercase mb-1.5 font-black text-[9px] tracking-wider">Valor Compra (Preço de Custo R$)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    placeholder="12.50"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-black font-mono focus:outline-none text-center"
                  />
                </div>

                {/* 7. Valor de Venda */}
                <div>
                  <label className="block text-slate-450 uppercase mb-1.5 font-black text-[9px] tracking-wider">Valor Venda (Preço de Tabela R$)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newSelling}
                    onChange={(e) => setNewSelling(e.target.value)}
                    placeholder="29.90"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-black font-mono focus:outline-none text-center"
                  />
                </div>

                {/* 8. Comissão % */}
                <div>
                  <label className="block text-slate-455 uppercase mb-1.5 font-black text-[9px] tracking-wider">Comissão do Consultor (% Planilha)*</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newCommissionPercent}
                    onChange={(e) => setNewCommissionPercent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-bold focus:outline-none text-center"
                  />
                </div>

                {/* 9. Comissão R$ (INDICATIVO DYNAMIC CALCULADO) */}
                <div>
                  <label className="text-[9px] block text-slate-400 uppercase mb-1.5 font-bold tracking-tight">Comissão Provedora (R$ Projetado)</label>
                  <div className="w-full bg-purple-50/50 border border-purple-100 rounded-lg p-3 text-purple-750 font-black text-center text-xs font-mono">
                    R$ {getCalculatedCommissionValue(Number(newSelling || 0), Number(newCommissionPercent || 0)).toFixed(2)}
                  </div>
                </div>

                {/* 10. Imposto % (DAS/ICMS) */}
                <div>
                  <label className="block text-slate-450 uppercase mb-1.5 font-black text-[9px] tracking-wider">Imposto de Venda (%)*</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newImpostoPercent}
                    onChange={(e) => setNewImpostoPercent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-amber-700 font-black focus:outline-none text-center"
                  />
                </div>

                {/* 11. Estoque Mínimo (Safety Alerta) */}
                <div>
                  <label className="block text-slate-455 uppercase mb-1.5 font-black text-[9px] tracking-wider">Estoque Mínimo de Alerta*</label>
                  <input
                    type="number"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-slate-800 font-bold"
                  />
                </div>

                {/* 12. Localidades de Depósito */}
                <div>
                  <label className="block text-slate-450 uppercase mb-1 font-bold text-[9px]">Localização: Corredor</label>
                  <input
                    type="text"
                    value={newCorridor}
                    onChange={(e) => setNewCorridor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-450 uppercase mb-1 font-bold">Localização: Prateleira</label>
                  <input
                    type="text"
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-slate-700"
                  />
                </div>

              </div>

              {/* Real time markup estimator for safety warnings */}
              {Number(newCost) > 0 && Number(newSelling) > 0 && (
                <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl text-[11px] leading-relaxed">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Estimativa de Margem Bruta:</span>
                    <span className={`font-black font-mono ${Number(newSelling) > Number(newCost) ? 'text-brand-green text-xs' : 'text-rose-500 text-xs animate-pulse'}`}>
                      {Number(newSelling) > Number(newCost) 
                        ? `+${(((Number(newSelling) - Number(newCost)) / Number(newSelling)) * 100).toFixed(1)}%` 
                        : 'Preço de custo acima do preço de venda!'}
                    </span>
                  </div>
                  
                  {Number(newSelling) <= Number(newCost) && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Margens negativas provocam rombos no faturamento trimestral! Corrija os valores.
                    </p>
                  )}
                </div>
              )}

              {/* Footer action buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white border border-slate-200 text-slate-500 hover:text-slate-800 font-extrabold px-5 py-3 rounded-xl transition-all h-11 cursor-pointer"
                >
                  Cancelar Cadastro
                </button>
                <button
                  type="submit"
                  disabled={Number(newCost) >= Number(newSelling)}
                  className={`font-black px-6 py-3 rounded-xl shadow-md transition-all h-11 inline-flex items-center space-x-1 cursor-pointer text-white ${
                    Number(newCost) >= Number(newSelling) 
                      ? 'bg-slate-300 pointer-events-none shadow-none cursor-not-allowed' 
                      : 'bg-brand-green hover:bg-emerald-600 active:scale-95'
                  }`}
                >
                  <Check className="h-4 w-4 text-white" />
                  <span>Consolidar SKU</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
