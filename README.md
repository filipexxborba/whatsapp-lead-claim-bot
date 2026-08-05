# Lead Claim Bot

Bot desktop (Electron) para WhatsApp: monitora grupos, reage quando alguém manda uma
mensagem-gatilho (ex: "EU QUERO") e manda uma DM automática com o template configurado
para aquele gatilho — permitindo reservar leads de promoções em grupo automaticamente.

- **WhatsApp**: [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- **Dados**: Supabase (schema em [`supabase/schema.sql`](supabase/schema.sql) — rode uma
  vez por projeto/cliente no SQL Editor)
- **UI**: Electron + React + Tailwind

## Setup

```bash
npm install
```

Rode o script em `supabase/schema.sql` no SQL Editor do projeto Supabase do cliente antes
do primeiro uso.

## Desenvolvimento

```bash
npm run dev
```

## Build local

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## Publicar uma release (auto-update)

O app já vem com atualização automática via `electron-updater`, publicando releases no
GitHub. Gere um token (`gh auth token`, se tiver o GitHub CLI autenticado) e rode:

```bash
npm run release -- --token=SEU_TOKEN        # Windows + macOS
npm run release:win -- --token=SEU_TOKEN
npm run release:mac -- --token=SEU_TOKEN
```
