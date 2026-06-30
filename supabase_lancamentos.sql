-- ====================================================================
-- WAGON AI - CRIAÇÃO DA TABELA DE LANÇAMENTOS FINANCEIROS (SUPABASE)
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ====================================================================

-- 1. Criar a tabela 'lancamentos_financeiros' no esquema 'public'
create table if not exists public.lancamentos_financeiros (
  id text primary key, -- Tipo compatível com os IDs do ERP (ex: 'FIN-123', 'COM-456', etc.)
  tipo text not null check (tipo in ('ENTRADA', 'SAIDA')),
  categoria text not null check (categoria in (
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
  )),
  descricao text not null,
  valor numeric not null check (valor >= 0),
  forma_pagamento text default 'PIX' not null, -- Boleto, PIX, Dinheiro, etc.
  status text not null check (status in ('PENDENTE', 'PAGO', 'ATRASADO')),
  due_date date, -- Data de vencimento (essencial do ERP)
  data_pagamento date, -- Data de liquidação (pode ser nula se pendente)
  party_name text, -- Nome do Cliente ou Fornecedor (essencial do ERP)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar o Row Level Security (RLS) na tabela
alter table public.lancamentos_financeiros enable row level security;

-- 3. Criar políticas RLS seguras para permitir acesso total aos usuários autenticados
create policy "Acesso Total para Usuários Autenticados em Lançamentos"
  on public.lancamentos_financeiros
  for all
  to authenticated
  using (true)
  with check (true);
