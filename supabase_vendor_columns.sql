-- ====================================================================
-- WAGON AI - MIGRAÇÃO: Adicionar campos de vendedor em public.users
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ====================================================================

-- Adiciona os campos de taxa de comissão e meta de vendas para perfil VENDEDOR
alter table public.users
  add column if not exists comissao_rate numeric default 5.0 check (comissao_rate >= 0 and comissao_rate <= 100),
  add column if not exists meta_vendas numeric default 100000 check (meta_vendas >= 0);

-- Preenche o valor default para VENDEDOREs existentes que ainda não têm esses campos
update public.users
  set comissao_rate = 5.0,
      meta_vendas = 100000
  where perfil = 'VENDEDOR'
    and (comissao_rate is null or meta_vendas is null);
