# Technology Stack

## Existing low-cost direction
- Frontend: static web application deployed to GitHub Pages
- Backend: Render free service
- Database: Supabase PostgreSQL free tier
- Domain: custom domain

## Suggested application stack
- Frontend: Next.js/React
- Backend: Node.js + TypeScript
- ORM: Prisma or equivalent
- Database: PostgreSQL
- Validation: Zod or equivalent
- Authentication: single-owner authentication with strong MFA where available

## Rule
Choose services behind interfaces so providers can be replaced without rewriting business logic.
