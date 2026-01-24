/**
 * Payment Provider Types
 * 
 * Defines the interface that all payment providers must implement.
 * This allows easy addition of new providers (M-Pesa MZ, Unitel Money AO) in Phase 2.
 */

import { PaymentStatus, PaymentProvider, CountryCode, CurrencyCode } from '../models/payment.model.js';

/**
 * Result of initiating a payment with a provider
 */
export interface ProviderInitiateResult {
  success: boolean;
  providerReference?: string;
  checkoutUrl?: string; // For redirect flows
  displayReference?: string; // For reference-based payments (Multicaixa)
  error?: string;
  rawResponse?: Record<string, unknown>;
}

/**
 * Result of querying payment status from provider
 */
export interface ProviderStatusResult {
  status: PaymentStatus;
  providerReference: string;
  reason?: string;
  paidAt?: Date;
  rawResponse?: Record<string, unknown>;
}

/**
 * Parsed webhook event from provider
 */
export interface ParsedWebhookEvent {
  providerReference: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  reason?: string;
  timestamp?: Date;
  rawPayload: Record<string, unknown>;
}

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Payment data passed to provider adapters
 */
export interface ProviderPaymentData {
  paymentId: string;
  orderId: string;
  country: CountryCode;
  currency: CurrencyCode;
  amountMinor: number;
  msisdn?: string; // Decrypted, only passed internally
  customer?: {
    name?: string;
    email?: string;
  };
  providerReference?: string; // For resend/query operations
}

/**
 * Next action for frontend after payment initiation
 */
export interface NextAction {
  type: 'POLL' | 'REDIRECT' | 'DISPLAY_REFERENCE';
  pollIntervalMs?: number;
  maxPollDurationMs?: number;
  redirectUrl?: string;
  reference?: string;
  instructions?: string;
}

/**
 * Payment Provider Interface
 * 
 * All payment providers must implement this interface.
 * This enables the orchestrator to work with any provider without knowing implementation details.
 */
export interface IPaymentProvider {
  /** Provider identifier */
  readonly name: PaymentProvider;
  
  /** Supported country */
  readonly country: CountryCode;
  
  /** Supported currency */
  readonly currency: CurrencyCode;
  
  /** Whether this provider is in mock mode */
  readonly isMockMode: boolean;
  
  /**
   * Initiate a payment with the provider
   * This triggers the payment flow (push notification, reference generation, etc.)
   */
  initiate(payment: ProviderPaymentData): Promise<ProviderInitiateResult>;
  
  /**
   * Query payment status from provider
   * Used for reconciliation and manual status checks
   */
  queryStatus(providerReference: string): Promise<ProviderStatusResult>;
  
  /**
   * Verify webhook authenticity (signature, IP allowlist, etc.)
   */
  verifyWebhook(headers: Record<string, string>, body: string | Buffer): WebhookVerificationResult;
  
  /**
   * Parse webhook payload into standard format
   */
  parseWebhook(body: Record<string, unknown>): ParsedWebhookEvent | null;
  
  /**
   * Get next action for frontend after successful initiation
   */
  getNextAction(result: ProviderInitiateResult): NextAction;
  
  /**
   * Check if resend is supported for this provider
   */
  supportsResend(): boolean;
}

/**
 * Provider configuration from environment
 */
export interface ProviderConfig {
  apiUrl: string;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  merchantId?: string;
  timeout: number;
  isMockMode: boolean;
  allowedWebhookIPs?: string[];
}
