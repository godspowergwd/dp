# System Architecture

## High-level design
Frontend → Backend API → PostgreSQL
                       ↘ AI Gateway → AI providers
                       ↘ Integration adapters → suppliers/stores/social APIs
                       ↘ Job queue → background workers

## Recommended initial architecture
Use a modular monolith rather than microservices.

Modules:
- auth
- products
- research
- suppliers
- stores
- orders
- AI
- marketing
- analytics
- integrations
- audit

## Background jobs
Long-running research, content generation, imports, publishing and synchronization must run asynchronously.

## Design principles
- Provider abstraction interfaces
- Idempotency keys for external writes
- Webhook signature verification
- Retry with backoff
- Dead-letter/error state for failed jobs
