/**
 * Multicaixa Express Provider Adapter
 * 
 * Handles local rail payments in Angola via Multicaixa Express.
 * Implements reference/checkout flow where user gets a reference to pay at ATM/bank.
 * 
 * IMPLEMENTATION NOTES:
 * - Real API integration requires Multicaixa sandbox/production credentials
 * - Mock mode simulates the flow for development/testing
 * - TODO: Replace mock implementation with real Multicaixa API calls when credentials available
 */

import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentProvider,
  ProviderConfig,
  ProviderPaymentData,
  ProviderInitiateResult,
  ProviderStatusResult,
  WebhookVerificationResult,
  ParsedWebhookEvent,
  NextAction,
} from './providerTypes.js';
import { PaymentStatus } from '../models/payment.model.js';

/**
 * Get Multicaixa configuration from environment
 */
function getConfig(): ProviderConfig {
  return {
    apiUrl: process.env.MULTICAIXA_API_URL || 'https://api.multicaixa.co.ao',
    apiKey: process.env.MULTICAIXA_API_KEY,
    apiSecret: process.env.MULTICAIXA_API_SECRET,
    webhookSecret: process.env.MULTICAIXA_WEBHOOK_SECRET,
    merchantId: process.env.MULTICAIXA_MERCHANT_ID,
    timeout: parseInt(process.env.MULTICAIXA_TIMEOUT || '30000', 10),
    isMockMode: process.env.MULTICAIXA_MOCK === 'true',
    allowedWebhookIPs: process.env.MULTICAIXA_WEBHOOK_IPS?.split(',').map(ip => ip.trim()),
  };
}

/**
 * Generate a Multicaixa-style payment reference
 * Format: 9 digits starting with entity code
 */
function generateMockReference(): string {
  // Entity code (first 5 digits) + random 4 digits
  const entityCode = '12345'; // Mock entity code
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `${entityCode}${random}`;
}

/**
 * Multicaixa Express Provider Implementation
 */
class MulticaixaProvider implements IPaymentProvider {
  readonly name = 'MULTICAIXA' as const;
  readonly country = 'AO' as const;
  readonly currency = 'AOA' as const;
  
  private config: ProviderConfig;
  
  constructor() {
    this.config = getConfig();
  }
  
  get isMockMode(): boolean {
    return this.config.isMockMode;
  }
  
  /**
   * Initiate Multicaixa payment
   * In production: generates a payment reference for the user
   * In mock mode: generates a fake reference
   */
  async initiate(payment: ProviderPaymentData): Promise<ProviderInitiateResult> {
    if (this.config.isMockMode) {
      return this.mockInitiate(payment);
    }
    
    // TODO: Implement real Multicaixa API call
    // Real implementation would:
    // 1. Call Multicaixa API to create payment reference
    // 2. Get reference number and expiry
    // 3. User pays at ATM/bank using reference
    // 4. Multicaixa sends webhook when payment confirmed
    
    console.log('[Multicaixa] Real API not implemented, falling back to mock');
    return this.mockInitiate(payment);
  }
  
  /**
   * Mock initiation for development
   */
  private async mockInitiate(payment: ProviderPaymentData): Promise<ProviderInitiateResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const providerReference = generateMockReference();
    
    console.log(`[Multicaixa MOCK] Initiated payment ${payment.paymentId} -> Reference: ${providerReference}`);
    
    // In mock mode with auto-complete, schedule success webhook simulation
    if (process.env.MULTICAIXA_MOCK_AUTO_COMPLETE === 'true') {
      const delay = parseInt(process.env.MULTICAIXA_MOCK_COMPLETE_DELAY || '15000', 10);
      console.log(`[Multicaixa MOCK] Will auto-complete in ${delay}ms`);
    }
    
    return {
      success: true,
      providerReference,
      displayReference: providerReference,
      rawResponse: {
        mock: true,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
    };
  }
  
  /**
   * Query payment status from Multicaixa
   */
  async queryStatus(providerReference: string): Promise<ProviderStatusResult> {
    if (this.config.isMockMode) {
      // In mock mode, always return PENDING (webhook will update status)
      return {
        status: 'PENDING',
        providerReference,
        rawResponse: { mock: true, message: 'Status query in mock mode returns PENDING' },
      };
    }
    
    // TODO: Implement real Multicaixa status query API
    // Real implementation would:
    // 1. Call Multicaixa API with providerReference
    // 2. Parse response and map to our status
    
    console.log(`[Multicaixa] Status query not implemented for ${providerReference}`);
    return {
      status: 'PENDING',
      providerReference,
      reason: 'Status query not yet implemented',
    };
  }
  
  /**
   * Verify Multicaixa webhook authenticity
   */
  verifyWebhook(headers: Record<string, string>, body: string | Buffer): WebhookVerificationResult {
    const signature = headers['x-multicaixa-signature'] || headers['X-Multicaixa-Signature'];
    
    // If no webhook secret configured, skip verification in development
    if (!this.config.webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        return { isValid: false, reason: 'Webhook secret not configured' };
      }
      console.warn('[Multicaixa] Webhook verification skipped - no secret configured');
      return { isValid: true, reason: 'Verification skipped (development mode)' };
    }
    
    if (!signature) {
      // Check IP allowlist if no signature
      if (this.config.allowedWebhookIPs && this.config.allowedWebhookIPs.length > 0) {
        const clientIP = headers['x-forwarded-for'] || headers['x-real-ip'];
        if (clientIP && this.config.allowedWebhookIPs.includes(clientIP)) {
          return { isValid: true, reason: 'IP allowlist match' };
        }
        return { isValid: false, reason: 'IP not in allowlist and no signature' };
      }
      return { isValid: false, reason: 'No signature header present' };
    }
    
    // Verify HMAC-SHA256 signature
    const bodyString = typeof body === 'string' ? body : body.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(bodyString)
      .digest('hex');
    
    // Use timing-safe comparison
    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
      return {
        isValid,
        reason: isValid ? 'Signature verified' : 'Signature mismatch',
      };
    } catch {
      return { isValid: false, reason: 'Signature comparison failed' };
    }
  }
  
  /**
   * Parse Multicaixa webhook payload
   */
  parseWebhook(body: Record<string, unknown>): ParsedWebhookEvent | null {
    try {
      // TODO: Adjust to actual Multicaixa webhook payload structure
      // This is a placeholder based on common payment reference webhook patterns
      
      const providerReference = body.reference as string || body.paymentReference as string;
      const rawStatus = body.status as string || body.state as string;
      
      if (!providerReference) {
        console.error('[Multicaixa] Webhook missing reference');
        return null;
      }
      
      // Map Multicaixa status to our status
      let status: PaymentStatus;
      switch (rawStatus?.toUpperCase()) {
        case 'PAID':
        case 'SUCCESS':
        case 'COMPLETED':
        case 'CONFIRMED':
          status = 'SUCCESS';
          break;
        case 'FAILED':
        case 'DECLINED':
        case 'CANCELLED':
        case 'CANCELED':
          status = 'FAILED';
          break;
        case 'EXPIRED':
          status = 'EXPIRED';
          break;
        default:
          status = 'PENDING';
      }
      
      return {
        providerReference,
        status,
        amount: body.amount as number,
        currency: body.currency as string,
        reason: body.reason as string || body.message as string,
        timestamp: body.timestamp ? new Date(body.timestamp as string) : new Date(),
        rawPayload: body,
      };
    } catch (error) {
      console.error('[Multicaixa] Failed to parse webhook:', error);
      return null;
    }
  }
  
  /**
   * Get next action for frontend
   */
  getNextAction(result: ProviderInitiateResult): NextAction {
    return {
      type: 'DISPLAY_REFERENCE',
      reference: result.displayReference || result.providerReference,
      pollIntervalMs: 5000, // Less frequent polling for reference-based payments
      maxPollDurationMs: 300000, // 5 minutes
      instructions: `Use this reference to pay at any Multicaixa ATM or bank: ${result.displayReference || result.providerReference}`,
    };
  }
  
  /**
   * Multicaixa does not support resending (reference is already issued)
   */
  supportsResend(): boolean {
    return false;
  }
}

// Export singleton instance
export const multicaixaProvider = new MulticaixaProvider();
