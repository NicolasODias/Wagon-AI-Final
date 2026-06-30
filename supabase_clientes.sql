-- ====================================================================
-- WAGON AI - CRIAÇÃO DA TABELA DE CLIENTES NO SUPABASE
-- Execute este script no editor SQL (SQL Editor) do seu painel Supabase.
-- ====================================================================

-- 1. Criar sequência para os códigos incrementais de clientes (Garante código automático e não repetido)
create sequence if not exists public.clientes_codigo_seq start with 1001;

-- 2. Criar a tabela 'clientes' no esquema 'public'
create table if not exists public.clientes (
  -- Campos obrigatórios requisitados
  id uuid default gen_random_uuid() primary key,
  codigo_cliente text unique,
  nome_negocio text not null,
  cnpj text not null,
  endereco text,
  cidade text,
  proprietario text,
  telefone text,
  vendedor_id uuid default auth.uid(), -- Vincula por padrão ao vendedor logado que criou
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Campos adicionais para compatibilidade funcional total do ERP
  email text,
  credit_limit numeric default 30000,
  debt_balance numeric default 0,
  region text default 'Sudeste' check (region in ('Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste')),
  purchase_count integer default 0,
  total_spent numeric default 0,
  risk_class text default 'A' check (risk_class in ('A', 'B', 'C', 'D')),
  status text default 'Ativo' check (status in ('Ativo', 'Inativo')),
  consignments text[] default '{}'
);

-- 3. Trigger para gerar o código_cliente automaticamente no formato 'CLI-xxxx', caso não seja fornecido
create or replace function public.tg_generate_codigo_cliente()
returns trigger as $$
begin
  if new.codigo_cliente is null or new.codigo_cliente = '' then
    new.codigo_cliente := 'CLI-' || nextval('public.clientes_codigo_seq');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_generate_codigo_cliente on public.clientes;
create trigger tr_generate_codigo_cliente
  before insert on public.clientes
  for each row
  execute procedure public.tg_generate_codigo_cliente();

-- 4. Habilitar o Row Level Security (RLS) para proteger os dados de clientes
alter table public.clientes enable row level security;

-- --------------------------------------------------------------------
-- POLÍTICAS RLS (Row Level Security)
-- --------------------------------------------------------------------

-- Política para ADMINISTRADORES: Podem fazer qualquer operação em todos os clientes
create policy "ADMIN - Acesso Total Clientes"
  on public.clientes
  as permissive
  for all
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.auth_id = auth.uid() and u.perfil = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.auth_id = auth.uid() and u.perfil = 'ADMIN'
    )
  );

-- Política para VENDEDORES: Só conseguem visualizar, inserir e alterar clientes vinculados ao seu próprio id (auth.uid)
create policy "VENDEDOR - Acesso Próprios Clientes"
  on public.clientes
  as permissive
  for all
  to authenticated
  using (
    vendedor_id = auth.uid()
  )
  with check (
    vendedor_id = auth.uid()
  );

-- ====================================================================
-- POPULAR DADOS INICIAIS (Seeding opcional para testes em desenvolvimento):
-- Caso queira preencher a tabela para depuração com clientes de exemplo sincronizados, 
-- sinta-se à vontade para rodar o seguinte script opcional:
--
-- INSERT INTO public.clientes (nome_negocio, cnpj, endereco, cidade, proprietario, telefone, region, risk_class, status, credit_limit, debt_balance, total_spent) VALUES 
-- ('Supermercado Alvorada Ltda', '12.345.678/0001-99', 'Av. das Flores, 120', 'Sorocaba', 'Antônio Rondon', '(11) 98765-4321', 'Sudeste', 'A', 'Ativo', 50000, 15000, 240000),
-- ('Mercantil Nordeste Inc', '98.765.432/0001-21', 'Rua Bahia, 450', 'Recife', 'Guilherme Mendes', '(81) 99122-3344', 'Nordeste', 'B', 'Ativo', 35000, 0, 75000),
-- ('Distribuidora Sul Gás', '45.123.890/0002-33', 'Rodovia do Sol, Km 12', 'Porto Alegre', 'Clara Hoffmann', '(51) 3211-5500', 'Sul', 'C', 'Inativo', 20000, 0, 13000);
-- ====================================================================
