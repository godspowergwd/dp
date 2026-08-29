# AI Architecture

## AI Gateway
The frontend never calls model providers directly.

Application → AI Gateway → Provider Router → Provider

## Task classes
- cheap/bulk: classification, extraction, drafts
- standard: product analysis and marketing copy
- premium: complex reasoning and final decisions
- multimodal: image/video understanding and generation

## Store for every AI job
task type, model/provider, input metadata, output, token/usage data when available, estimated cost, latency, status and error.

## Guardrails
AI may recommend actions, but publishing, supplier switching and other consequential actions should be configurable for human approval.
