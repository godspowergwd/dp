# API Specification

Base prefix: `/api/v1`

## Example resource groups
- `/auth`
- `/products`
- `/research`
- `/suppliers`
- `/stores`
- `/orders`
- `/ai/jobs`
- `/assets`
- `/analytics`
- `/integrations`
- `/settings`

## API conventions
- JSON
- explicit versioning
- request validation
- pagination for lists
- consistent error envelope
- correlation/request IDs
- idempotency keys for external writes

## AI job flow
POST `/ai/jobs` creates a job.
GET `/ai/jobs/:id` returns status and results.
