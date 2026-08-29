# Supplier Integration Specification

## Integration adapter contract
- search/import product
- get product details
- get variants
- get price/availability where permitted
- create fulfillment request where permitted
- retrieve fulfillment status
- retrieve tracking

## Important
Each supplier must be integrated according to its official API terms and permissions. Do not rely on unauthorized automation where an official integration is required.

## Data normalization
Normalize supplier-specific fields into common internal Product, Variant and Fulfillment models.
