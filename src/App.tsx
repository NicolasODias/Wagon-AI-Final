/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CLIENTS, 
  INITIAL_ORDERS, 
  INITIAL_LEDGER,
  INITIAL_SELLERS,
  INITIAL_COMMISSIONS
} from './data';
import { Product, Client, Order, FinancialRecord, Seller, AuthUser, StockMovement, Commission } from './types';
import Sidebar from './components/Sidebar';
import DashboardBI from './components/DashboardBI';
import SalesCRM from './components/SalesCRM';
import Inventory from './components/Inventory';
import Finance from './components/Finance';
import Sellers, { SellerAdmissionInput } from './components/Sellers';
import SalesPortal from './components/SalesPortal';
import VirtualCFO from './components/VirtualCFO';
import LoginPremium from './components/LoginPremium';
import PublicInvoicePortal from './components/PublicInvoicePortal';
import CollaboratorManager from './components/CollaboratorManager';
import { supabase, isSupabaseConfigured, getCurrentAccessToken, fetchCurrentUserProfile } from './lib/supabaseClient';
import { 
  Building2, 
  Bell, 
  Search, 
  HelpCircle, 
  User, 
  Activity, 
  DollarSign,
  AlertTriangle,
  Settings,
  LayoutDashboard,
  Boxes,
  Users,
  Cpu,
  Loader2,
  LogOut
} from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  // Sync onpopstate to correctly re-route in SPAs
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userPortal, setUserPortal] = useState<'admin' | 'vendedor'>('admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [salesSubTab, setSalesSubTab] = useState<'pipeline' | 'crm' | 'new-order'>('pipeline');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const cached = localStorage.getItem('vertice_erp_theme');
    return cached === 'dark' ? 'dark' : 'light';
  });

  // Verify dynamic user session on mount (supports both custom local JWT and Supabase Auth)
  useEffect(() => {
    let subscription: any = null;

    const fetchUserProfile = async (_supabaseUser: any, accessToken?: string): Promise<AuthUser | null> => {
      try {
        return await fetchCurrentUserProfile(accessToken);
      } catch (err) {
        console.error('[Supabase Profile Error]', err);
        return null;
      }
    };

    const checkSupabaseAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          const mappedUser = await fetchUserProfile(session.user, session.access_token);
          if (!mappedUser) {
            await supabase.auth.signOut();
            setCurrentUser(null);
          } else {
            setCurrentUser(mappedUser);
            setUserPortal(mappedUser.role === 'ADMIN' ? 'admin' : 'vendedor');
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('[Supabase Session Load Error]', err);
      } finally {
        setIsLoadingSession(false);
      }

      // Live listener to any external Supabase authentication state changes
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const mappedUser = await fetchUserProfile(session.user, session.access_token);
          if (!mappedUser) {
            setCurrentUser(null);
          } else {
            setCurrentUser(mappedUser);
            setUserPortal(mappedUser.role === 'ADMIN' ? 'admin' : 'vendedor');
          }
        } else {
          setCurrentUser(null);
        }
      });
      subscription = data.subscription;
    };

    if (isSupabaseConfigured) {
      checkSupabaseAuth();
    } else {
      const token = localStorage.getItem('vertice_erp_token');
      if (!token) {
        setIsLoadingSession(false);
        return;
      }

      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Sessão expirada');
        return res.json();
      })
      .then(data => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'VENDEDOR') {
            setUserPortal('vendedor');
          } else {
            setUserPortal('admin');
          }
        } else {
          localStorage.removeItem('vertice_erp_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('vertice_erp_token');
      })
      .finally(() => {
        setIsLoadingSession(false);
      });
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    if (!isSupabaseConfigured) {
      localStorage.setItem('vertice_erp_token', token);
    }
    if (user.role === 'VENDEDOR') {
      setUserPortal('vendedor');
    } else {
      setUserPortal('admin');
      setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[Supabase Logout Error]', err);
      }
    }
    setCurrentUser(null);
    setUserPortal('admin');
    localStorage.removeItem('vertice_erp_token');
  };

  useEffect(() => {
    localStorage.setItem('vertice_erp_theme', theme);
  }, [theme]);

  // Sync activeTab with salesSubTab for pipeline/crm
  useEffect(() => {
    if (activeTab === 'pipeline') {
      setSalesSubTab('pipeline');
    } else if (activeTab === 'crm') {
      setSalesSubTab('crm');
    }
  }, [activeTab]);

  const toggleDarkMode = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Unified reactive state, persistent via localStorage
  const [products, setProducts] = useState<Product[]>(() => {
    if (isSupabaseConfigured) return [];
    const cached = localStorage.getItem('vertice_erp_products');
    return cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    if (isSupabaseConfigured) return [];
    const cached = localStorage.getItem('vertice_erp_clients');
    return cached ? JSON.parse(cached) : INITIAL_CLIENTS;
  });

  const [commissions, setCommissions] = useState<Commission[]>(() => {
    if (isSupabaseConfigured) return [];
    const cached = localStorage.getItem('vertice_erp_commissions');
    return cached ? JSON.parse(cached) : INITIAL_COMMISSIONS;
  });

  const fetchClientsFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('auth_id, nome');
      
      const userMap = new Map<string, string>();
      if (usersData) {
        usersData.forEach(u => {
          if (u.auth_id && u.nome) {
            userMap.set(u.auth_id, u.nome);
          }
        });
      }

      const { data: selectData, error: selectErr } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectErr) throw selectErr;

      if (selectData) {
        const mappedClients: Client[] = selectData.map((row: any) => {
          const sellerName = row.vendedor_id ? (userMap.get(row.vendedor_id) || 'Vendedor 01') : 'Nenhum';
          return {
            id: row.id,
            name: row.nome_negocio,
            cnpj: row.cnpj,
            email: row.email || 'comercial@empresa.com.br',
            phone: row.telefone || '(11) 9999-9999',
            creditLimit: Number(row.credit_limit) || 30000,
            debtBalance: Number(row.debt_balance) || 0,
            region: (row.region as any) || 'Sudeste',
            purchaseCount: Number(row.purchase_count) || 0,
            totalSpent: Number(row.total_spent) || 0,
            riskClass: (row.risk_class as any) || 'A',
            city: row.cidade || '',
            owner: row.proprietario || '',
            salesRep: sellerName,
            status: (row.status as any) || 'Ativo',
            consignments: row.consignments || [],
            codigo_cliente: row.codigo_cliente,
            endereco: row.endereco,
            vendedor_id: row.vendedor_id
          };
        });
        setClients(mappedClients);
      }
    } catch (err) {
      console.error('[Supabase Fetch Clients Error]', err);
    }
  };

  const fetchProductsFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      if (data) {
        const mapped: Product[] = data.map((row: any) => ({
          id: row.id,
          name: row.nome,
          sku: row.codigo_produto,
          category: row.categoria,
          brand: row.marca || 'Diverso',
          stock: Number(row.quantidade),
          minStock: Number(row.min_stock) || 10,
          unit: row.unit || 'un',
          costPrice: Number(row.valor_compra),
          sellingPrice: Number(row.valor_venda),
          corridor: row.corredor || 'A-01',
          shelf: row.prateleira || 'Nível 1',
          status: Number(row.quantidade) <= 0 ? 'critico' : (Number(row.quantidade) <= (Number(row.min_stock) || 10) ? 'baixo_estoque' : 'normal') as any,
          commissionPercent: Number(row.comissao_percentual) || 5,
          impostoPercent: Number(row.imposto_percentual) || 8
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error('[Supabase Fetch Products Error]', err);
    }
  };

  const fetchStockMovementsFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: prodData, error: prodErr } = await supabase
        .from('produtos')
        .select('id, nome, codigo_produto');

      const prodMap = new Map<string, { nome: string, sku: string }>();
      if (prodData) {
        prodData.forEach(p => {
          prodMap.set(p.id, { nome: p.nome, sku: p.codigo_produto });
        });
      }

      const { data: moveData, error: moveErr } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false });

      if (moveErr) throw moveErr;

      if (moveData) {
        const mappedMovements: StockMovement[] = moveData.map((row: any) => {
          const prodInfo = prodMap.get(row.produto_id) || { nome: 'Produto Desconhecido', sku: 'SKU-000' };
          return {
            id: row.id,
            produto_id: row.produto_id,
            produto_nome: prodInfo.nome,
            produto_sku: prodInfo.sku,
            tipo: row.tipo,
            quantidade: Number(row.quantidade),
            valor: Number(row.valor),
            observacao: row.observacao || '',
            created_at: row.created_at
          };
        });
        setStockMovements(mappedMovements);
      }
    } catch (err) {
      console.error('[Supabase Fetch Movements Error]', err);
    }
  };

  const mapTypeToDb = (type: 'receita' | 'despesa') => {
    return type === 'receita' ? 'ENTRADA' : 'SAIDA';
  };

  const mapStatusToDb = (status: 'Pendente' | 'Pago' | 'Atrasado') => {
    if (status === 'Pendente') return 'PENDENTE';
    if (status === 'Pago') return 'PAGO';
    return 'ATRASADO';
  };

  const mapCategoryToDb = (cat: string) => {
    const allowedCategories = [
      'Compra de Mercadoria',
      'Frete',
      'Impostos',
      'Salários',
      'Comissões',
      'Marketing',
      'Energia',
      'Água',
      'Internet',
      'Aluguel',
      'Equipamentos',
      'Serviços',
      'Outros'
    ];
    if (allowedCategories.includes(cat)) {
      return cat;
    }
    if (cat === 'Vendas') return 'Outros';
    if (cat === 'Logística') return 'Frete';
    if (cat === 'Folha Pgto') return 'Salários';
    if (cat === 'Fornecedores') return 'Compra de Mercadoria';
    if (cat === 'Infraestrutura') return 'Equipamentos';
    return 'Outros';
  };

  const fetchFinancialRecordsFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: recordData, error: recordErr } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .order('created_at', { ascending: false });

      if (recordErr) throw recordErr;

      if (recordData) {
        const mappedRecords: FinancialRecord[] = recordData.map((row: any) => {
          let categoryMapped: any = row.categoria;
          if (categoryMapped === 'Salários') categoryMapped = 'Salários';
          else if (categoryMapped === 'Comissões') categoryMapped = 'Comissões';

          return {
            id: row.id,
            type: row.tipo === 'ENTRADA' ? 'receita' : 'despesa',
            description: row.descricao,
            amount: Number(row.valor),
            dueDate: row.due_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            paymentDate: row.data_pagamento || undefined,
            status: row.status === 'PENDENTE' ? 'Pendente' : (row.status === 'PAGO' ? 'Pago' : 'Atrasado'),
            partyName: row.party_name || 'Geral',
            category: categoryMapped,
            pedido_id: row.pedido_id || undefined,
            vendedor_id: row.vendedor_id || undefined
          };
        });
        setFinancialRecords(mappedRecords);
      }
    } catch (err) {
      console.error('[Supabase Fetch Financial Records Error]', err);
    }
  };

  const fetchCommissionsFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('comissoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: Commission[] = data.map((row: any) => ({
          id: row.id,
          pedido_id: row.pedido_id,
          vendedor_id: row.vendedor_id,
          valor: Number(row.valor),
          status: row.status as 'PENDENTE' | 'PARCIAL' | 'PAGO',
          data_pagamento: row.data_pagamento || undefined,
          observacao: row.observacao || ''
        }));
        setCommissions(mapped);
      }
    } catch (err) {
      console.error('[Supabase Fetch Commissions Error]', err);
    }
  };

  const fetchSellersFromSupabase = async () => {
    if (!isSupabaseConfigured || !currentUser) return;

    try {
      if (currentUser.role === 'VENDEDOR') {
        setSellers([{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.telefone || '',
          status: 'Ativo',
          commissionRate: 5,
          target: 100000
        }]);
        return;
      }

      const { data: sellerRows, error: sellerError } = await supabase
        .from('users')
        .select('auth_id, nome, email, perfil')
        .eq('perfil', 'VENDEDOR');

      if (sellerError) throw sellerError;

      const mappedSellers: Seller[] = (sellerRows || []).map((row: any) => ({
        id: row.auth_id,
        name: row.nome,
        email: row.email,
        phone: '',
        status: 'Ativo',
        commissionRate: 5,
        target: 100000
      }));

      setSellers(mappedSellers);
    } catch (err) {
      console.error('[Fetch Sellers Error]', err);
    }
  };

  const handleCreateSellerAccount = async (input: SellerAdmissionInput) => {
    if (!isSupabaseConfigured) {
      throw new Error('Configure o Supabase para criar contas reais de vendedores.');
    }

    const token = await getCurrentAccessToken();
    if (!token) {
      throw new Error('Sessão administrativa expirada. Entre novamente.');
    }

    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...input,
        perfil: 'VENDEDOR'
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível criar a conta do vendedor.');
    }

    await fetchSellersFromSupabase();
  };

  const fetchOrdersFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    try {
      // Busca mapas de nomes para resolver IDs em nomes legíveis
      const [clientRes, productRes, userRes] = await Promise.all([
        supabase.from('clientes').select('id, nome_negocio'),
        supabase.from('produtos').select('id, nome'),
        supabase.from('users').select('auth_id, nome').eq('perfil', 'VENDEDOR')
      ]);

      const clientMap = new Map<string, string>(
        (clientRes.data || []).map((c: any) => [c.id, c.nome_negocio])
      );
      const productMap = new Map<string, string>(
        (productRes.data || []).map((p: any) => [p.id, p.nome])
      );
      const vendedorMap = new Map<string, string>(
        (userRes.data || []).map((u: any) => [u.auth_id, u.nome])
      );

      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          cliente_id,
          vendedor_id,
          valor_total,
          status,
          nf_emitida,
          created_at,
          pedido_itens (id, produto_id, quantidade, valor_unitario, valor_total)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: Order[] = data.map((row: any) => ({
          id: row.id,
          clientId: row.cliente_id,
          clientName: clientMap.get(row.cliente_id) || 'Cliente',
          date: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          items: (row.pedido_itens || []).map((item: any) => ({
            id: item.id,
            productId: item.produto_id,
            productName: productMap.get(item.produto_id) || 'Produto',
            quantity: Number(item.quantidade),
            unitPrice: Number(item.valor_unitario),
            total: item.valor_total == null
              ? Number(item.quantidade) * Number(item.valor_unitario)
              : Number(item.valor_total)
          })),
          subtotal: Number(row.valor_total),
          taxes: { icms: 0, ipi: 0, pisCofins: 0, total: 0 },
          total: Number(row.valor_total),
          marginPercent: 32,
          status: row.status === 'CANCELADO' ? 'Cancelado' : 'Aguardando Faturamento',
          paymentTerm: '30 Dias',
          salesRep: vendedorMap.get(row.vendedor_id) || '',
          vendedor_id: row.vendedor_id
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.error('[Supabase Fetch Orders Error]', err);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured && currentUser) {
      fetchClientsFromSupabase();
      fetchProductsFromSupabase();
      fetchStockMovementsFromSupabase();
      fetchFinancialRecordsFromSupabase();
      fetchCommissionsFromSupabase();
      fetchSellersFromSupabase();
      fetchOrdersFromSupabase();
    }
  }, [currentUser]);

  // One-time automatic production reset of demo data to start as a fresh install
  useEffect(() => {
    const isCleaned = localStorage.getItem('wagon_production_clean_v7');
    if (isCleaned !== 'true') {
      localStorage.removeItem('vertice_erp_products');
      localStorage.removeItem('vertice_erp_clients');
      localStorage.removeItem('vertice_erp_orders');
      localStorage.removeItem('vertice_erp_ledger');
      localStorage.removeItem('vertice_erp_sellers');
      localStorage.removeItem('vertice_erp_commissions');
      localStorage.removeItem('vertice_erp_stock_movements');
      localStorage.removeItem('vertice_stock_entry_logs');
      localStorage.removeItem('wagon_executive_reports_history');
      
      setProducts([]);
      setClients([]);
      setOrders([]);
      setFinancialRecords([]);
      setSellers(INITIAL_SELLERS);
      setCommissions([]);
      setStockMovements([]);
      
      localStorage.setItem('wagon_production_clean_v7', 'true');
    }
  }, []);

  const [orders, setOrders] = useState<Order[]>(() => {
    if (isSupabaseConfigured) return [];
    const cached = localStorage.getItem('vertice_erp_orders');
    return cached ? JSON.parse(cached) : INITIAL_ORDERS;
  });

  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    const cached = localStorage.getItem('vertice_erp_ledger');
    return cached ? JSON.parse(cached) : INITIAL_LEDGER;
  });

  const [sellers, setSellers] = useState<Seller[]>(() => {
    if (isSupabaseConfigured) return [];
    const cached = localStorage.getItem('vertice_erp_sellers');
    return cached ? JSON.parse(cached) : INITIAL_SELLERS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    if (isSupabaseConfigured) return [];
    const cached = localStorage.getItem('vertice_erp_stock_movements');
    return cached ? JSON.parse(cached) : [];
  });

  // Sync state to local storage when changed
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('vertice_erp_products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('vertice_erp_clients', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('vertice_erp_orders', JSON.stringify(orders));
    }
  }, [orders]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('vertice_erp_ledger', JSON.stringify(financialRecords));
    }
  }, [financialRecords]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('vertice_erp_sellers', JSON.stringify(sellers));
    }
  }, [sellers]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('vertice_erp_commissions', JSON.stringify(commissions));
    }
  }, [commissions]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('vertice_erp_stock_movements', JSON.stringify(stockMovements));
    }
  }, [stockMovements]);

  // Operational notification indicators
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  
  const unbilledOrdersCount = orders.filter(o => o.status === 'Aguardando Faturamento').length;
  
  const pendingBillsCount = financialRecords.filter(f => f.type === 'despesa' && f.status === 'Pendente').length;

  // Global State Handlers
  const handleAddOrder = async (newOrder: Order) => {
    if (isSupabaseConfigured) {
      const sellerId = newOrder.vendedor_id
        || (currentUser?.role === 'VENDEDOR' ? currentUser.id : undefined)
        || sellers.find(s => s.name === newOrder.salesRep)?.id;

      if (!sellerId) {
        throw new Error('Não foi possível identificar o vendedor responsável.');
      }

      const seller = sellers.find(s => s.id === sellerId);
      if (!seller || seller.status !== 'Ativo') {
        throw new Error('O vendedor responsável está inativo ou não foi encontrado.');
      }

      const financialId = `FIN-${crypto.randomUUID()}`;
      const commissionId = `COM-${crypto.randomUUID()}`;
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { error } = await supabase.rpc('criar_pedido_completo', {
        p_pedido_id: newOrder.id,
        p_cliente_id: newOrder.clientId,
        p_vendedor_id: sellerId,
        p_valor_total: newOrder.total,
        p_itens: newOrder.items.map(item => ({
          produto_id: item.productId,
          quantidade: item.quantity,
          valor_unitario: item.unitPrice,
          valor_total: item.total
        })),
        p_financeiro_id: financialId,
        p_comissao_id: commissionId,
        p_due_date: dueDate
      });

      if (error) {
        console.error('[Supabase Atomic Order Error]', error);
        throw new Error(error.message || 'Não foi possível concluir a venda.');
      }

      await Promise.all([
        fetchOrdersFromSupabase(),
        fetchProductsFromSupabase(),
        fetchStockMovementsFromSupabase(),
        fetchClientsFromSupabase(),
        fetchFinancialRecordsFromSupabase(),
        fetchCommissionsFromSupabase()
      ]);
      return;
    }

    setOrders([newOrder, ...orders]);
    
    // Auto-update stock levels of purchased products
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const itemInOrder = newOrder.items.find(it => it.productId === prod.id);
        if (itemInOrder) {
          const updatedStock = Math.max(0, prod.stock - itemInOrder.quantity);

          // Log stock movement!
          const movId = `mov-${Math.random().toString(36).substring(2, 9)}`;
          const newMov: StockMovement = {
            id: movId,
            produto_id: prod.id,
            produto_nome: prod.name,
            produto_sku: prod.sku,
            tipo: 'SAIDA',
            quantidade: itemInOrder.quantity,
            valor: prod.sellingPrice,
            observacao: `Venda Ref: Pedido #${newOrder.id.substring(0, 8)}`,
            created_at: new Date().toISOString()
          };

          // Append movement record locally
          setTimeout(() => {
            setStockMovements(prev => [newMov, ...prev]);
            
            // Sync with Supabase (if configured)
            if (isSupabaseConfigured) {
              supabase.from('movimentacoes_estoque').insert([{
                produto_id: prod.id,
                tipo: 'SAIDA',
                quantidade: itemInOrder.quantity,
                valor: prod.sellingPrice,
                observacao: `Venda Ref: Pedido #${newOrder.id.substring(0, 8)}`
              }]).then(({ error }) => {
                if (error) console.error('[Supabase SAIDA Error]', error);
              });

              supabase.from('produtos').update({
                quantidade: updatedStock
              }).eq('id', prod.id).then(({ error }) => {
                if (error) console.error('[Supabase product stock update error]', error);
              });
            }
          }, 50);

          return {
            ...prod,
            stock: updatedStock,
            status: updatedStock <= prod.minStock * 0.4 ? 'critico' : (updatedStock <= prod.minStock ? 'baixo_estoque' : 'normal') as any
          };
        }
        return prod;
      });
    });

    // Auto-adjust debtor balance on CRM client record
    setClients(prevClients => {
      return prevClients.map(cli => {
        if (cli.id === newOrder.clientId) {
          const updatedDebt = cli.debtBalance + newOrder.total;
          const updatedPurchases = cli.purchaseCount + 1;
          const updatedTotalSpent = cli.totalSpent + newOrder.total;

          // Sync client update to Supabase
          if (isSupabaseConfigured) {
            supabase.from('clientes').update({
              debt_balance: updatedDebt,
              purchase_count: updatedPurchases,
              total_spent: updatedTotalSpent
            }).eq('id', cli.id).then(({ error }) => {
              if (error) console.error('[Supabase Client Update on Order Error]', error);
            });
          }

          return {
            ...cli,
            debtBalance: updatedDebt,
            purchaseCount: updatedPurchases,
            totalSpent: updatedTotalSpent
          };
        }
        return cli;
      });
    });

    // Auto-append appropriate Receivable to financial ledger
    const newReceivable: FinancialRecord = {
      id: `FIN-${Math.floor(100 + Math.random() * 900)}`,
      type: 'receita',
      description: `Faturamento Pedido ${newOrder.id}`,
      amount: newOrder.total,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // standard 30d
      status: 'Pendente',
      partyName: newOrder.clientName,
      category: 'Vendas'
    };
    handleAddTransaction(newReceivable);

    // Automatic Commission Calculation
    const repName = newOrder.salesRep || clients.find(c => c.id === newOrder.clientId)?.salesRep || currentUser?.name || 'Marcos Pinheiro';
    const matchingSeller = sellers.find(s => s.name.trim().toLowerCase() === repName.trim().toLowerCase()) || sellers[0];
    const commissionVal = Number((newOrder.total * (matchingSeller.commissionRate / 100)).toFixed(2));
    
    const commissionId = `COM-${Math.floor(1000 + Math.random() * 9000)}`;
    const autoCommission: Commission = {
      id: commissionId,
      pedido_id: newOrder.id,
      vendedor_id: matchingSeller.id,
      valor: commissionVal,
      status: 'PENDENTE',
      observacao: `Comissão calculada automaticamente sobre Pedido ${newOrder.id} para ${matchingSeller.name}`
    };

    setCommissions(prev => [autoCommission, ...prev]);

    if (isSupabaseConfigured) {
      supabase.from('comissoes').insert([{
        id: autoCommission.id,
        pedido_id: autoCommission.pedido_id,
        vendedor_id: autoCommission.vendedor_id,
        valor: autoCommission.valor,
        status: autoCommission.status,
        observacao: autoCommission.observacao
      }]).then(({ error }) => {
        if (error) console.error('[Supabase Auto Insert Commission Error]', error);
      });
    }

    // DB SYNC: Pedidos and Pedido_itens insertion
    if (isSupabaseConfigured) {
      supabase.from('pedidos').insert([{
        id: newOrder.id,
        cliente_id: newOrder.clientId,
        vendedor_id: currentUser?.id || null,
        valor_total: newOrder.total,
        status: 'FINALIZADO',
        nf_emitida: !!newOrder.invoiceNumber
      }]).then(({ error }) => {
        if (error) {
          console.error('[Supabase Insert Pedido Error]', error);
        } else {
          // Process nested order items
          const dbItens = newOrder.items.map(it => ({
            pedido_id: newOrder.id,
            produto_id: it.productId,
            quantidade: it.quantity,
            valor_unitario: it.unitPrice
          }));
          supabase.from('pedido_itens').insert(dbItens).then(({ error: itemsErr }) => {
            if (itemsErr) console.error('[Supabase Insert Pedido Itens Error]', itemsErr);
          });
        }
      });
    }
  };

  const handlePayCommissionInApp = (sellerId: string, amountToPay: number) => {
    let remaining = amountToPay;
    setCommissions(prev => {
      const updated = prev.map(c => {
        if (c.vendedor_id === sellerId && (c.status === 'PENDENTE' || c.status === 'PARCIAL') && remaining > 0) {
          if (remaining >= c.valor) {
            remaining -= c.valor;
            if (isSupabaseConfigured) {
              supabase.from('comissoes').update({
                status: 'PAGO',
                data_pagamento: new Date().toISOString().split('T')[0]
              }).eq('id', c.id).then(({ error }) => {
                if (error) console.error('[Supabase Update Commission PAGO Error]', error);
              });
            }
            return {
              ...c,
              status: 'PAGO' as const,
              data_pagamento: new Date().toISOString().split('T')[0]
            };
          } else {
            const leftOver = c.valor - remaining;
            remaining = 0;
            if (isSupabaseConfigured) {
              supabase.from('comissoes').update({
                status: 'PARCIAL',
                observacao: `Pago parcialmente. Restam R$ ${leftOver.toFixed(2)}`
              }).eq('id', c.id).then(({ error }) => {
                if (error) console.error('[Supabase Update Commission PARCIAL Error]', error);
              });
            }
            return {
              ...c,
              status: 'PARCIAL' as const,
              observacao: `Pago parcialmente. Restam R$ ${leftOver.toFixed(2)}`
            };
          }
        }
        return c;
      });
      return updated;
    });
  };

  const handleAddClient = async (newClient: Client) => {
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const dbRow = {
          nome_negocio: newClient.name,
          cnpj: newClient.cnpj,
          endereco: newClient.endereco || '',
          cidade: newClient.city || '',
          proprietario: newClient.owner || '',
          telefone: newClient.phone || '',
          email: newClient.email || '',
          credit_limit: newClient.creditLimit || 30000,
          debt_balance: newClient.debtBalance || 0,
          region: newClient.region || 'Sudeste',
          purchase_count: newClient.purchaseCount || 0,
          total_spent: newClient.totalSpent || 0,
          risk_class: newClient.riskClass || 'A',
          status: newClient.status || 'Ativo',
          consignments: newClient.consignments || [],
          vendedor_id: currentUser?.role === 'ADMIN'
            ? (newClient.vendedor_id || session?.user?.id || null)
            : (session?.user?.id || null)
        };

        const { error } = await supabase
          .from('clientes')
          .insert([dbRow]);

        if (error) throw error;
        await fetchClientsFromSupabase();
      } catch (err) {
        console.error('[Supabase Add Client Error]', err);
        alert('Erro ao cadastrar cliente no Supabase: ' + (err as any).message);
      }
    } else {
      setClients([newClient, ...clients]);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          nome_negocio: updatedClient.name,
          cnpj: updatedClient.cnpj,
          endereco: updatedClient.endereco || '',
          cidade: updatedClient.city || '',
          proprietario: updatedClient.owner || '',
          telefone: updatedClient.phone || '',
          email: updatedClient.email || '',
          credit_limit: updatedClient.creditLimit,
          debt_balance: updatedClient.debtBalance,
          region: updatedClient.region,
          purchase_count: updatedClient.purchaseCount,
          total_spent: updatedClient.totalSpent,
          risk_class: updatedClient.riskClass,
          status: updatedClient.status,
          consignments: updatedClient.consignments,
          vendedor_id: updatedClient.vendedor_id || null
        };

        const { error } = await supabase
          .from('clientes')
          .update(dbRow)
          .eq('id', updatedClient.id);

        if (error) throw error;
        await fetchClientsFromSupabase();
      } catch (err) {
        console.error('[Supabase Update Client Error]', err);
        alert('Erro ao atualizar cliente no Supabase: ' + (err as any).message);
      }
    } else {
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('clientes')
          .delete()
          .eq('id', clientId);

        if (error) throw error;
        await fetchClientsFromSupabase();
      } catch (err) {
        console.error('[Supabase Delete Client Error]', err);
        alert('Erro ao excluir cliente no Supabase: ' + (err as any).message);
      }
    } else {
      setClients(clients.filter(c => c.id !== clientId));
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleReceiveStock = (productId: string, qtyToAdd: number, observation?: string, unitPrice?: number) => {
    setProducts(prevProducts => prevProducts.map(prod => {
      if (prod.id === productId) {
        const newQty = prod.stock + qtyToAdd;
        
        // Formulate real stock movement register
        const movId = `mov-${Math.random().toString(36).substring(2, 9)}`;
        const newMov: StockMovement = {
          id: movId,
          produto_id: productId,
          produto_nome: prod.name,
          produto_sku: prod.sku,
          tipo: 'ENTRADA',
          quantidade: qtyToAdd,
          valor: unitPrice || prod.costPrice,
          observacao: observation || 'Lote de Reabastecimento',
          created_at: new Date().toISOString()
        };

        // Append locally
        setStockMovements(prev => [newMov, ...prev]);

        // Guard/Sync to database
        if (isSupabaseConfigured) {
          // Push entry to movimentacoes_estoque
          supabase.from('movimentacoes_estoque').insert([{
            produto_id: productId,
            tipo: 'ENTRADA',
            quantidade: qtyToAdd,
            valor: unitPrice || prod.costPrice,
            observacao: observation || 'Lote de Reabastecimento'
          }]).then(({ error }) => {
            if (error) console.error('[Supabase Entry Error]', error);
          });

          // Update stock on table produtos
          supabase.from('produtos').update({
            quantidade: newQty
          }).eq('id', productId).then(({ error }) => {
            if (error) console.error('[Supabase SKU Qty update failed]', error);
          });
        }

        return {
          ...prod,
          stock: newQty,
          status: newQty <= prod.minStock * 0.4 ? 'critico' : (newQty <= prod.minStock ? 'baixo_estoque' : 'normal') as any
        };
      }
      return prod;
    }));
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status'], invoiceNum?: string) => {
    const existingOrder = orders.find(o => o.id === orderId);
    
    if (existingOrder && newStatus === 'Cancelado') {
      // 0. Permission check: Only ADMIN can cancel orders
      if (currentUser?.role !== 'ADMIN') {
        alert('🚫 Permissão negada: Apenas administradores cadastrados no ERP possuem permissão para cancelar pedidos.');
        return;
      }

      if (existingOrder.status !== 'Cancelado') {
        // 1. Estornar estoque (Return stock level for products in this order)
        setProducts(prevProducts => prevProducts.map(prod => {
          const itemInOrder = existingOrder.items.find(it => it.productId === prod.id);
          if (itemInOrder) {
            const updatedStock = prod.stock + itemInOrder.quantity;
            
            // Log adjustment entry
            const movId = `mov-${Math.random().toString(36).substring(2, 9)}`;
            const newMov: StockMovement = {
              id: movId,
              produto_id: prod.id,
              produto_nome: prod.name,
              produto_sku: prod.sku,
              tipo: 'ENTRADA',
              quantidade: itemInOrder.quantity,
              valor: prod.sellingPrice,
              observacao: `Estorno de Estoque: Cancelamento de Pedido #${existingOrder.id.substring(0, 8)}`,
              created_at: new Date().toISOString()
            };

            setTimeout(() => {
              setStockMovements(prev => [newMov, ...prev]);
              
              // Sync with Supabase (if configured)
              if (isSupabaseConfigured) {
                supabase.from('movimentacoes_estoque').insert([{
                  produto_id: prod.id,
                  tipo: 'ENTRADA',
                  quantidade: itemInOrder.quantity,
                  valor: prod.sellingPrice,
                  observacao: `Estorno de Estoque: Cancelamento de Pedido #${existingOrder.id.substring(0, 8)}`
                }]).then(({ error }) => {
                  if (error) console.error('[Supabase Cancel log Error]', error);
                });

                supabase.from('produtos').update({
                  quantidade: updatedStock
                }).eq('id', prod.id).then(({ error }) => {
                  if (error) console.error('[Supabase product reload failed]', error);
                });
              }
            }, 50);

            return {
              ...prod,
              stock: updatedStock,
              status: updatedStock <= prod.minStock * 0.4 ? 'critico' : (updatedStock <= prod.minStock ? 'baixo_estoque' : 'normal') as any
            };
          }
          return prod;
        }));

        // 2. Estornar comissão (Atualiza os gastos e saldos do cliente, estornando a base de comissão de vendas)
        setClients(prevClients => prevClients.map(cli => {
          if (cli.id === existingOrder.clientId) {
            const updatedDebt = Math.max(0, cli.debtBalance - existingOrder.total);
            const updatedPurchases = Math.max(0, cli.purchaseCount - 1);
            const updatedTotalSpent = Math.max(0, cli.totalSpent - existingOrder.total);

            if (isSupabaseConfigured) {
              supabase.from('clientes').update({
                debt_balance: updatedDebt,
                purchase_count: updatedPurchases,
                total_spent: updatedTotalSpent
              }).eq('id', cli.id).then(({ error }) => {
                if (error) console.error('[Supabase Client Refund Update Error]', error);
              });
            }

            return {
              ...cli,
              debtBalance: updatedDebt,
              purchaseCount: updatedPurchases,
              totalSpent: updatedTotalSpent
            };
          }
          return cli;
        }));

        // 3. Atualizar financeiro: remover o lançamento do contas a receber associado
        setFinancialRecords(prevLedger => prevLedger.filter(f => f.description !== `Faturamento Pedido ${existingOrder.id}`));
        if (isSupabaseConfigured) {
          supabase.from('lancamentos_financeiros')
            .delete()
            .eq('descricao', `Faturamento Pedido ${existingOrder.id}`)
            .then(({ error }) => {
              if (error) console.error('[Supabase Delete Receivable on Cancel Error]', error);
              fetchFinancialRecordsFromSupabase();
            });
        }

        // 4. DB Sync Pedidos status update in Supabase
        if (isSupabaseConfigured) {
          supabase.from('pedidos').update({
            status: 'CANCELADO'
          }).eq('id', orderId).then(({ error }) => {
            if (error) console.error('[Supabase Order Cancel status Update Error]', error);
          });
        }
      }
    }

    // Progression of status in database (e.g. updating invoice number or status on table 'pedidos' in database)
    if (isSupabaseConfigured && invoiceNum) {
      supabase.from('pedidos').update({
        nf_emitida: true
      }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('[Supabase NF-e update error]', error);
      });
    }

    setOrders(orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          ...(invoiceNum ? { invoiceNumber: invoiceNum } : {})
        };
      }
      return o;
    }));
  };

  const handleAddTransaction = async (record: FinancialRecord) => {
    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          id: record.id,
          tipo: mapTypeToDb(record.type),
          categoria: mapCategoryToDb(record.category),
          descricao: record.description,
          valor: record.amount,
          forma_pagamento: record.paymentMethod || 'PIX',
          status: mapStatusToDb(record.status),
          due_date: record.dueDate || new Date().toISOString().split('T')[0],
          data_pagamento: record.paymentDate || null,
          party_name: record.partyName || 'Geral',
          pedido_id: record.pedido_id || null,
          vendedor_id: record.vendedor_id || null
        };

        const { error } = await supabase
          .from('lancamentos_financeiros')
          .insert([dbRow]);

        if (error) throw error;
        await fetchFinancialRecordsFromSupabase();
      } catch (err) {
        console.error('[Supabase Add Transaction Error]', err);
      }
    } else {
      setFinancialRecords([record, ...financialRecords]);
    }
  };

  const handleSettleTransaction = async (id: string, settleStatus: 'Pago' | 'Pendente') => {
    if (isSupabaseConfigured) {
      try {
        const matchingRecord = financialRecords.find(r => r.id === id);
        if (matchingRecord) {
          const updatedStatus = mapStatusToDb(settleStatus);
          const payDate = settleStatus === 'Pago' ? new Date().toISOString().split('T')[0] : null;

          const { error } = await supabase
            .from('lancamentos_financeiros')
            .update({
              status: updatedStatus,
              data_pagamento: payDate
            })
            .eq('id', id);

          if (error) throw error;

          // If settling a receivable customer, decrease their debtor balance on CRM too! (Operational consistency!)
          if (matchingRecord.type === 'receita' && settleStatus === 'Pago' && matchingRecord.status === 'Pendente') {
            const matchingClient = clients.find(c => c.name === matchingRecord.partyName);
            if (matchingClient) {
              const updatedDebt = Math.max(0, matchingClient.debtBalance - matchingRecord.amount);
              
              setClients(prevClients => prevClients.map(c => c.id === matchingClient.id ? {
                ...c,
                debtBalance: updatedDebt
              } : c));

              await supabase.from('clientes').update({
                debt_balance: updatedDebt
              }).eq('id', matchingClient.id);
            }
          }

          await fetchFinancialRecordsFromSupabase();
        }
      } catch (err) {
        console.error('[Supabase Settle Transaction Error]', err);
      }
    } else {
      setFinancialRecords(financialRecords.map(record => {
        if (record.id === id) {
          
          // If settling a receivable customer, decrease their debtor balance on CRM too! (Operational consistency!)
          if (record.type === 'receita' && settleStatus === 'Pago' && record.status === 'Pendente') {
            const matchingClient = clients.find(c => c.name === record.partyName);
            if (matchingClient) {
              setClients(prevClients => prevClients.map(c => c.id === matchingClient.id ? {
                ...c,
                debtBalance: Math.max(0, c.debtBalance - record.amount)
              } : c));
            }
          }
          
          return {
            ...record,
            status: settleStatus,
            ...(settleStatus === 'Pago' ? { paymentDate: new Date().toISOString().split('T')[0] } : { paymentDate: undefined })
          };
        }
        return record;
      }));
    }
  };

  // Reset demo databases to origin values easily
  const resetDatabaseToDefault = () => {
    if (window.confirm('Deseja realmente redefinir o banco de dados do ERP para os valores padrão de fábrica?')) {
      localStorage.removeItem('vertice_erp_products');
      localStorage.removeItem('vertice_erp_clients');
      localStorage.removeItem('vertice_erp_orders');
      localStorage.removeItem('vertice_erp_ledger');
      localStorage.removeItem('vertice_erp_sellers');
      window.location.reload();
    }
  };

  // Public invoice validation portal (unauthenticated, bypasses sessions completely!)
  if (currentPath.startsWith('/pedido/')) {
    return <PublicInvoicePortal currentPath={currentPath} onNavigate={(path) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }} />;
  }

  // 1. Loader screen during startup authentication check
  if (isLoadingSession) {
    return (
      <div className="min-h-screen w-screen bg-[#F5F7FB] flex flex-col items-center justify-center space-y-4">
        <div className="p-5 rounded-3xl bg-white shadow-2xl border border-slate-100 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-[#1F3767] animate-spin" />
        </div>
        <p className="text-xs font-extrabold text-[#1F3767] tracking-widest uppercase animate-pulse">
          Carregando Wagon AI...
        </p>
      </div>
    );
  }

  // 2. Render Premium Login screen if unauthenticated
  if (!currentUser) {
    return <LoginPremium onLoginSuccess={handleLoginSuccess} theme={theme} />;
  }

  // 3. Render SalesPortal for Vendedores (and Admin in Seller-Mode)
  if (userPortal === 'vendedor') {
    return (
      <div className={`flex flex-col h-[100dvh] w-screen overflow-hidden font-sans antialiased p-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:p-4 absolute inset-0 z-50 ${
        theme === 'dark' ? 'bg-[#0F172A] text-slate-100' : 'bg-[#e2e8f0]/40 text-slate-800'
      }`}>
        <div className="shrink-0 z-20 flex items-center justify-end gap-2 flex-wrap px-1 pb-2 sm:px-0">
          {currentUser.role === 'ADMIN' ? (
            <button
              onClick={() => setUserPortal('admin')}
              className={`flex items-center space-x-1.5 border px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl cursor-pointer ${
                theme === 'dark'
                  ? 'border-slate-850 bg-slate-900/90 text-[#1E94CF] hover:bg-slate-855'
                  : 'border-slate-200 bg-white text-[#1F3767] hover:bg-slate-50'
              }`}
            >
              <span>Retornar ao ERP Admin</span>
            </button>
          ) : null}

          <button
            onClick={handleLogout}
            className={`flex items-center space-x-1.5 border px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl cursor-pointer ${
              theme === 'dark'
                ? 'border-red-950 bg-red-950/20 text-red-400 hover:bg-red-900/30'
                : 'border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100'
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair ({currentUser.name.split(' ')[0]})</span>
          </button>
        </div>

        <div className="w-full flex-1 flex flex-col min-h-0 min-w-0">
          <SalesPortal 
            sellers={sellers}
            clients={clients}
            products={products}
            orders={orders}
            onAddOrder={handleAddOrder}
            financialRecords={financialRecords}
            onAddClient={handleAddClient}
            currentUser={currentUser}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] w-screen overflow-hidden pt-[env(safe-area-inset-top)] font-sans antialiased transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0F172A] text-slate-100' : 'bg-[#f8fafc] text-slate-850'
    }`}>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lowStockCount={lowStockCount}
        unbilledOrdersCount={unbilledOrdersCount}
        pendingBillsCount={pendingBillsCount}
        isDark={theme === 'dark'}
        toggleDarkMode={toggleDarkMode}
        onEnterSalesPortal={() => setUserPortal('vendedor')}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
        
        {/* Navigation Topbar */}
        <header id="topbar" className={`h-16 shrink-0 flex items-center justify-between px-4 md:px-8 z-20 border-b transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#111827] border-slate-800/80 text-white' : 'bg-white border-slate-100 shadow-xs'
        }`}>
          
          {/* Mobile Hamburguer and App Brand */}
          <div className="flex items-center space-x-3 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-850 text-slate-200'
                  : 'bg-slate-50 border-slate-205 text-[#1F3767]'
              }`}
              title="Abrir menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className={`text-xs font-black tracking-widest ${theme === 'dark' ? 'text-white' : 'text-[#1F3767]'}`}>
              WAGON
            </span>
          </div>

          {/* Left search mock removed */}

          {/* Right Action panel */}
          <div className="flex items-center space-x-5">
            
            {/* Database resets: disponível apenas no modo local de desenvolvimento */}
            {!isSupabaseConfigured && (
              <button
                onClick={resetDatabaseToDefault}
                className={`hidden sm:inline-block text-[10px] font-bold border p-2 py-1 rounded transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                    : 'text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                }`}
                title="Restaurar dados originais de simulação"
              >
                Resetar Base
              </button>
            )}

            {/* Quick alerts removed */}

            {/* User credentials */}
            <div className={`hidden sm:flex items-center space-x-3.5 pl-4 border-l ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="text-right">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-green block animate-pulse"></span>
                  <span className={`text-xs font-extrabold ${theme === 'dark' ? 'text-slate-250' : 'text-slate-700'}`}>
                    Canal Operador
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold tracking-tight">Terminal ID: #082A</span>
              </div>
            </div>

          </div>

        </header>

        {/* Dynamic transition viewport viewport */}
        <main className={`flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 pb-24 lg:pb-6 z-10 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#f8fafc]'
        }`}>
          <div key={activeTab} className="min-h-full">
              {activeTab === 'dashboard' && (
                <DashboardBI 
                  products={products}
                  clients={clients}
                  orders={orders}
                  commissions={commissions}
                  financialRecords={financialRecords}
                  onSettleTransaction={handleSettleTransaction}
                  stockMovements={stockMovements}
                  isDark={theme === 'dark'}
                />
              )}

              {activeTab === 'crm' && (
                <SalesCRM 
                  products={products}
                  clients={clients}
                  orders={orders}
                  onAddOrder={handleAddOrder}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  currentUser={currentUser}
                  initialSubTab="crm"
                />
              )}

              {activeTab === 'pipeline' && (
                <SalesCRM 
                  products={products}
                  clients={clients}
                  orders={orders}
                  onAddOrder={handleAddOrder}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  currentUser={currentUser}
                  initialSubTab={salesSubTab}
                />
              )}

              {activeTab === 'inventory' && (
                <Inventory 
                  products={products}
                  onUpdateProduct={handleUpdateProduct}
                  onReceiveStock={handleReceiveStock}
                  onAddProduct={handleAddProduct}
                  onAddTransaction={handleAddTransaction}
                  stockMovements={stockMovements}
                  isDark={theme === 'dark'}
                />
              )}

              {activeTab === 'finance' && (
                <Finance 
                  financialRecords={financialRecords}
                  onAddTransaction={handleAddTransaction}
                  onSettleTransaction={handleSettleTransaction}
                  products={products}
                  clients={clients}
                  orders={orders}
                />
              )}

              {activeTab === 'virtualCFO' && (
                <VirtualCFO 
                  products={products}
                  clients={clients}
                  orders={orders}
                  financialRecords={financialRecords}
                  sellers={sellers}
                />
              )}

              {activeTab === 'sellers' && (
                <Sellers 
                  sellers={sellers}
                  onUpdateSellers={setSellers}
                  clients={clients}
                  orders={orders}
                  financialRecords={financialRecords}
                  onAddTransaction={handleAddTransaction}
                  commissions={commissions}
                  onPayCommission={handlePayCommissionInApp}
                  onCreateSeller={handleCreateSellerAccount}
                />
              )}

              {activeTab === 'settings' && (
                <div 
                  id="settings-panel shadow"
                  className={`p-4 sm:p-6 rounded-3xl border transition-all duration-300 max-w-4xl space-y-6 ${
                    theme === 'dark' ? 'glass-dark border-slate-800' : 'glass-light border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="border-b border-slate-200/10 pb-4 flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-[#1E94CF]/10 text-[#1E94CF]">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F3767]'}`}>
                        Configurações Corporativas do ERP
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold">Conselho geral e gerenciamento do tenant corporativo.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-205'}`}>
                      <h5 className="text-xs font-bold uppercase mb-2">Informações da Plataforma</h5>
                      <div className="space-y-1.5 text-xs">
                        <p className="flex justify-between font-semibold"><span className="text-slate-400">Canal Ativo</span> <span className="text-emerald-400">Sucesso em Escala</span></p>
                        <p className="flex justify-between font-semibold"><span className="text-slate-400">Tenant ID</span> <span className="font-mono">#b2e8a51-vrt</span></p>
                        <p className="flex justify-between font-semibold"><span className="text-slate-400">Uptime Certificado</span> <span>99.991% SLA</span></p>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-205'}`}>
                      <h5 className="text-xs font-bold uppercase mb-2">Garantia Tributária</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        Nossos geradores fiscais de faturamento seguem a regulamentação do ICMS, IPI e PIS/COFINS vigentes sob o Simples Nacional, garantindo 100% de integridade em cada transação financeira reconciliada.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-4 border-t border-slate-200/10">
                    <span>Versão da API: @google/genai@2.4.0 (Gemini 3.5 Flash)</span>
                    <span>Licenciado para: edilson.adm@wagon.com</span>
                  </div>
                </div>
              )}

              {/* Gerenciamento de Colaboradores (somente ADMIN) */}
              {activeTab === 'collaborators' && currentUser?.role === 'ADMIN' && (
                <CollaboratorManager
                  currentUser={currentUser}
                  isDark={theme === 'dark'}
                  onCollaboratorsChanged={fetchSellersFromSupabase}
                />
              )}

              {/* Guard: acesso negado para não-ADMIN */}
              {activeTab === 'collaborators' && currentUser?.role !== 'ADMIN' && (
                <div className={`p-8 rounded-3xl border flex flex-col items-center justify-center text-center space-y-4 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                  <div className="p-4 rounded-2xl bg-rose-500/10">
                    <Settings className="h-8 w-8 text-rose-500" />
                  </div>
                  <h3 className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F3767]'}`}>
                    Acesso Restrito
                  </h3>
                  <p className="text-sm text-slate-400 font-semibold max-w-xs">
                    Esta área é exclusiva para administradores do sistema.
                  </p>
                </div>
              )}
          </div>
        </main>

        {/* FLOATING ACTION BUTTON (FAB) FOR MOBILE */}
        <button
          onClick={() => {
            setActiveTab('pipeline');
            setSalesSubTab('new-order');
          }}
          className="lg:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-45 bg-gradient-to-r from-[#1E94CF] to-[#8BC039] text-white p-3.5 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all font-black uppercase text-[10px] tracking-wider outline-none border-none cursor-pointer hover:brightness-110"
          title="Nova Venda"
        >
          <span className="text-sm mr-1 font-bold">+</span> Nova Venda
        </button>

        {/* BOTTOM FIXED INTERFERENCE FOR MOBILE NAVIGATION */}
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 min-h-16 h-auto pb-[env(safe-area-inset-bottom)] border-t z-50 flex items-center justify-around px-2 ${
          theme === 'dark' 
            ? 'bg-[#111827] border-slate-850 text-slate-400' 
            : 'bg-white border-slate-200 text-slate-500 shadow-[0_-3px_15px_rgba(0,0,0,0.06)]'
        }`}>
          {[
            { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
            { id: 'finance', label: 'Finanças', icon: DollarSign },
            { id: 'inventory', label: 'Estoque', icon: Boxes },
            { id: 'crm', label: 'Clientes', icon: Users },
            { id: 'virtualCFO', label: 'CFO IA', icon: Cpu },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'crm') setSalesSubTab('crm');
                  if (tab.id === 'pipeline') setSalesSubTab('pipeline');
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all text-center min-h-[44px] min-w-[44px] active:scale-95 ${
                  isCurrent
                    ? theme === 'dark' ? 'text-[#1E94CF]' : 'text-[#1E94CF]'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <IconComp className={`h-5 w-5 ${isCurrent ? 'scale-110 mb-0.5' : 'mb-0.5'}`} />
                <span className="text-[9px] font-black tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
