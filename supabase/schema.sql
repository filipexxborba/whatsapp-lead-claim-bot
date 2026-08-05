-- Rode este script no SQL Editor do Supabase, uma vez por projeto (um projeto por cliente).
create extension if not exists pgcrypto;

create table if not exists whatsapp_groups (
  jid text primary key,
  name text not null,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists triggers (
  id uuid primary key default gen_random_uuid(),
  text text not null unique,
  match_type text not null default 'contains' check (match_type in ('exact', 'contains')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- message_id vem do Baileys (chave da mensagem do gatilho) e garante que a mesma
-- mensagem nunca gere duas reações/DMs, mesmo se o bot reconectar e reprocessar o histórico.
create table if not exists claimed_contacts (
  id uuid primary key default gen_random_uuid(),
  message_id text not null unique,
  phone_jid text not null,
  group_jid text not null,
  group_name text,
  trigger_text text,
  message_sent boolean not null default false,
  claimed_at timestamptz not null default now()
);

create index if not exists claimed_contacts_claimed_at_idx on claimed_contacts (claimed_at desc);

-- Seed do gatilho inicial pedido: "EU QUERO"
insert into triggers (text, match_type, active)
values ('EU QUERO', 'exact', true)
on conflict do nothing;

-- O app desktop usa a anon key do Supabase diretamente (sem login de usuário),
-- então o papel "anon" precisa de privilégio explícito nas tabelas usadas.
grant usage on schema public to anon;
grant select, insert, update on public.whatsapp_groups to anon;
grant select, insert, update, delete on public.triggers to anon;
grant select, insert, update, delete on public.message_templates to anon;
grant select, insert, update on public.claimed_contacts to anon;

-- Com RLS ativo, o GRANT acima não é suficiente: sem uma policy, tudo continua
-- bloqueado. Não há login de usuário nesse app (uma anon key por cliente), então
-- liberamos acesso total para o papel "anon" em cada tabela.
alter table whatsapp_groups enable row level security;
alter table triggers enable row level security;
alter table message_templates enable row level security;
alter table claimed_contacts enable row level security;

drop policy if exists "anon full access" on whatsapp_groups;
create policy "anon full access" on whatsapp_groups for all to anon using (true) with check (true);

drop policy if exists "anon full access" on triggers;
create policy "anon full access" on triggers for all to anon using (true) with check (true);

drop policy if exists "anon full access" on message_templates;
create policy "anon full access" on message_templates for all to anon using (true) with check (true);

drop policy if exists "anon full access" on claimed_contacts;
create policy "anon full access" on claimed_contacts for all to anon using (true) with check (true);
