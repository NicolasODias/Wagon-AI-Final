-- ====================================================================
-- WAGON AI - CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE (TABELA DE USUÁRIOS)
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ====================================================================

-- 1. Criar a tabela 'users' no esquema 'public'
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  auth_id uuid references auth.users(id) on delete cascade unique,
  nome text not null,
  email text not null unique,
  perfil text not null check (perfil in ('ADMIN', 'VENDEDOR')),
  telefone text,
  ativo boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar o Row Level Security (RLS) na tabela 'users'
alter table public.users enable row level security;

-- 3. Criar políticas RLS seguras

-- Política 1: Os usuários ADM podem ver todos os dados e realizar qualquer ação (INSERT, SELECT, UPDATE, DELETE)
create policy "ADMIN - Acesso Total"
  on public.users
  as permissive
  for all
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.auth_id = auth.uid() and u.perfil = 'ADMIN'
    )
  );

-- Política 2: Os usuários só podem ler e atualizar as próprias informações caso não sejam administradores
create policy "VENDEDOR - Acesso aos Próprios Dados"
  on public.users
  as permissive
  for select
  to authenticated
  using (
    auth_id = auth.uid()
  );

-- Vendedores não atualizam public.users diretamente.
-- Alterações de perfil, status e dados funcionais passam pelo endpoint administrativo.

-- 4. Função dinâmica de trigger para sincronização do auth.users com a tabela de usuários
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_fullname text;
  user_role text;
  user_phone text;
begin
  -- Recuperar o nome a partir das metadados do usuário ou fellback amigável
  user_fullname := coalesce(
    new.raw_user_meta_data->>'fullname', 
    new.raw_user_meta_data->>'name', 
    split_part(new.email, '@', 1)
  );
  
  -- Novos usuários sempre começam como vendedor.
  -- Promoções para ADMIN só podem ser feitas pelo backend administrativo.
  user_role := 'VENDEDOR';

  user_phone := coalesce(new.raw_user_meta_data->>'phone', '');

  insert into public.users (auth_id, nome, email, perfil, telefone, ativo)
  values (
    new.id,
    user_fullname,
    new.email,
    user_role,
    user_phone,
    false
  )
  on conflict (email) do update 
  set auth_id = excluded.auth_id,
      nome = excluded.nome,
      telefone = excluded.telefone;

  return new;
end;
$$ language plpgsql security definer;

-- 5. Vincular a trigger após inserções em auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- DICA DE SEGURANÇA:
-- Se você possui usuários criados anteriormente, execute este comando manual 
-- para populá-los na tabela public.users:
--
-- INSERT INTO public.users (auth_id, nome, email, perfil, telefone, ativo)
-- SELECT 
--   id as auth_id, 
--   COALESCE(raw_user_meta_data->>'fullname', raw_user_meta_data->>'name', 'Usuário Autenticado') as nome, 
--   email, 
--   COALESCE(raw_user_meta_data->>'role', CASE WHEN email ILIKE '%adm%' THEN 'ADMIN' ELSE 'VENDEDOR' END) as perfil,
--   NULL,
--   TRUE
-- FROM auth.users
-- ON CONFLICT (email) DO NOTHING;
-- ====================================================================
