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

## Prerequisites

- Node.js >= 20 (tested on 22)
- PostgreSQL (or Supabase free tier)
- npm

## Getting started

```bash
npm install

# 1. Database
cp .env.example apps/api/.env        # fill in values
npm run db:generate                  # generate Prisma client
npm run db:migrate -- --name init    # create tables
npm run db:seed                      # create the initial operator account

# 2. Run the API
npm run dev:api                      # http://localhost:4000

# 3. Run the web app
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
