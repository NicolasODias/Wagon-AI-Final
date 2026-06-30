-- ====================================================================
-- WAGON AI - CRIAÇÃO DAS TABELAS DE PEDIDOS E ITENS DE PEDIDOS (SUPABASE)
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ====================================================================

-- 1. Criar a tabela 'pedidos' no esquema 'public'
create table if not exists public.pedidos (
  id text primary key, -- Armazena diretamente o ID gerado pelo ERP (ex: 'PED-2026-001')
  numero_pedido serial unique,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  vendedor_id uuid default auth.uid(), -- Vincula por padrão ao ID do usuário autenticado (auth.users)
  valor_total numeric default 0 not null check (valor_total >= 0),
  status text not null check (status in ('FINALIZADO', 'CANCELADO')),
  nf_emitida boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Criar a tabela 'pedido_itens' no esquema 'public'
create table if not exists public.pedido_itens (
  id uuid default gen_random_uuid() primary key,
  pedido_id text not null references public.pedidos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  quantidade integer not null check (quantidade > 0),
  valor_unitario numeric default 0 not null check (valor_unitario >= 0)
);

-- 3. Habilitar o Row Level Security (RLS) nas duas tabelas
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

-- 4. Criar políticas RLS seguras para permitir acesso total aos usuários autenticados
create policy "Acesso Total para Usuários Autenticados em Pedidos"
  on public.pedidos
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Acesso Total para Usuários Autenticados em Itens de Pedidos"
  on public.pedido_itens
  for all
  to authenticated
  using (true)
  with check (true);
