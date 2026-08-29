# Private Dropshipping Operating System

A private, single-operator commerce operating system for researching products, managing suppliers, generating AI marketing assets, publishing to connected storefronts, and monitoring orders and performance.

## Scope
- Single owner/operator; no public signup or multi-tenant SaaS in v1.
- Frontend: static deployment.
- Backend/API: private service.
- Database: PostgreSQL.
- AI is accessed only through a server-side AI Gateway.

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
See `docs/` for the master specification, architecture, AI, database, APIs, security, deployment, testing and operations documentation.

## Guiding rule
Never expose supplier, payment, AI, or social API secrets in the frontend.
