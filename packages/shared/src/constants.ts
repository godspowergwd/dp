/**
 * Core domain constants + shared enums used across API and web.
 * Single source of truth for lifecycle statuses and enums.
 */

/** Product lifecycle statuses (see docs/01-REQUIREMENTS.md). */
export const PRODUCT_STATUS = [
  'discovered',
  'researching',
  'shortlisted',
  'approved',
  'rejected',
  'drafting',
  'published',
  'paused',
  'archived',
] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

/** Research decision status. */
export const RESEARCH_DECISION = ['recommended', 'caution', 'not_recommended'] as const;
export type ResearchDecision = (typeof RESEARCH_DECISION)[number];

/** Order lifecycle statuses. */
export const ORDER_STATUS = [
  'pending',
  'awaiting_fulfillment',
  'fulfilled',
  'partial',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

/** AI job task classes (see docs/07-AI-ARCHITECTURE.md). */
export const AI_TASK_CLASS = [
  'cheap_bulk',
  'standard',
  'premium',
  'multimodal',
] as const;
export type AiTaskClass = (typeof AI_TASK_CLASS)[number];

/** AI job status. */
export const AI_JOB_STATUS = ['queued', 'running', 'succeeded', 'failed', 'cancelled'] as const;
export type AiJobStatus = (typeof AI_JOB_STATUS)[number];

/** Publish job status (draft -> validation -> approval -> publish). */
export const PUBLISH_JOB_STATUS = [
  'draft',
  'validating',
  'awaiting_approval',
  'approved',
  'published',
  'failed',
  'cancelled',
] as const;
export type PublishJobStatus = (typeof PUBLISH_JOB_STATUS)[number];

/** Integration provider types. */
export const PROVIDER_TYPE = ['store', 'supplier', 'ai', 'social'] as const;
export type ProviderType = (typeof PROVIDER_TYPE)[number];

/** Connection status. */
export const CONNECTION_STATUS = ['connecting', 'connected', 'error', 'disconnected'] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUS)[number];

/** Approval decision enum (used for supplier changes, publishing, orders). */
export const APPROVAL_DECISION = ['pending', 'approved', 'rejected'] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISION)[number];

/** Asset/media types. */
export const ASSET_TYPE = ['image', 'video', 'audio', 'document'] as const;
export type AssetType = (typeof ASSET_TYPE)[number];
