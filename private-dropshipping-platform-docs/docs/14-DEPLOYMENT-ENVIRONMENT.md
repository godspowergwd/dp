# Deployment and Environment

## Environments
development, staging (optional), production.

## Current low-cost deployment concept
Frontend: static hosting
Backend: free backend service
Database: hosted PostgreSQL free tier

## Required environment variables
DATABASE_URL
APP_URL
AUTH_SECRET
ENCRYPTION_KEY
AI_PROVIDER_KEYS...
STORE_PROVIDER_KEYS...
SUPPLIER_PROVIDER_KEYS...

Keep `.env` out of source control and maintain `.env.example` with placeholder names only.
