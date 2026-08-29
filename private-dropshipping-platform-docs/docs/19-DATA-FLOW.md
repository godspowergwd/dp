# Data Flow

1. Operator adds a product source.
2. Backend stores raw source metadata.
3. Background job gathers permitted structured data.
4. Research job produces normalized findings.
5. Operator approves/rejects.
6. Approved product moves to listing generation.
7. Assets are generated and stored.
8. Publish job sends approved content to connected store.
9. External response is recorded.
10. Analytics and operational events update the product timeline.
