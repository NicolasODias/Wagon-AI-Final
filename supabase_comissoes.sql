-- ====================================================================
-- WAGON AI - CRIAÇÃO DA TABELA DE COMISSÕES (SUPABASE)
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ====================================================================

-- 1. Criar a tabela 'comissoes' no esquema 'public'
create table if not exists public.comissoes (
  id text primary key, -- ID único (ex. 'COM-101', 'COM-102')
  pedido_id text not null, -- ID do pedido que gerou a comissão
  vendedor_id text not null, -- ID ou CPF/Identificador do vendedor (vendedor_id no ERP)
  valor numeric not null check (valor >= 0), -- Valor calculado da comissão
  status text not null check (status in ('PENDENTE', 'PARCIAL', 'PAGO')), -- Status conforme especificado
  data_pagamento date, -- Data de liquidação (pode ser nula)
  observacao text, -- Informações adicionais
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar o Row Level Security (RLS) na tabela
alter table public.comissoes enable row level security;

-- 3. Criar políticas RLS seguras para permitir acesso total aos usuários autenticados
create policy "Acesso Total para Usuários Autenticados em Comissões"
  on public.comissoes
  for all
  to authenticated
  using (true)
  with check (true);
