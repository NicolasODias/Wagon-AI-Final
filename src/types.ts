/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  stock: number;
  minStock: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  corridor: string;
  shelf: string;
  status: 'normal' | 'baixo_estoque' | 'critico';
  commissionPercent?: number;
  impostoPercent?: number;
}

export interface Client {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  creditLimit: number;
  debtBalance: number;
  region: 'Norte' | 'Nordeste' | 'Sudeste' | 'Sul' | 'Centro-Oeste';
  purchaseCount: number;
  totalSpent: number;
  riskClass: 'A' | 'B' | 'C' | 'D'; // credit risk tier
  city?: string;
  owner?: string;
  salesRep?: string;
  status?: 'Ativo' | 'Inativo';
  consignments?: string[];
  codigo_cliente?: string;
  endereco?: string;
  vendedor_id?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  uuid?: string;
  pdfUrl?: string;
  clientId: string;
  clientName: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  taxes: {
    icms: number;
    ipi: number;
    pisCofins: number;
    total: number;
  };
  total: number;
  marginPercent: number; // calculated margin
  status: 'Aguardando Faturamento' | 'Em Separação' | 'Rota de Entrega' | 'Entregue' | 'Cancelado';
  paymentTerm: 'Vista' | '7 Dias' | '15 Dias' | '30 Dias' | '45 Dias';
  paymentMethod?: string;
  invoiceNumber?: string;
  salesRep?: string;
  vendedor_id?: string;
}

export interface FinancialRecord {
  id: string;
  type: 'receita' | 'despesa';
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  partyName: string; // client or supplier
  cnpj?: string;
  category: 'Vendas' | 'Logística' | 'Impostos' | 'Folha Pgto' | 'Infraestrutura' | 'Fornecedores' | 'Compra de Mercadoria' | 'Frete' | 'Salários' | 'Comissões' | 'Marketing' | 'Energia' | 'Água' | 'Internet' | 'Aluguel' | 'Equipamentos' | 'Serviços' | 'Outros';
  paymentMethod?: string;
  pedido_id?: string;
  vendedor_id?: string;
}

export interface BIInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'error';
  metricImpact?: string;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Inativo';
  commissionRate: number; // percentage (e.g., 5)
  target: number; // monthly sales target in BRL
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VENDEDOR';
  permissions: string[];
  telefone?: string;
}

export interface StockMovement {
  id: string;
  produto_id: string;
  produto_nome?: string;
  produto_sku?: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  valor: number;
  observacao?: string;
  created_at: string;
}

export interface Commission {
  id: string;
  pedido_id: string;
  vendedor_id: string;
  valor: number;
  status: 'PENDENTE' | 'PARCIAL' | 'PAGO';
  data_pagamento?: string;
  observacao?: string;
  created_at?: string;
}

