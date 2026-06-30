-- WAGON AI - Segurança, colaboradores e integração comercial
-- Execute após os scripts supabase_*.sql existentes.

begin;

-- Vínculos necessários para isolar o financeiro por vendedor sem criar novas tabelas.
alter table public.lancamentos_financeiros
  add column if not exists pedido_id text references public.pedidos(id) on delete set null,
  add column if not exists vendedor_id uuid references auth.users(id) on delete set null;

alter table public.pedido_itens
  add column if not exists valor_total numeric check (valor_total >= 0);

create index if not exists idx_clientes_vendedor_id on public.clientes(vendedor_id);
create index if not exists idx_pedidos_vendedor_id on public.pedidos(vendedor_id);
create index if not exists idx_lancamentos_vendedor_id on public.lancamentos_financeiros(vendedor_id);
create index if not exists idx_lancamentos_pedido_id on public.lancamentos_financeiros(pedido_id);
create index if not exists idx_comissoes_vendedor_id on public.comissoes(vendedor_id);

-- Funções de autorização evitam recursão das políticas da própria public.users.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid() and ativo = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid() and perfil = 'ADMIN' and ativo = true
  );
$$;

revoke all on function public.is_active_user() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Novos cadastros nunca recebem ADMIN a partir de e-mail ou user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.users (auth_id, nome, email, perfil, telefone, ativo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'fullname', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'VENDEDOR',
    coalesce(new.raw_user_meta_data->>'phone', ''),
    false
  )
  on conflict (email) do update
  set auth_id = excluded.auth_id,
      nome = excluded.nome,
      telefone = excluded.telefone;
  return new;
end;
$$;

-- USERS
drop policy if exists "ADMIN - Acesso Total" on public.users;
drop policy if exists "VENDEDOR - Acesso aos Próprios Dados" on public.users;
drop policy if exists "VENDEDOR - Atualização dos Próprios Dados" on public.users;
drop policy if exists "users_admin_all" on public.users;
drop policy if exists "users_self_read" on public.users;

create policy "users_admin_all" on public.users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "users_self_read" on public.users
  for select to authenticated
  using (auth_id = auth.uid());

-- CLIENTES
drop policy if exists "ADMIN - Acesso Total Clientes" on public.clientes;
drop policy if exists "VENDEDOR - Acesso Próprios Clientes" on public.clientes;
drop policy if exists "clientes_admin_all" on public.clientes;
drop policy if exists "clientes_vendedor_own" on public.clientes;

create policy "clientes_admin_all" on public.clientes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "clientes_vendedor_own" on public.clientes
  for all to authenticated
  using (public.is_active_user() and vendedor_id = auth.uid())
  with check (public.is_active_user() and vendedor_id = auth.uid());

-- PRODUTOS E ESTOQUE
drop policy if exists "Todas as permissões para usuários autenticados em produtos" on public.produtos;
drop policy if exists "Todas as permissões para usuários autenticados em movimentacoes" on public.movimentacoes_estoque;
drop policy if exists "produtos_admin_all" on public.produtos;
drop policy if exists "produtos_active_read" on public.produtos;
drop policy if exists "movimentacoes_admin_all" on public.movimentacoes_estoque;

create policy "produtos_admin_all" on public.produtos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "produtos_active_read" on public.produtos
  for select to authenticated
  using (public.is_active_user());

create policy "movimentacoes_admin_all" on public.movimentacoes_estoque
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- PEDIDOS
drop policy if exists "Acesso Total para Usuários Autenticados em Pedidos" on public.pedidos;
drop policy if exists "Acesso Total para Usuários Autenticados em Itens de Pedidos" on public.pedido_itens;
drop policy if exists "pedidos_admin_all" on public.pedidos;
drop policy if exists "pedidos_vendedor_read" on public.pedidos;
drop policy if exists "pedido_itens_admin_all" on public.pedido_itens;
drop policy if exists "pedido_itens_vendedor_read" on public.pedido_itens;

create policy "pedidos_admin_all" on public.pedidos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "pedidos_vendedor_read" on public.pedidos
  for select to authenticated
  using (public.is_active_user() and vendedor_id = auth.uid());

create policy "pedido_itens_admin_all" on public.pedido_itens
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "pedido_itens_vendedor_read" on public.pedido_itens
  for select to authenticated
  using (
    public.is_active_user() and exists (
      select 1 from public.pedidos p
      where p.id = pedido_id and p.vendedor_id = auth.uid()
    )
  );

-- FINANCEIRO
drop policy if exists "Acesso Total para Usuários Autenticados em Lançamentos" on public.lancamentos_financeiros;
drop policy if exists "financeiro_admin_all" on public.lancamentos_financeiros;
drop policy if exists "financeiro_vendedor_read" on public.lancamentos_financeiros;

create policy "financeiro_admin_all" on public.lancamentos_financeiros
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "financeiro_vendedor_read" on public.lancamentos_financeiros
  for select to authenticated
  using (public.is_active_user() and vendedor_id = auth.uid());

-- COMISSÕES
drop policy if exists "Acesso Total para Usuários Autenticados em Comissões" on public.comissoes;
drop policy if exists "comissoes_admin_all" on public.comissoes;
drop policy if exists "comissoes_vendedor_read" on public.comissoes;

create policy "comissoes_admin_all" on public.comissoes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "comissoes_vendedor_read" on public.comissoes
  for select to authenticated
  using (public.is_active_user() and vendedor_id = auth.uid()::text);

-- Conclusão atômica do fluxo já existente: pedido, itens, estoque, cliente,
-- financeiro e comissão são confirmados ou revertidos juntos.
create or replace function public.criar_pedido_completo(
  p_pedido_id text,
  p_cliente_id uuid,
  p_vendedor_id uuid,
  p_valor_total numeric,
  p_itens jsonb,
  p_financeiro_id text,
  p_comissao_id text,
  p_due_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_role text;
  v_actor_active boolean;
  v_vendedor_id uuid;
  v_item jsonb;
  v_produto_id uuid;
  v_quantidade integer;
  v_valor_unitario numeric;
  v_preco_atual numeric;
  v_item_total numeric;
  v_total_calculado numeric := 0;
  v_comissao_rate numeric;
  v_estoque integer;
begin
  select perfil, ativo into v_actor_role, v_actor_active
  from public.users
  where auth_id = auth.uid();

  if not found or not v_actor_active then
    raise exception 'Usuário sem acesso ativo';
  end if;

  if v_actor_role = 'ADMIN' then
    v_vendedor_id := p_vendedor_id;
  else
    v_vendedor_id := auth.uid();
    if p_vendedor_id is distinct from auth.uid() then
      raise exception 'Vendedor não autorizado para este pedido';
    end if;
  end if;

  select coalesce(comissao_rate, 5) into v_comissao_rate
  from public.users
  where auth_id = v_vendedor_id and perfil = 'VENDEDOR' and ativo = true;

  if not found then
    raise exception 'Vendedor inválido ou inativo';
  end if;

  perform 1 from public.clientes
  where id = p_cliente_id
    and (v_actor_role = 'ADMIN' or vendedor_id = v_vendedor_id)
  for update;

  if not found then
    raise exception 'Cliente não pertence ao vendedor informado';
  end if;

  if p_valor_total < 0 or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Pedido inválido';
  end if;

  insert into public.pedidos (
    id, cliente_id, vendedor_id, valor_total, status, nf_emitida
  ) values (
    p_pedido_id, p_cliente_id, v_vendedor_id, p_valor_total, 'FINALIZADO', false
  );

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_produto_id := (v_item->>'produto_id')::uuid;
    v_quantidade := (v_item->>'quantidade')::integer;
    v_valor_unitario := (v_item->>'valor_unitario')::numeric;
    v_item_total := (v_item->>'valor_total')::numeric;

    if v_quantidade <= 0 or v_valor_unitario < 0 or v_item_total < 0 then
      raise exception 'Item de pedido inválido';
    end if;

    select quantidade, valor_venda into v_estoque, v_preco_atual
    from public.produtos
    where id = v_produto_id
    for update;

    if not found or v_estoque < v_quantidade then
      raise exception 'Estoque insuficiente para o produto %', v_produto_id;
    end if;

    if abs(v_valor_unitario - v_preco_atual) > 0.01
       or v_item_total > (v_valor_unitario * v_quantidade) then
      raise exception 'Preço inválido para o produto %', v_produto_id;
    end if;

    v_total_calculado := v_total_calculado + v_item_total;

    insert into public.pedido_itens (
      pedido_id, produto_id, quantidade, valor_unitario, valor_total
    )
    values (
      p_pedido_id, v_produto_id, v_quantidade, v_valor_unitario, v_item_total
    );

    -- O trigger existente tr_update_produto_estoque efetua a baixa.
    insert into public.movimentacoes_estoque (
      produto_id, tipo, quantidade, valor, observacao
    ) values (
      v_produto_id, 'SAIDA', v_quantidade, v_valor_unitario,
      'Venda Ref: Pedido #' || p_pedido_id
    );
  end loop;

  if abs(v_total_calculado - p_valor_total) > 0.01 then
    raise exception 'Total do pedido não confere com os itens';
  end if;

  update public.clientes
  set debt_balance = debt_balance + p_valor_total,
      purchase_count = purchase_count + 1,
      total_spent = total_spent + p_valor_total
  where id = p_cliente_id;

  insert into public.lancamentos_financeiros (
    id, tipo, categoria, descricao, valor, forma_pagamento, status,
    due_date, party_name, pedido_id, vendedor_id
  )
  select
    p_financeiro_id, 'ENTRADA', 'Outros', 'Faturamento Pedido ' || p_pedido_id,
    p_valor_total, 'PIX', 'PENDENTE', p_due_date, c.nome_negocio,
    p_pedido_id, v_vendedor_id
  from public.clientes c where c.id = p_cliente_id;

  insert into public.comissoes (
    id, pedido_id, vendedor_id, valor, status, observacao
  ) values (
    p_comissao_id, p_pedido_id, v_vendedor_id::text,
    round(p_valor_total * v_comissao_rate / 100, 2), 'PENDENTE',
    'Comissão calculada automaticamente sobre Pedido ' || p_pedido_id
  );

  return jsonb_build_object(
    'pedido_id', p_pedido_id,
    'vendedor_id', v_vendedor_id,
    'success', true
  );
end;
$$;

revoke all on function public.criar_pedido_completo(text, uuid, uuid, numeric, jsonb, text, text, date) from public;
grant execute on function public.criar_pedido_completo(text, uuid, uuid, numeric, jsonb, text, text, date) to authenticated;

commit;
