import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Eye,
  EyeOff,
  X,
  Check,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  Building2,
  Lock,
  Crown,
  Briefcase,
  CalendarDays,
  ChevronDown
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { apiFetch } from '../lib/api';
import { AuthUser } from '../types';

interface Collaborator {
  id: string;
  auth_id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'VENDEDOR';
  telefone: string;
  ativo: boolean;
  created_at: string;
  comissao_rate?: number;
  meta_vendas?: number;
}

interface CollaboratorManagerProps {
  currentUser: AuthUser;
  isDark: boolean;
  onCollaboratorsChanged?: () => void | Promise<void>;
}

// Helper para buscar token de autenticação (funciona com Supabase e JWT local)
async function getAuthToken(): Promise<string> {
  if (isSupabaseConfigured) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }
  return localStorage.getItem('vertice_erp_token') || '';
}

// Helper para chamadas autenticadas ao backend admin
async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  return apiFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

export default function CollaboratorManager({ currentUser, isDark, onCollaboratorsChanged }: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPerfil, setFilterPerfil] = useState<'all' | 'ADMIN' | 'VENDEDOR'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo'>('all');

  // Modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('');
  const [formPerfil, setFormPerfil] = useState<'ADMIN' | 'VENDEDOR'>('VENDEDOR');
  const [formTelefone, setFormTelefone] = useState('');
  const [formComissaoRate, setFormComissaoRate] = useState<string>('5.0');
  const [formMetaVendas, setFormMetaVendas] = useState<string>('100000');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Delete confirm modal
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCollaborators = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminFetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar colaboradores.');
      setCollaborators(data.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao carregar colaboradores.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const openCreateModal = () => {
    setEditingCollaborator(null);
    setFormNome('');
    setFormEmail('');
    setFormPassword('');
    setFormPasswordConfirm('');
    setFormPerfil('VENDEDOR');
    setFormTelefone('');
    setFormComissaoRate('5.0');
    setFormMetaVendas('100000');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const openEditModal = (col: Collaborator) => {
    setEditingCollaborator(col);
    setFormNome(col.nome);
    setFormEmail(col.email);
    setFormPassword('');
    setFormPasswordConfirm('');
    setFormPerfil(col.perfil);
    setFormTelefone(col.telefone || '');
    setFormComissaoRate(String(col.comissao_rate ?? 5.0));
    setFormMetaVendas(String(col.meta_vendas ?? 100000));
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setEditingCollaborator(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formNome.trim() || !formEmail.trim() || !formPerfil) {
      setErrorMsg('Nome, e-mail e perfil são obrigatórios.');
      return;
    }

    if (!editingCollaborator) {
      if (!formPassword) {
        setErrorMsg('A senha é obrigatória para novos colaboradores.');
        return;
      }
      if (formPassword.length < 8) {
        setErrorMsg('A senha deve ter pelo menos 8 caracteres.');
        return;
      }
      if (formPassword !== formPasswordConfirm) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }
    }

    // Impede ADMIN de alterar o próprio perfil
    if (editingCollaborator && editingCollaborator.auth_id === currentUser.id && formPerfil !== 'ADMIN') {
      setErrorMsg('Você não pode remover seu próprio acesso de administrador.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCollaborator) {
        // Atualizar colaborador existente
        const res = await adminFetch(`/api/admin/users/${editingCollaborator.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nome: formNome.trim(),
            perfil: formPerfil,
            telefone: formTelefone.trim(),
            ...(formPerfil === 'VENDEDOR' ? {
              comissao_rate: parseFloat(formComissaoRate) || 5.0,
              meta_vendas: parseFloat(formMetaVendas.replace(/\D/g, '')) || 100000
            } : {})
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar colaborador.');
        setSuccessMsg(data.message || 'Colaborador atualizado com sucesso!');
      } else {
        // Criar novo colaborador
        const res = await adminFetch('/api/admin/create-user', {
          method: 'POST',
          body: JSON.stringify({
            nome: formNome.trim(),
            email: formEmail.toLowerCase().trim(),
            password: formPassword,
            perfil: formPerfil,
            telefone: formTelefone.trim(),
            ...(formPerfil === 'VENDEDOR' ? {
              comissao_rate: parseFloat(formComissaoRate) || 5.0,
              meta_vendas: parseFloat(formMetaVendas.replace(/\D/g, '')) || 100000
            } : {})
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar colaborador.');
        setSuccessMsg(data.message || 'Colaborador criado com sucesso!');
      }

      await fetchCollaborators();
      await onCollaboratorsChanged?.();
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg(null);
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (col: Collaborator) => {
    if (col.auth_id === currentUser.id) {
      alert('Você não pode desativar sua própria conta.');
      return;
    }

    try {
      const res = await adminFetch(`/api/admin/users/${col.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !col.ativo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchCollaborators();
      await onCollaboratorsChanged?.();
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/users/${deletingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeletingId(null);
      await fetchCollaborators();
      await onCollaboratorsChanged?.();
    } catch (err: any) {
      alert('Erro ao desativar colaborador: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtros
  const filtered = collaborators.filter(col => {
    const matchSearch =
      col.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPerfil = filterPerfil === 'all' || col.perfil === filterPerfil;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'ativo' && col.ativo) ||
      (filterStatus === 'inativo' && !col.ativo);
    return matchSearch && matchPerfil && matchStatus;
  });

  // Métricas de resumo
  const totalAtivos = collaborators.filter(c => c.ativo).length;
  const totalAdmins = collaborators.filter(c => c.perfil === 'ADMIN' && c.ativo).length;
  const totalVendedores = collaborators.filter(c => c.perfil === 'VENDEDOR' && c.ativo).length;
  const totalInativos = collaborators.filter(c => !c.ativo).length;

  // Helpers de estilo
  const cardBase = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-100 text-slate-800 shadow-sm';

  const inputBase = `w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none focus:ring-2 ${
    isDark
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-[#1E94CF] focus:ring-[#1E94CF]/20'
      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#1E94CF] focus:ring-[#1E94CF]/20'
  }`;

  const labelBase = `text-xs font-bold uppercase tracking-wide mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#1E94CF]/10 text-[#1E94CF]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
              Gerenciamento de Colaboradores
            </h2>
            <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cadastre e gerencie contas de acesso do seu time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchCollaborators}
            disabled={isLoading}
            className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E94CF] to-[#1F3767] text-white text-xs font-black uppercase tracking-wide shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Novo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Ativos', value: totalAtivos, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Administradores', value: totalAdmins, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Vendedores', value: totalVendedores, icon: Briefcase, color: 'text-[#1E94CF]', bg: 'bg-[#1E94CF]/10' },
          { label: 'Inativos', value: totalInativos, icon: UserX, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((stat, i) => {
          const IconComp = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`p-4 rounded-2xl border ${cardBase}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {stat.label}
                </span>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <IconComp className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-2xl border ${cardBase}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`${inputBase} pl-9`}
            />
          </div>
          {/* Perfil filter */}
          <div className="relative">
            <select
              value={filterPerfil}
              onChange={e => setFilterPerfil(e.target.value as any)}
              className={`${inputBase} pr-8 appearance-none min-w-[140px] cursor-pointer`}
            >
              <option value="all">Todos os Perfis</option>
              <option value="ADMIN">Administradores</option>
              <option value="VENDEDOR">Vendedores</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className={`${inputBase} pr-8 appearance-none min-w-[140px] cursor-pointer`}
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardBase}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E94CF]" />
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Carregando colaboradores...
            </p>
          </div>
        ) : errorMsg && collaborators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{errorMsg}</p>
            <button
              onClick={fetchCollaborators}
              className="text-[#1E94CF] text-xs font-bold hover:underline cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Users className={`h-10 w-10 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {searchQuery || filterPerfil !== 'all' || filterStatus !== 'all'
                ? 'Nenhum colaborador encontrado com esses filtros.'
                : 'Nenhum colaborador cadastrado ainda.'}
            </p>
            {!searchQuery && filterPerfil === 'all' && filterStatus === 'all' && (
              <button
                onClick={openCreateModal}
                className="text-[#1E94CF] text-xs font-bold hover:underline cursor-pointer"
              >
                + Criar o primeiro colaborador
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b text-left ${isDark ? 'border-slate-800 bg-slate-800/40' : 'border-slate-100 bg-slate-50'}`}>
                    <th className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Colaborador
                    </th>
                    <th className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Contato
                    </th>
                    <th className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Perfil
                    </th>
                    <th className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Status
                    </th>
                    <th className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Cadastrado
                    </th>
                    <th className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-right ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-opacity-50">
                  {filtered.map((col, i) => {
                    const initials = col.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const isSelf = col.auth_id === currentUser.id;
                    return (
                      <motion.tr
                        key={col.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`transition-colors ${isDark ? 'border-slate-800/60 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50/80'}`}
                      >
                        {/* Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm ${
                              col.perfil === 'ADMIN' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-[#1E94CF] to-[#1F3767]'
                            }`}>
                              {initials}
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                {col.nome}
                                {isSelf && (
                                  <span className="ml-2 text-[9px] font-black bg-[#1E94CF]/15 text-[#1E94CF] px-1.5 py-0.5 rounded-full">
                                    VOCÊ
                                  </span>
                                )}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{col.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-5 py-4">
                          {col.telefone ? (
                            <div className="flex items-center space-x-1.5">
                              <Phone className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{col.telefone}</span>
                            </div>
                          ) : (
                            <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
                          )}
                        </td>
                        {/* Perfil */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            col.perfil === 'ADMIN'
                              ? 'bg-amber-500/15 text-amber-600'
                              : 'bg-[#1E94CF]/15 text-[#1E94CF]'
                          }`}>
                            {col.perfil === 'ADMIN' ? <Crown className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                            {col.perfil === 'ADMIN' ? 'Admin' : 'Vendedor'}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            col.ativo
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${col.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {col.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {/* Date */}
                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-1.5">
                            <CalendarDays className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {new Date(col.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(col)}
                              className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                                isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                              }`}
                              title="Editar colaborador"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleStatus(col)}
                                className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                                  col.ativo
                                    ? isDark ? 'hover:bg-amber-500/20 text-amber-500' : 'hover:bg-amber-50 text-amber-500'
                                    : isDark ? 'hover:bg-emerald-500/20 text-emerald-500' : 'hover:bg-emerald-50 text-emerald-500'
                                }`}
                                title={col.ativo ? 'Desativar' : 'Reativar'}
                              >
                                {col.ativo ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {filtered.map((col, i) => {
                const initials = col.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const isSelf = col.auth_id === currentUser.id;
                return (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-4 space-y-3 ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm ${
                          col.perfil === 'ADMIN' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-[#1E94CF] to-[#1F3767]'
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            {col.nome}
                            {isSelf && <span className="ml-2 text-[9px] font-black bg-[#1E94CF]/15 text-[#1E94CF] px-1.5 py-0.5 rounded-full">VOCÊ</span>}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{col.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(col)}
                          className={`p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleStatus(col)}
                            className={`p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                              col.ativo
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-emerald-500/15 text-emerald-500'
                            }`}
                          >
                            {col.ativo ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        col.perfil === 'ADMIN' ? 'bg-amber-500/15 text-amber-600' : 'bg-[#1E94CF]/15 text-[#1E94CF]'
                      }`}>
                        {col.perfil === 'ADMIN' ? <Crown className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                        {col.perfil === 'ADMIN' ? 'Admin' : 'Vendedor'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        col.ativo ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${col.ativo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {col.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {col.telefone && (
                        <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {col.telefone}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className={`px-5 py-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-800/20' : 'border-slate-100 bg-slate-50/60'}`}>
            <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Mostrando {filtered.length} de {collaborators.length} colaboradores
            </span>
            <span className={`text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {totalAtivos} ativos · {totalInativos} inativos
            </span>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              className={`relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-[#0F172A] border border-slate-800' : 'bg-white border border-slate-100'
              }`}
            >
              {/* Modal Header */}
              <div className={`sticky top-0 z-10 px-6 py-5 border-b flex items-center justify-between ${
                isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-100'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#1E94CF]/10 text-[#1E94CF]">
                    {editingCollaborator ? <Pencil className="h-4.5 w-4.5" /> : <UserPlus className="h-4.5 w-4.5" />}
                  </div>
                  <div>
                    <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#1F3767]'}`}>
                      {editingCollaborator ? 'Editar Colaborador' : 'Novo Colaborador'}
                    </h3>
                    <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {editingCollaborator ? `Atualizando dados de ${editingCollaborator.nome}` : 'Preencha as informações abaixo'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Nome */}
                <div>
                  <label className={labelBase}>Nome Completo *</label>
                  <input
                    type="text"
                    placeholder="Ex: Ana Paula Santos"
                    value={formNome}
                    onChange={e => setFormNome(e.target.value)}
                    className={inputBase}
                    required
                    autoFocus
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={labelBase}>E-mail / Login *</label>
                  <div className="relative">
                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="email"
                      placeholder="colaborador@empresa.com"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      className={`${inputBase} pl-10`}
                      required
                      disabled={!!editingCollaborator}
                    />
                  </div>
                  {editingCollaborator && (
                    <p className={`text-[11px] mt-1 font-semibold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      O e-mail não pode ser alterado após o cadastro.
                    </p>
                  )}
                </div>

                {/* Perfil */}
                <div>
                  <label className={labelBase}>Cargo / Perfil de Acesso *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'VENDEDOR', label: 'Vendedor', sub: 'Portal de Vendas', Icon: Briefcase, gradient: 'from-[#1E94CF] to-[#1F3767]' },
                      { value: 'ADMIN', label: 'Administrador', sub: 'Acesso completo ao ERP', Icon: Crown, gradient: 'from-amber-500 to-orange-600' }
                    ] as const).map(({ value, label, sub, Icon, gradient }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormPerfil(value)}
                        className={`relative p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          formPerfil === value
                            ? `border-[#1E94CF] ${isDark ? 'bg-[#1E94CF]/10' : 'bg-[#1E94CF]/5'}`
                            : `${isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-2`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <p className={`text-xs font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{label}</p>
                        <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>
                        {formPerfil === value && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-[#1E94CF] rounded-full flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Senha (somente para criação) */}
                {!editingCollaborator && (
                  <>
                    <div>
                      <label className={labelBase}>Senha *</label>
                      <div className="relative">
                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 8 caracteres"
                          value={formPassword}
                          onChange={e => setFormPassword(e.target.value)}
                          className={`${inputBase} pl-10 pr-10`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelBase}>Confirmar Senha *</label>
                      <div className="relative">
                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input
                          type={showPasswordConfirm ? 'text' : 'password'}
                          placeholder="Repita a senha"
                          value={formPasswordConfirm}
                          onChange={e => setFormPasswordConfirm(e.target.value)}
                          className={`${inputBase} pl-10 pr-10 ${
                            formPasswordConfirm && formPassword !== formPasswordConfirm
                              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20'
                              : formPasswordConfirm && formPassword === formPasswordConfirm
                              ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20'
                              : ''
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm(p => !p)}
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formPasswordConfirm && formPassword !== formPasswordConfirm && (
                        <p className="text-[11px] text-rose-500 font-semibold mt-1">As senhas não coincidem.</p>
                      )}
                    </div>
                  </>
                )}

                {/* Telefone */}
                <div>
                  <label className={labelBase}>Telefone (opcional)</label>
                  <div className="relative">
                    <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formTelefone}
                      onChange={e => setFormTelefone(e.target.value)}
                      className={`${inputBase} pl-10`}
                    />
                  </div>
                </div>

                {/* Campos exclusivos VENDEDOR: Comissão e Meta */}
                {formPerfil === 'VENDEDOR' && (
                  <div className={`p-4 rounded-xl border space-y-4 ${
                    isDark ? 'bg-[#1E94CF]/5 border-[#1E94CF]/20' : 'bg-[#1E94CF]/5 border-[#1E94CF]/15'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-3.5 w-3.5 text-[#1E94CF]" />
                      <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Parâmetros Comerciais
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelBase}>Taxa de Comissão (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="5.0"
                            value={formComissaoRate}
                            onChange={e => setFormComissaoRate(e.target.value)}
                            className={inputBase}
                          />
                          <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>%</span>
                        </div>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Calculada sobre o total de vendas</p>
                      </div>
                      <div>
                        <label className={labelBase}>Meta Mensal (R$)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="100000"
                            value={formMetaVendas}
                            onChange={e => setFormMetaVendas(e.target.value)}
                            className={inputBase}
                          />
                          <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>R$</span>
                        </div>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Objetivo de faturamento mensal</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback messages */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20"
                    >
                      <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-semibold text-rose-500">{errorMsg}</p>
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-semibold text-emerald-500">{successMsg}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${
                      isDark
                        ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#1E94CF] to-[#1F3767] text-white text-xs font-black uppercase tracking-wide shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{editingCollaborator ? 'Salvando...' : 'Criando...'}</span>
                      </>
                    ) : (
                      <span>{editingCollaborator ? 'Salvar Alterações' : 'Criar Colaborador'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
