# Private Dropshipping Operating System

A private, single-operator commerce command center for researching products,
managing suppliers, generating AI marketing assets, publishing to connected
storefronts, and monitoring orders and performance.

> **Guiding rule:** Never expose supplier, payment, AI, or social API secrets in
> the frontend. All credentials live server-side only.

## Monorepo layout

```
PD/
├── apps/
│   ├── api/        Backend (Fastify + TypeScript + Prisma + Zod) - modular monolith
│   └── web/        Frontend (Next.js static export)
├── packages/
│   └── shared/     Shared TypeScript types + Zod schemas
├── private-dropshipping-platform-docs/   Original documentation/specs
└── .github/        CI workflows
```

## Status

✅ **Phase 0/1 (Foundation) complete and verified live against Supabase.**
Database schema (25 tables, 11 enums) is migrated, owner account seeded, and the
API server runs with working auth, validation, and CRUD. See
[`docs/17-ROADMAP.md`](private-dropshipping-platform-docs/docs/17-ROADMAP.md) for
the full plan.

## Prerequisites

- Node.js >= 20 (tested on 22)
- PostgreSQL (local or Supabase free tier)
- npm

## Getting started

> **Database:** You can use local PostgreSQL **or** a hosted one (e.g. Supabase
> free tier). Hosted is recommended — it avoids local `pg_hba` / admin issues.
> The initial schema is applied via `prisma db push` or `migrate deploy`
> against your database's **direct session connection** (not the transaction
> pooler) — the transaction pooler cannot run DDL.

```bash
npm install

# 1. Configure the environment
#    Copy apps/api/.env.example -> apps/api/.env and set DATABASE_URL.
#    Hosted example (Supabase):
#      DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
#    Local example:
#      DATABASE_URL="postgresql://<user>:<password>@localhost:5432/dropshipping_os"
cp .env.example apps/api/.env

# 2. Generate the Prisma client
npm run db:generate

# 3. Create tables.
#    For HOSTED PostgreSQL (no shadow DB needed):
npm run db:migrate -- -w @pd/api -- deploy          # applies the committed migration
#    For LOCAL PostgreSQL you can optionally develop migrations instead:
#       npm run db:deploy                            # same as above, from the api workspace
#       npm run db:migrate -- -w @pd/api -- --name init   # local dev migration (needs shadow DB)

# 4. Create the initial operator account (reads ADMIN_EMAIL/ADMIN_PASSWORD,
#    defaults to owner@example.com / change-me-strong-password)
$env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="a-strong-password"
npm run db:seed

# 5. Run the API
npm run dev:api                      # http://localhost:4000

# 6. Run the web app
npm run dev:web                      # http://localhost:3000
```

## Scripts

| Script            | Description                        |
|-------------------|------------------------------------|
| `npm run dev:api` | Start backend in watch mode        |
| `npm run dev:web` | Start Next.js frontend             |
| `npm run build`   | Build all workspaces               |
| `npm run typecheck` | Type-check all workspaces        |
| `npm run lint`    | Lint all workspaces                |
| `npm test`        | Run unit tests                     |

## Core modules

1. Product Research
2. Product & Supplier Management
3. Storefront Integrations
4. AI Studio
5. Marketing & Social Publishing
6. Orders & Fulfillment
7. Analytics
8. Settings & Integrations

## Documentation

Original specs live in `private-dropshipping-platform-docs/docs/` (indexed in
`docs/INDEX.md`). Architecture decisions are recorded as ADRs in
`docs/20-AUDIT-AND-DECISIONS.md`.
