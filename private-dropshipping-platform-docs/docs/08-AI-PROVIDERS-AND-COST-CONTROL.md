# AI Providers and Cost Control

## Provider strategy
Do not hard-code the application to one provider. Create adapters for:
- primary reasoning provider
- economical bulk provider
- optional research/search provider
- image provider
- voice provider
- video provider

## Cost controls
- monthly budget
- per-day budget
- per-job maximum
- cache repeatable outputs
- use cheaper models for drafts
- require approval for expensive media jobs
- display provider usage in the dashboard

## Routing policy
Bulk extraction → economical model
Deep analysis → premium model
Creative generation → specialized model
