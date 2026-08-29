# Master Product Specification

## Vision
Build a private commerce command center that helps one operator discover products, evaluate opportunities, prepare listings, create marketing assets, publish to stores, and monitor the operational lifecycle.

## Primary user
One authenticated owner/operator.

## Success criteria
- A product can move from discovery to research, approval, listing preparation and store publication through a traceable workflow.
- AI costs are logged per task and provider.
- Every external action has status, timestamps and error history.
- Credentials remain server-side.

## Product lifecycle
Discovery → Research → Score → Shortlist → Supplier Selection → Listing Draft → Creative Generation → Publish → Monitor → Optimize/Archive.

## Non-goals for v1
- Public registration
- Multi-tenant billing
- Marketplace for other users
- Fully autonomous purchasing without explicit operator approval

## Required approval points
Supplier changes, publishing, price changes above configured thresholds, and order actions should support explicit approval.
