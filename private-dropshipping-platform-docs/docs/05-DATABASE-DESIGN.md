# Database Design

## Core tables
users
settings
products
product_variants
product_sources
product_research
product_scores
suppliers
supplier_products
stores
store_products
orders
order_items
fulfillment_events
tracking_events
ai_jobs
ai_outputs
ai_usage
assets
marketing_campaigns
publish_jobs
integration_connections
integration_events
audit_logs

## Important relationships
Product → many variants
Product → many research records
Product → many supplier products
Product → many store products
Order → many order items
AI job → many outputs
Integration connection → many events

## Data rules
Use UUID primary keys, created_at/updated_at timestamps, soft deletion where recovery matters, and encrypted/protected credential storage.
