-- ====================================================================
-- WAGON AI - CRIAÇÃO DA TABELA DE PRODUTOS E MOVIMENTAÇÕES DE ESTOQUE
-- Execute este script no SQL Editor do seu painel Supabase.
-- ====================================================================

-- 1. Criar a sequência para códigos automáticos de produtos (caso o SKU não seja fornecido)
create sequence if not exists public.produtos_codigo_seq start with 5001;

-- 2. Criar a tabela 'produtos' no esquema 'public'
create table if not exists public.produtos (
  id uuid default gen_random_uuid() primary key,
  codigo_produto text not null unique, -- SKU / Código único
  nome text not null,
  categoria text,
  marca text,
  quantidade integer default 0 not null,
  valor_compra numeric default 0 not null,
  valor_venda numeric default 0 not null,
  imposto_percentual numeric default 15.0 not null,
  comissao_percentual numeric default 2.5 not null,
  comissao_fixa numeric default 0.0 not null,
  
  -- Campos adicionais para compatibilidade funcional total com o ERP
  min_stock integer default 20 not null,
  unit text default 'un' :: text not null,
  corredor text default 'A-01' :: text,
  prateleira text default 'Nível 1' :: text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Criar a tabela 'movimentacoes_estoque' no esquema 'public'
create table if not exists public.movimentacoes_estoque (
  id uuid default gen_random_uuid() primary key,
  produto_id uuid references public.produtos(id) on delete cascade not null,
  tipo text not null check (tipo in ('ENTRADA', 'SAIDA', 'AJUSTE')),
  quantidade integer not null, -- Quantidade movimentada
  valor numeric default 0 not null, -- Valor unitário ou de compra/venda na transação
  observacao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Trigger para gerar o codigo_produto automaticamente no formato 'PROD-xxxx' se não fornecido
create or replace function public.tg_generate_codigo_produto()
returns trigger as $$
begin
  if new.codigo_produto is null or new.codigo_produto = '' then
    new.codigo_produto := 'PROD-' || nextval('public.produtos_codigo_seq');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_generate_codigo_produto on public.produtos;
create trigger tr_generate_codigo_produto
  before insert on public.produtos
  for each row
  execute procedure public.tg_generate_codigo_produto();

-- 5. Trigger para atualizar automaticamente o estoque de produtos após qualquer movimentação
create or replace function public.tg_update_produto_estoque()
returns trigger as $$
begin
  if new.tipo = 'ENTRADA' then
    update public.produtos
    set quantidade = quantidade + new.quantidade
    where id = new.produto_id;
  elsif new.tipo = 'SAIDA' then
    update public.produtos
    set quantidade = greatest(0, quantidade - new.quantidade)
    where id = new.produto_id;
  elsif new.tipo = 'AJUSTE' then
    update public.produtos
    set quantidade = new.quantidade
    where id = new.produto_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_update_produto_estoque on public.movimentacoes_estoque;
create trigger tr_update_produto_estoque
  after insert on public.movimentacoes_estoque
  for each row
  execute procedure public.tg_update_produto_estoque();

-- 6. Habilitar o Row Level Security (RLS) para proteger os dados das tabelas
alter table public.produtos enable row level security;
alter table public.movimentacoes_estoque enable row level security;

-- 7. Criar políticas RLS seguras para permitir acesso total aos usuários autenticados
create policy "Todas as permissões para usuários autenticados em produtos"
  on public.produtos
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Todas as permissões para usuários autenticados em movimentacoes"
  on public.movimentacoes_estoque
  for all
  to authenticated
  using (true)
  with check (true);

-- 8. Popular dados iniciais de exemplo para testes de desenvolvimento sincronizados
-- (Caso queira preencher o catálogo, execute as instruções no SQL Editor):
--
-- INSERT INTO public.produtos (codigo_produto, nome, categoria, marca, quantidade, valor_compra, valor_venda, min_stock, unit, corredor, prateleira) VALUES 
-- ('AL-AZE-050', 'Azeite de Oliva Extra Virgem 500ml', 'Gourmet', 'Fazenda Santa Maria', 240, 28.50, 48.90, 100, 'un', 'C-04', 'Nível 2'),
-- ('AL-ARR-102', 'Arroz Integral Cateto Orgânico 1kg', 'Grãos', 'Cooperativa Regional', 450, 8.20, 15.60, 200, 'un', 'A-01', 'Nível 1'),
-- ('BE-CAF-301', 'Café Espresso Ristretto Cápsulas (C/10)', 'Bebidas', 'Vértice Blends', 80, 14.90, 27.90, 150, 'caixa', 'B-02', 'Nível 3'),
-- ('DO-CHO-403', 'Chocolate Belga 70% Cacau 100g', 'Doces', 'Diverso', 35, 9.80, 19.90, 80, 'un', 'D-01', 'Nível 1');
