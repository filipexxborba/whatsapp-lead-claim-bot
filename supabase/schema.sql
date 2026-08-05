-- Rode este script no SQL Editor do Supabase, uma vez por projeto (um projeto por cliente).
create extension if not exists pgcrypto;

create table if not exists whatsapp_groups (
  jid text primary key,
  name text not null,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Cada gatilho dispara o template vinculado a ele (template_id), o que permite
-- ter vários gatilhos ativos ao mesmo tempo, cada um com sua própria mensagem.
create table if not exists triggers (
  id uuid primary key default gen_random_uuid(),
  text text not null unique,
  match_type text not null default 'contains' check (match_type in ('exact', 'contains')),
  active boolean not null default true,
  template_id uuid references message_templates(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Migração para projetos que rodaram este script antes de o gatilho ter um
-- template próprio: adiciona a coluna sem quebrar dados existentes, e remove
-- o antigo campo "active" de templates — não existe mais "o" template ativo,
-- cada gatilho aponta pro seu próprio template.
alter table triggers add column if not exists template_id uuid references message_templates(id) on delete set null;
alter table message_templates drop column if exists active;

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

-- Auditoria: toda mudança de configuração (grupo, gatilho, template) fica registrada
-- aqui pelo próprio app, com o estado antes/depois em jsonb. Não guarda leads
-- (claimed_contacts já é seu próprio histórico) nem quem fez, já que não há login
-- de usuário — só existe uma anon key por cliente.
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('group', 'trigger', 'template')),
  entity_id text not null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_entity_idx on audit_log (entity_type, entity_id);
create index if not exists audit_log_created_at_idx on audit_log (created_at desc);

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
-- Só select+insert em audit_log (nunca update/delete): o log é append-only por design.
grant select, insert on public.audit_log to anon;

-- Com RLS ativo, o GRANT acima não é suficiente: sem uma policy, tudo continua
-- bloqueado. Não há login de usuário nesse app (uma anon key por cliente), então
-- liberamos acesso total para o papel "anon" em cada tabela.
alter table whatsapp_groups enable row level security;
alter table triggers enable row level security;
alter table message_templates enable row level security;
alter table claimed_contacts enable row level security;
alter table audit_log enable row level security;

drop policy if exists "anon full access" on whatsapp_groups;
create policy "anon full access" on whatsapp_groups for all to anon using (true) with check (true);

drop policy if exists "anon full access" on triggers;
create policy "anon full access" on triggers for all to anon using (true) with check (true);

drop policy if exists "anon full access" on message_templates;
create policy "anon full access" on message_templates for all to anon using (true) with check (true);

drop policy if exists "anon full access" on claimed_contacts;
create policy "anon full access" on claimed_contacts for all to anon using (true) with check (true);

drop policy if exists "anon read" on audit_log;
create policy "anon read" on audit_log for select to anon using (true);
drop policy if exists "anon insert" on audit_log;
create policy "anon insert" on audit_log for insert to anon with check (true);
