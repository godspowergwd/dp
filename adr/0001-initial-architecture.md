# ADR-0001: Initial architecture decisions

- **Date:** 2026-08-29
- **Status:** Accepted

## Decisions

1. **Single-operator architecture for v1.** No public signup, no multi-tenant
   billing. The system serves one authenticated owner (docs
   `00-MASTER-SPECIFICATION.md`).
2. **Modular monolith before microservices.** A single deployable backend with
   clearly separated domain modules (`products`, `research`, `suppliers`, etc.)
   keeps operations simple on low-cost hosting while preserving boundaries.
3. **Server-side AI Gateway.** The frontend never calls AI providers directly;
   all model calls go through a backend gateway that logs cost per job
   (`07-AI-ARCHITECTURE.md`).
4. **PostgreSQL as the system of record.** All state lives in one relational
   database; UUID primary keys, timestamps and soft deletion are enforced
   (`05-DATABASE-DESIGN.md`).
5. **Explicit provider adapters.** Stores, suppliers and AI providers are hidden
   behind interfaces so they can be swapped without rewriting business logic.

## Alternatives considered

- Microservices: rejected for v1 due to operational overhead on low-cost free
  tiers.
- MySQL/SQLite: PostgreSQL chosen for Supabase free-tier compatibility and
  JSON/Decimal support.
- Direct provider calls from frontend: rejected for security (credential
  exposure) and observability reasons.

## Consequences

- Requires a PostgreSQL instance to run the backend.
- Provider integrations are built incrementally behind a stable adapter contract.
- AI spend is fully auditable via the `ai_jobs` / `ai_usage` tables.
