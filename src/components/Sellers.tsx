/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  UserMinus, 
  UserPlus, 
  Building,
  Mail,
  Phone,
  ArrowUpRight,
  TrendingDown,
  Coins,
  ShieldCheck,
  AlertCircle,
  Lock,
  Loader2
} from 'lucide-react';
import { Client, Order, FinancialRecord, Seller, Commission } from '../types';

export interface SellerAdmissionInput {
  nome: string;
  email: string;
  password: string;
  telefone: string;
  ativo: boolean;
  comissao_rate: number;
  meta_vendas: number;
}

interface SellersProps {
  sellers: Seller[];
  onUpdateSellers: (updatedSellers: Seller[]) => void;
  clients: Client[];
  orders: Order[];
  financialRecords: FinancialRecord[];
  onAddTransaction: (record: FinancialRecord) => void;
  commissions?: Commission[];
  onPayCommission?: (sellerId: string, amount: number) => void;
  onCreateSeller: (input: SellerAdmissionInput) => Promise<void>;
}

export default function Sellers({
  sellers,
  onUpdateSellers,
  clients,
  orders,
  financialRecords,
  onAddTransaction,
  commissions = [],
  onPayCommission,
  onCreateSeller
}: SellersProps) {
  // Navigation & interaction states
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Seller form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [newCommissionRate, setNewCommissionRate] = useState(5.0);
  const [newTarget, setNewTarget] = useState(100000);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showAddSellerModal, setShowAddSellerModal] = useState(false);
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [sellerCreationError, setSellerCreationError] = useState<string | null>(null);

  // Advanced Period Filters (Data Inicial, Data Final)
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Commission payout slider / state
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState<string | null>(null);

  // Seller target editing states
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [tempTarget, setTempTarget] = useState<string>('');

  // Seller name and commission editing states
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [tempCommission, setTempCommission] = useState<string>('');

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCodeInput, setDeleteCodeInput] = useState('');
  const [sellerToDelete, setSellerToDelete] = useState<Seller | null>(null);

  // Core metrics calculation helpers connected to other modules of the ERP
  const getSellerStats = (seller: Seller) => {
    // 1. Client count
    const sellerClients = clients.filter(c =>
      c.vendedor_id === seller.id ||
      (!c.vendedor_id && (c.salesRep || '').trim().toLowerCase() === seller.name.trim().toLowerCase())
    );
    const activeClients = sellerClients.filter(c => (c.status || 'Ativo') === 'Ativo');
    const inactiveClients = sellerClients.filter(c => (c.status || 'Ativo') === 'Inativo');

    // Filter orders for the selected seller (either by salesRep match or matching client)
    let sellerOrders = orders.filter(o => {
      const sellerIdMatch = o.vendedor_id === seller.id;
      const legacyRepMatch = !o.vendedor_id && (o.salesRep || '').trim().toLowerCase() === seller.name.trim().toLowerCase();
      const clientMatch = sellerClients.some(c => c.id === o.clientId);
      return (sellerIdMatch || legacyRepMatch || clientMatch) && o.status !== 'Cancelado';
    });

    if (filterStartDate) {
      sellerOrders = sellerOrders.filter(o => o.date >= filterStartDate);
    }
    if (filterEndDate) {
      sellerOrders = sellerOrders.filter(o => o.date <= filterEndDate);
    }

    // Dynamic metrics inside selected period
    const totalSold = sellerOrders.reduce((sum, o) => sum + o.total, 0);
    const quantityOfSales = sellerOrders.length;

    // Unique clients served in this period
    const uniqueServedClients = new Set(sellerOrders.map(o => o.clientId));
    const clientsAtendidos = uniqueServedClients.size;

    // Filter commissions by period using matched order date
    let sellerCommissions = commissions.filter(c => c.vendedor_id === seller.id);
    if (filterStartDate || filterEndDate) {
      sellerCommissions = sellerCommissions.filter(c => {
        const o = orders.find(ord => ord.id === c.pedido_id);
        const dateToCheck = o ? o.date : (c.created_at || '');
        if (filterStartDate && dateToCheck < filterStartDate) return false;
        if (filterEndDate && dateToCheck > filterEndDate) return false;
        return true;
      });
    }

    const totalCommissionsGenerated = sellerCommissions.reduce((sum, c) => sum + c.valor, 0);
    const commissionPaid = sellerCommissions
      .filter(c => c.status === 'PAGO')
      .reduce((sum, c) => sum + c.valor, 0);
    const commissionPending = sellerCommissions
      .filter(c => c.status === 'PENDENTE' || c.status === 'PARCIAL')
      .reduce((sum, c) => sum + c.valor, 0);

    // 4. Target achieved percentage
    const targetPercentage = seller.target > 0 ? (totalSold / seller.target) * 100 : 0;

    return {
      clientCount: sellerClients.length,
      activeClientCount: activeClients.length,
      inactiveClientCount: inactiveClients.length,
      clientsList: sellerClients,
      totalSold,
      quantityOfSales,
      clientsAtendidos,
      commissionPaid,
      commissionPending,
      targetPercentage,
      totalCommissionsGenerated
    };
  };

  // Collective ERP commercial calculations
  const sellerStatsList = sellers.map(s => ({
    seller: s,
    stats: getSellerStats(s)
  }));

  const activeSellersCount = sellers.filter(s => s.status === 'Ativo').length;
  
  const collectiveTotalSold = sellerStatsList.reduce((sum, item) => sum + item.stats.totalSold, 0);
  
  const collectivePaidCommissions = sellerStatsList.reduce((sum, item) => sum + item.stats.commissionPaid, 0);
  
  const collectivePendingCommissions = sellerStatsList.reduce((sum, item) => sum + item.stats.commissionPending, 0);

  const resetSellerAdmissionForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewStatus('Ativo');
    setNewCommissionRate(5);
    setNewTarget(100000);
    setNewPassword('');
    setNewPasswordConfirm('');
    setSellerCreationError(null);
  };

  const closeSellerAdmissionModal = () => {
    if (isCreatingSeller) return;
    setShowAddSellerModal(false);
    resetSellerAdmissionForm();
  };

  const handleCreateSellerAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setSellerCreationError(null);

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setSellerCreationError('Nome, e-mail e senha são obrigatórios.');
      return;
    }
    if (newPassword.length < 8) {
      setSellerCreationError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setSellerCreationError('As senhas não coincidem.');
      return;
    }
    if (newCommissionRate < 0 || newCommissionRate > 100 || newTarget < 0) {
      setSellerCreationError('Revise a comissão e a meta de vendas.');
      return;
    }

    setIsCreatingSeller(true);
    try {
      await onCreateSeller({
        nome: newName.trim(),
        email: newEmail.toLowerCase().trim(),
        password: newPassword,
        telefone: newPhone.trim(),
        ativo: newStatus === 'Ativo',
        comissao_rate: newCommissionRate,
        meta_vendas: newTarget
      });
      setShowAddSellerModal(false);
      resetSellerAdmissionForm();
    } catch (error: any) {
      setSellerCreationError(error?.message || 'Não foi possível criar a conta do vendedor.');
    } finally {
      setIsCreatingSeller(false);
    }
  };

  const getDeleteCode = (seller: Seller) =>
    `EXCLUIR-${seller.name.trim().split(' ')[0].toUpperCase()}`;

  const openDeleteModal = (seller: Seller) => {
    setSellerToDelete(seller);
    setDeleteCodeInput('');
    setShowDeleteModal(true);
  };

  const handleDeleteSeller = () => {
    if (!sellerToDelete) return;
    if (deleteCodeInput !== getDeleteCode(sellerToDelete)) return;
    onUpdateSellers(sellers.filter(s => s.id !== sellerToDelete.id));
    setShowDeleteModal(false);
    setSellerToDelete(null);
    setDeleteCodeInput('');
    setSelectedSellerId(null);
    setPayoutSuccessMessage(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSellerToDelete(null);
    setDeleteCodeInput('');
  };

  const handleToggleSellerStatus = (id: string) => {
    const updated = sellers.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: s.status === 'Ativo' ? 'Inativo' : ('Ativo' as any)
        };
      }
      return s;
    });
    onUpdateSellers(updated);
  };

  const handlePayCommission = (seller: Seller, pendingLimit: number) => {
    if (!payoutAmount || payoutAmount <= 0) return;
    if (payoutAmount > pendingLimit) {
      alert(`O valor faturado para pagamento de comissão (R$ ${payoutAmount.toLocaleString('pt-BR')}) excede o saldo pendente disponível (R$ ${pendingLimit.toLocaleString('pt-BR')}).`);
      return;
    }

    const payValue = Number(payoutAmount);

    // Register a payout cash outflow directly on ERP ledger / finance record
    const comissionExpense: FinancialRecord = {
      id: `COM-${Math.floor(100 + Math.random() * 900)}`,
      type: 'despesa',
      description: `Comissão Líquida - Ref 06/2026 - ${seller.name}`,
      amount: payValue,
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Pago',
      partyName: seller.name,
      category: 'Folha Pgto',
      vendedor_id: seller.id
    };

    onAddTransaction(comissionExpense);

    if (onPayCommission) {
      onPayCommission(seller.id, payValue);
    }
    
    setPayoutSuccessMessage(`Sucesso! Pagamento de R$ ${payValue.toLocaleString('pt-BR')} processado e registrado na Folha de Pagamento do D.F.`);
    setPayoutAmount('');
    
    setTimeout(() => {
      setPayoutSuccessMessage(null);
    }, 4500);
  };

  // Filtered sellers
  const filteredSellers = sellers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Upper header action area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-1 rounded inline-block tracking-wider uppercase mb-1 border border-indigo-100">
            Força De Vendas & Comissionamento
          </span>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Equipe Comercial do ERP</h2>
          <p className="text-xs text-slate-400 font-semibold">Inspecione indicadores, trace metas, acompanhe a carteira de clientes e realize a liquidação de comissões.</p>
        </div>
        
        <button
          onClick={() => {
            resetSellerAdmissionForm();
            setShowAddSellerModal(true);
          }}
          className="flex items-center justify-center space-x-1.5 bg-[#1E94CF] hover:bg-[#1a85bc] text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>Contratar / Admitir novo vendedor</span>
        </button>
      </div>

      {/* Aviso de integração com Colaboradores */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
        <div className="p-1.5 bg-sky-100 rounded-lg shrink-0 mt-0.5">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
        </div>
        <div>
          <p className="text-xs font-black text-sky-800">Contas integradas ao banco e ao Portal Vendedor</p>
          <p className="text-[11px] text-sky-600 font-semibold mt-0.5">
            Ao admitir um vendedor, o sistema cria automaticamente seu login, perfil comercial e vínculo exclusivo com clientes, pedidos, vendas e comissões.
          </p>
        </div>
      </div>

      {/* Dynamic stats tracker cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-light/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Vendedores Ativos</span>
              <strong className="text-2xl font-black text-slate-800">{activeSellersCount} representantes</strong>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">De um efetivo total de {sellers.length} cadastros</p>
            </div>
            <div className="p-2.5 bg-sky-50 rounded-lg text-brand-light shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Vendas Totais</span>
              <strong className="text-2xl font-black text-slate-800">R$ {collectiveTotalSold.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong>
              <p className="text-[10px] text-brand-green font-bold mt-1 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                <span>100% faturado no ERP</span>
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-brand-green shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Comissões Pagas</span>
              <strong className="text-2xl font-black text-indigo-650">R$ {collectivePaidCommissions.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong>
              <p className="text-[10px] text-indigo-500 font-bold mt-1">Comprovantes anexados na SEFIP</p>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
              <Coins className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Comissões Pendentes</span>
              <strong className="text-2xl font-black text-amber-500">R$ {collectivePendingCommissions.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong>
              <p className="text-[10px] text-amber-500 font-bold mt-1">Provisão regulada sob contrato</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-500 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Filtering tools & sales roster table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-5">
        
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Users className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Inspecionar vendedor por nome, e-mail do canal ou ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-brand-light focus:outline-none placeholder-slate-400 font-medium"
            />
          </div>
          
          <div className="flex items-center space-x-3 text-slate-600">
            <span>Filtro Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:outline-none"
            >
              <option value="all">Ver Todos Representantes</option>
              <option value="Ativo">Apenas Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>
          </div>
        </div>

        {/* Advanced Period Filter */}
        <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center space-x-2 text-slate-700">
            <span className="text-base text-sky-500">📅</span>
            <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Período de Análise</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-slate-450 text-[10px] font-extrabold uppercase">Data Inicial:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold focus:ring-1 focus:ring-brand-light focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-450 text-[10px] font-extrabold uppercase">Data Final:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold focus:ring-1 focus:ring-brand-light focus:outline-none"
              />
            </div>

            {(filterStartDate || filterEndDate) && (
              <button
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="text-[10px] uppercase bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-black tracking-wider transition-all cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Sales Agents Table */}
        <div className="border border-slate-100 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left font-sans text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
              <tr>
                <th className="p-4">Identificação / Cadastro</th>
                <th className="p-4 text-center">Status comercial</th>
                <th className="p-4 text-center">Carteira de Clientes</th>
                <th className="p-4 text-right">Volume Metas & Progresso</th>
                <th className="p-4 text-right">Acumulado Vendido</th>
                <th className="p-4 text-right">Comissões Pagas</th>
                <th className="p-4 text-right">Comissões Pendentes</th>
                <th className="p-4 text-center">Painel Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {filteredSellers.map((s) => {
                const stats = getSellerStats(s);
                return (
                  <tr key={s.id} className="hover:bg-slate-55/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                          {s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                          <span className="font-mono text-[9px] text-slate-400">{s.id} • {s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSellerStatus(s.id);
                        }}
                        className={`inline-flex items-center space-x-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                          s.status === 'Ativo' 
                            ? 'bg-emerald-50 text-brand-green border border-emerald-150' 
                            : 'bg-rose-50 text-rose-500 border border-rose-150'
                        }`}
                        title="Clique para alternar o status do representante"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'Ativo' ? 'bg-brand-green' : 'bg-rose-500'}`}></span>
                        <span>{s.status}</span>
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-black text-[10px]">
                        {stats.clientCount} clientes
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">{stats.activeClientCount} Ativos • {stats.inactiveClientCount} Inativos</p>
                    </td>
                    <td className="p-4 max-w-[130px] text-right">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-700">Meta: R$ {s.target.toLocaleString('pt-BR')}</p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                          <div 
                            className={`h-full transition-all ${stats.targetPercentage >= 100 ? 'bg-brand-green' : 'bg-[#1E94CF]'}`}
                            style={{ width: `${Math.min(stats.targetPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-[9px] font-extrabold ${stats.targetPercentage >= 100 ? 'text-brand-green' : 'text-[#1E94CF]'}`}>
                          {stats.targetPercentage.toFixed(0)}% Atingindo
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">
                      R$ {stats.totalSold.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4 text-right font-black text-indigo-600">
                      R$ {stats.commissionPaid.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-black ${stats.commissionPending > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        R$ {stats.commissionPending.toLocaleString('pt-BR')}
                      </span>
                      <p className="text-[9px] text-slate-400 font-semibold">Base de comissão: {s.commissionRate}%</p>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedSellerId(s.id)}
                        className="inline-flex items-center space-x-1 px-4 py-1.5 bg-[#1E94CF]/10 hover:bg-[#1E94CF] hover:text-white text-[#1E94CF] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        <span>Gerenciar</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Visual area for premium commission management */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white shadow-lg space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-light/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-5 gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-light flex items-center space-x-2">
              <Coins className="h-5 w-5 text-indigo-400" />
              <span>Painel Geral de Comissionamento e Liquidez</span>
            </h3>
            <p className="text-xs text-slate-350 font-semibold mt-1">Conceda pagamentos, monitore provisionamento de reservas e mantenha conformidade fiscal do D.F.</p>
          </div>
          
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-right">
            <span className="text-[9px] font-bold text-slate-405 uppercase tracking-wider block">Custo Total de Comissões Gestão Ativa</span>
            <strong className="text-lg font-black text-slate-100">
              R$ {(collectivePaidCommissions + collectivePendingCommissions).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Cards displaying global performance of commissions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs text-slate-300 font-semibold">
          
          {/* Target achievers rank card */}
          <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
            <h4 className="text-[10px] font-black uppercase text-[#1E94CF] tracking-wide mb-3 flex items-center space-x-1">
              <Award className="h-3.5 w-3.5" />
              <span>Destaques da Equipe</span>
            </h4>
            <div className="space-y-2.5">
              {sellerStatsList
                .sort((a, b) => b.stats.totalSold - a.stats.totalSold)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-slate-200">
                      {idx + 1}º <strong className="text-slate-100 font-bold ml-1">{item.seller.name}</strong>
                    </span>
                    <strong className="text-[#8BC039] font-black">
                      R$ {item.stats.totalSold.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </strong>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick instructions for calculating commissions */}
          <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
            <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-wide mb-3 flex items-center space-x-1">
              <Target className="h-3.5 w-3.5" />
              <span>Diretriz Comercial de Metas</span>
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              O ERP monitora a carteira faturada e o limite restante de comissões. Ao registrar transações sob a rubrica <strong>Folha Pgto</strong> de comissão, o saldo é deduzido instantaneamente da ficha do trabalhador.
            </p>
            <div className="pt-2 border-t border-slate-850/50 mt-2 flex justify-between text-[10px] text-slate-350">
              <span>Auditoria ERP Ativa</span>
              <span className="text-brand-green font-bold">Consistente</span>
            </div>
          </div>

          {/* Master commission trigger component */}
          <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-900/30 flex flex-col justify-between relative group overflow-hidden">
            <h4 className="text-[10px] font-black uppercase text-brand-green tracking-wide mb-2 flex items-center space-x-1">
              <Coins className="h-3.5 w-3.5" />
              <span>Liquidação de Lotes</span>
            </h4>
            <p className="text-[11px] text-slate-350 leading-relaxed mb-3">
              Configure limites para pagamentos coletivos de fim de mês ou faça transferências rápidas pela ficha individual de cada vendedor ao lado.
            </p>
            <button 
              onClick={() => {
                const s = sellers.find(s => s.status === 'Ativo');
                if (s) setSelectedSellerId(s.id);
              }}
              className="w-full bg-[#1e94cf]/20 hover:bg-[#1e94cf] border border-[#1e94cf]/50 text-slate-200 hover:text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase text-center transition-all cursor-pointer"
            >
              Liquidar pelas Fichas individuais
            </button>
          </div>

        </div>

      </div>

      {/* Premium Sliding Lateral Drawer describing full seller history and KPIs */}
      <AnimatePresence>
        {selectedSellerId && (() => {
          const s = sellers.find(sel => sel.id === selectedSellerId);
          if (!s) return null;

          const stats = getSellerStats(s);

          return (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSelectedSellerId(null);
                  setPayoutSuccessMessage(null);
                }}
                className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex justify-end"
              >
                {/* Drawer Container */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full sm:max-w-2xl bg-[#FCFDFE] h-[92vh] sm:h-full mt-auto sm:mt-0 rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col justify-between overflow-hidden relative text-slate-800"
                >
                  
                  {/* Drawer Header Block */}
                  <div className="pt-8 pb-5 px-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#1E94CF]/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className="space-y-1">
                        <span className="inline-block bg-[#1e94cf]/25 text-[#1e94cf] border border-[#1e94cf]/20 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                          CRM Representante Comercial
                        </span>
                        {editingNameId === s.id ? (
                          <div className="flex items-center space-x-1.5 mt-1">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-0.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#1E94CF] max-w-[180px]"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (tempName.trim()) {
                                  const updated = sellers.map(item => item.id === s.id ? { ...item, name: tempName.trim() } : item);
                                  onUpdateSellers(updated);
                                  setEditingNameId(null);
                                }
                              }}
                              className="bg-brand-green hover:bg-emerald-600 text-white rounded px-2 py-0.5 text-[9px] font-black transition-all cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingNameId(null)}
                              className="bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-2 py-0.5 text-[9px] font-black transition-all cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-black tracking-tight">{s.name}</h3>
                            <button
                              onClick={() => {
                                setEditingNameId(s.id);
                                setTempName(s.name);
                              }}
                              className="text-[9px] text-[#1E94CF] hover:underline font-bold transition-all cursor-pointer"
                              title="Alterar Nome"
                            >
                              (Alterar)
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-slate-400 font-mono">
                          Cadastro ID: {s.id} • {s.email}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setSelectedSellerId(null);
                          setPayoutSuccessMessage(null);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full p-2 transition-all cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Quick values Row */}
                    <div className="grid grid-cols-3 gap-4 pt-5 mt-5 border-t border-slate-800/80 text-xs text-slate-305 relative z-10">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Total Vendido</span>
                        <strong className="text-base font-black text-white mt-1 block">
                          R$ {stats.totalSold.toLocaleString('pt-BR')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Risco Carteira</span>
                        <span className="inline-block bg-emerald-500/20 text-emerald-405 border border-emerald-500/25 text-[9px] font-bold px-2 py-0.5 rounded mt-1.5 uppercase">
                          Cálculo Seguro
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Comissão Base</span>
                          {editingCommissionId !== s.id && (
                            <button
                              onClick={() => {
                                setEditingCommissionId(s.id);
                                setTempCommission(s.commissionRate.toString());
                              }}
                              className="text-[9px] text-[#1E94CF] hover:underline font-bold transition-all cursor-pointer ml-1"
                            >
                              Alterar
                            </button>
                          )}
                        </div>
                        {editingCommissionId === s.id ? (
                          <div className="mt-1 flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.1"
                              value={tempCommission}
                              onChange={(e) => setTempCommission(e.target.value)}
                              className="w-12 bg-slate-800 text-white border border-slate-700 rounded px-1 py-0.5 text-xs font-black focus:outline-none"
                              placeholder="%"
                            />
                            <button
                              onClick={() => {
                                const parsed = parseFloat(tempCommission);
                                if (!isNaN(parsed) && parsed >= 0) {
                                  const updated = sellers.map(item => item.id === s.id ? { ...item, commissionRate: parsed } : item);
                                  onUpdateSellers(updated);
                                }
                                setEditingCommissionId(null);
                              }}
                              className="bg-brand-green hover:bg-emerald-600 text-white rounded px-1.5 py-0.5 text-[9px] font-bold"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingCommissionId(null)}
                              className="bg-slate-700 text-slate-350 rounded px-1.5 py-0.5 text-[9px] font-bold"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <strong className="text-base font-black text-brand-green mt-1 block">
                            {s.commissionRate}%
                          </strong>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable interior details */}
                  <div className="flex-1 overflow-y-auto p-6 pb-12 space-y-6 text-xs">
                    
                    {/* Resumo financeiro bento grids */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-[#1E94CF]" />
                        <span>Resumo Financeiro & Metas de Desempenho</span>
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meta Estipulada</span>
                              <button
                                onClick={() => {
                                  setEditingTargetId(s.id);
                                  setTempTarget(s.target.toString());
                                }}
                                className="text-[10px] text-[#1E94CF] hover:underline font-bold cursor-pointer"
                              >
                                Alterar Meta
                              </button>
                            </div>
                            
                            {editingTargetId === s.id ? (
                              <div className="mt-2 flex items-center space-x-1.5">
                                <span className="text-slate-500 font-bold text-[11px]">R$</span>
                                <input
                                  type="number"
                                  value={tempTarget}
                                  onChange={(e) => setTempTarget(e.target.value)}
                                  className="w-full max-w-[100px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E94CF]"
                                  placeholder="Meta"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    const parsed = parseFloat(tempTarget);
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      const updated = sellers.map(item => item.id === s.id ? { ...item, target: parsed } : item);
                                      onUpdateSellers(updated);
                                    }
                                    setEditingTargetId(null);
                                  }}
                                  className="bg-brand-green hover:bg-emerald-605 text-white rounded px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => setEditingTargetId(null)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <strong className="text-sm font-black text-slate-800 block mt-1">
                                R$ {s.target.toLocaleString('pt-BR')}
                              </strong>
                            )}
                          </div>
                          
                          <div className="pt-2 mt-2 border-t border-slate-200/50">
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${stats.targetPercentage >= 100 ? 'bg-brand-green' : 'bg-[#1E94CF]'}`}
                                style={{ width: `${Math.min(stats.targetPercentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-[9.5px] font-bold block text-slate-550 mt-1 text-right">
                              {stats.targetPercentage.toFixed(1)}% alcançado
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Provisão de Comissão Gerada</span>
                            <strong className="text-sm font-black text-slate-800 block mt-1">
                              R$ {stats.totalCommissionsGenerated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                          </div>
                          <p className="text-[9px] text-slate-400 font-semibold leading-relaxed pt-1.5 border-t border-slate-200/50 mt-2">
                            Métrica recalculada automaticamente a cada pedido recebido e faturado.
                          </p>
                        </div>

                      </div>

                      {/* Period Stats Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vendas no Período</span>
                          <strong className="text-xs font-black text-slate-850 block mt-1">{stats.quantityOfSales} ordens</strong>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Adendidos</span>
                          <strong className="text-xs font-black text-slate-850 block mt-1">{stats.clientsAtendidos} clientes</strong>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Ativos</span>
                          <strong className="text-xs font-black text-slate-850 block mt-1">{stats.activeClientCount} carteira</strong>
                        </div>
                      </div>
                    </div>

                    {/* Commissions Tracker Paid vs Pending */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                      
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-1.5">
                          <Coins className="h-4 w-4 text-indigo-650" />
                          <span>Mapeamento de Comissões Cadastradas</span>
                        </h4>
                        <span className="bg-slate-100 text-[10px] px-2 py-0.5 rounded text-slate-650 font-bold">Subtotais Deduzidos</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase block">Comissão Recebida/Paga</span>
                          <strong className="text-base font-black text-indigo-650 block mt-1">
                            R$ {stats.commissionPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                          <span className="text-[9px] text-slate-400 block mt-1">Lançamentos baixados com status Pago</span>
                        </div>

                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                          <span className="text-[10px] font-bold text-amber-600 uppercase block">Comissão Pendente</span>
                          <strong className="text-base font-black text-amber-605 block mt-1">
                            R$ {stats.commissionPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                          <span className="text-[9px] text-slate-400 block mt-1">Geração de crédito aguardando liquidação</span>
                        </div>

                      </div>

                      {/* Interactive form to execute payout right here! */}
                      {s.status === 'Ativo' && stats.commissionPending > 0 && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 mt-2 space-y-3">
                          <span className="text-[10px] font-bold text-slate-755 uppercase block">Processar Pagamento de Comissão</span>
                          
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-400">R$</span>
                              <input
                                type="number"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder={`Ex: ${Math.floor(stats.commissionPending)}`}
                                min="1"
                                max={stats.commissionPending}
                                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 font-black text-xs text-slate-700 focus:outline-none"
                              />
                            </div>
                            
                            <button
                              onClick={() => handlePayCommission(s, stats.commissionPending)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase shadow-xs transition-colors cursor-pointer shrink-0"
                            >
                              Pagar Comissão
                            </button>
                          </div>

                          {payoutSuccessMessage && (
                            <p className="p-2.5 bg-emerald-50 text-brand-green rounded-lg text-[10px] font-bold border border-emerald-100 text-left">
                              {payoutSuccessMessage}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Sub-table showing individual commissions */}
                      <div className="pt-3 border-t border-slate-100/80 space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Histórico de Parcelas de Comissão</span>
                        <div className="overflow-x-auto max-h-48 overflow-y-auto pr-1">
                          <table className="w-full text-left text-[11px]">
                            <thead>
                              <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase text-[9px] tracking-wider">
                                <th className="py-1">ID</th>
                                <th className="py-1">Pedido</th>
                                <th className="py-1">Valor</th>
                                <th className="py-1">Pagamento</th>
                                <th className="py-1 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {commissions
                                .filter(c => c.vendedor_id === s.id)
                                .map(c => (
                                  <tr key={c.id} className="text-slate-650 hover:bg-slate-50/50">
                                    <td className="py-1.5 font-mono font-bold text-slate-500">{c.id}</td>
                                    <td className="py-1.5 font-bold text-slate-700">{c.pedido_id}</td>
                                    <td className="py-1.5 font-black text-indigo-650">R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-1.5 text-slate-500 font-medium">{c.data_pagamento || '-'}</td>
                                    <td className="py-1.5 text-right">
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                        c.status === 'PAGO' 
                                          ? 'bg-emerald-50 text-brand-green border border-emerald-100'
                                          : c.status === 'PARCIAL' 
                                          ? 'bg-sky-50 text-[#1E94CF] border border-sky-100'
                                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                                      }`}>
                                        {c.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              {commissions.filter(c => c.vendedor_id === s.id).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-3 text-center text-slate-400 font-bold italic">Nenhum lançamento registrado</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>

                    {/* Portfolio overview breakdown: Active Clients vs Inactive Clients */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                      
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-1.5">
                          <Building className="h-4 w-4 text-[#1E94CF]" />
                          <span>Carteira de Clientes Representada ({stats.clientCount})</span>
                        </h4>
                        <div className="flex space-x-2 text-[9px] font-bold uppercase">
                          <span className="bg-emerald-50 text-brand-green px-2 py-0.5 rounded border border-emerald-100">
                            {stats.activeClientCount} ATIVOS
                          </span>
                          <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded border border-rose-100">
                            {stats.inactiveClientCount} INATIVOS
                          </span>
                        </div>
                      </div>

                      {stats.clientsList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                          {stats.clientsList.map((cli) => {
                            const isCliActive = (cli.status || 'Ativo') === 'Ativo';
                            return (
                              <div key={cli.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-slate-800 truncate block max-w-[170px]">{cli.name}</span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.2 rounded-full ${
                                    isCliActive ? 'bg-emerald-100 text-brand-green' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    {cli.status || 'Ativo'}
                                  </span>
                                </div>
                                
                                <div className="text-[10px] text-slate-400 font-semibold mt-1.5 leading-none font-mono">
                                  {cli.city || 'Sorocaba'} ({cli.region})
                                </div>

                                <div className="flex justify-between text-[11px] font-black text-slate-700 mt-2 pt-2 border-t border-slate-200/40">
                                  <span>Total Faturado:</span>
                                  <span>R$ {cli.totalSpent.toLocaleString('pt-BR')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-100/50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 font-semibold">
                          <p>Não há nenhum estabelecimento comercial registrado no ERP apontando para este vendedor.</p>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Operational Footer actions block */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-3 shrink-0">
                    <div className="flex-1 text-[10.5px] text-slate-400 font-semibold flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1 text-slate-400 shrink-0" />
                      <span>Liquidações registradas no D.F. de forma irrefutável.</span>
                    </div>

                    {/* Botão Excluir */}
                    <button
                      onClick={() => openDeleteModal(s)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-lg text-[10px] uppercase tracking-wide transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      <span>Excluir</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedSellerId(null);
                        setPayoutSuccessMessage(null);
                      }}
                      className="px-5 bg-white border border-slate-200 hover:bg-slate-55 text-slate-650 hover:text-slate-800 font-bold transition-colors py-2 rounded-lg cursor-pointer"
                    >
                      Fechar Ficha
                    </button>
                  </div>

                </motion.div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Admissão real de vendedor: cria Auth + perfil comercial */}
      <AnimatePresence>
        {showAddSellerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto"
            onClick={closeSellerAdmissionModal}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 24, stiffness: 240 }}
              onClick={event => event.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
            >
              <div className="bg-slate-950 px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#1E94CF]/20 rounded-xl">
                    <UserPlus className="h-5 w-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Admitir Novo Vendedor</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Criação automática de login e perfil comercial</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeSellerAdmissionModal}
                  disabled={isCreatingSeller}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSellerAccount} className="p-6 space-y-5">
                {sellerCreationError && (
                  <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3.5 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{sellerCreationError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Nome completo</span>
                    <input
                      type="text"
                      value={newName}
                      onChange={event => setNewName(event.target.value)}
                      placeholder="Ex: Anderson Neves"
                      autoComplete="name"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none"
                    />
                  </label>

                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">E-mail de acesso</span>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={newEmail}
                        onChange={event => setNewEmail(event.target.value)}
                        placeholder="vendedor@empresa.com.br"
                        autoComplete="email"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Senha inicial</span>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={event => setNewPassword(event.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Confirmar senha</span>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={newPasswordConfirm}
                        onChange={event => setNewPasswordConfirm(event.target.value)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Celular / contato</span>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={event => setNewPhone(event.target.value)}
                      placeholder="(11) 98888-7777"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Status inicial</span>
                    <select
                      value={newStatus}
                      onChange={event => setNewStatus(event.target.value as 'Ativo' | 'Inativo')}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none"
                    >
                      <option value="Ativo">Ativo — acesso liberado</option>
                      <option value="Inativo">Inativo — acesso bloqueado</option>
                    </select>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Taxa de comissão (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newCommissionRate}
                      onChange={event => setNewCommissionRate(Number(event.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Meta mensal (R$)</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={newTarget}
                      onChange={event => setNewTarget(Number(event.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    A conta será criada no Supabase Auth e vinculada automaticamente ao perfil VENDEDOR no banco.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeSellerAdmissionModal}
                    disabled={isCreatingSeller}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSeller}
                    className="px-5 py-3 bg-[#1E94CF] hover:bg-[#1a85bc] disabled:opacity-60 disabled:cursor-wait text-white font-black rounded-xl text-xs uppercase tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isCreatingSeller ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    <span>{isCreatingSeller ? 'Criando conta...' : 'Criar conta do vendedor'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteModal && sellerToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={closeDeleteModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
            >
              {/* Header vermelho */}
              <div className="bg-gradient-to-r from-rose-600 to-rose-500 p-6 text-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/15 rounded-xl">
                    <UserMinus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight">Excluir Vendedor</h3>
                    <p className="text-[11px] text-rose-200 font-semibold mt-0.5">Esta ação é permanente e irreversível</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Info do vendedor */}
                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-black text-sm shrink-0">
                    {sellerToDelete.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{sellerToDelete.name}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{sellerToDelete.email}</p>
                  </div>
                </div>

                {/* Aviso */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-black text-rose-700">O que acontece ao excluir:</p>
                  <ul className="text-[11px] text-rose-600 font-semibold space-y-0.5 list-disc list-inside">
                    <li>O vendedor é removido da equipe comercial</li>
                    <li>Clientes e pedidos vinculados permanecem no sistema</li>
                    <li>O acesso ao sistema é bloqueado</li>
                  </ul>
                </div>

                {/* Input de código */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Para confirmar, digite o código abaixo no campo:
                  </p>
                  <div className="bg-slate-900 rounded-xl px-4 py-3 text-center">
                    <code className="text-rose-400 font-mono font-black text-sm tracking-widest">
                      {getDeleteCode(sellerToDelete)}
                    </code>
                  </div>
                  <input
                    type="text"
                    value={deleteCodeInput}
                    onChange={e => setDeleteCodeInput(e.target.value.toUpperCase())}
                    placeholder={`Digite ${getDeleteCode(sellerToDelete)}`}
                    className="w-full bg-white border-2 border-slate-200 focus:border-rose-400 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-800 focus:outline-none transition-colors tracking-widest uppercase"
                    autoFocus
                  />
                </div>

                {/* Botoes */}
                <div className="flex space-x-3 pt-1">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteSeller}
                    disabled={deleteCodeInput !== getDeleteCode(sellerToDelete)}
                    className={`flex-1 px-4 py-2.5 font-black rounded-xl text-xs uppercase tracking-wide transition-all ${
                      deleteCodeInput === getDeleteCode(sellerToDelete)
                        ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md hover:shadow-rose-200 hover:scale-[1.02] active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Excluir Definitivamente
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
