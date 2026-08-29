# Security and Privacy

## Mandatory controls
- Secrets only on backend/environment
- No secrets in Git
- Separate development and production credentials
- Least privilege
- Strong owner authentication
- Session expiry and secure cookies/tokens
- CSRF protection where applicable
- Rate limiting
- Input validation
- Audit logs
- Backup and restore testing

## Credentials
Store integration credentials encrypted or use a managed secrets mechanism. Never log tokens, passwords or raw API keys.

## Privacy
Collect only operational data necessary for the platform and document third-party data sharing.
