/**
 * eMola Provider Adapter
 * 
 * Handles mobile money payments in Mozambique via eMola.
 * Implements push/checkout flow where user receives a prompt on their phone.
 * 
 * IMPLEMENTATION NOTES:
 * - Real API integration requires eMola sandbox/production credentials
 * - Mock mode simulates the flow for development/testing
 * - TODO: Replace mock implementation with real eMola API calls when credentials available
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
 * Get eMola configuration from environment
 */
function getConfig(): ProviderConfig {
  return {
    apiUrl: process.env.EMOLA_API_URL || 'https://api.emola.co.mz',
    apiKey: process.env.EMOLA_API_KEY,
    apiSecret: process.env.EMOLA_API_SECRET,
    webhookSecret: process.env.EMOLA_WEBHOOK_SECRET,
    merchantId: process.env.EMOLA_MERCHANT_ID,
    timeout: parseInt(process.env.EMOLA_TIMEOUT || '30000', 10),
    isMockMode: process.env.EMOLA_MOCK === 'true',
    allowedWebhookIPs: process.env.EMOLA_WEBHOOK_IPS?.split(',').map(ip => ip.trim()),
  };
}

/**
 * eMola Provider Implementation
 */
class EmolaProvider implements IPaymentProvider {
  readonly name = 'EMOLA' as const;
  readonly country = 'MZ' as const;
  readonly currency = 'MZN' as const;
  
  private config: ProviderConfig;
  
  constructor() {
    this.config = getConfig();
  }
  
  get isMockMode(): boolean {
    return this.config.isMockMode;
  }
  
  /**
   * Initiate eMola payment
   * In production: sends push notification to user's phone
   * In mock mode: generates a fake reference and simulates success
   */
  async initiate(payment: ProviderPaymentData): Promise<ProviderInitiateResult> {
    if (this.config.isMockMode) {
      return this.mockInitiate(payment);
    }
    
    // TODO: Implement real eMola API call
    // Real implementation would:
    // 1. Call eMola API to create payment request
    // 2. eMola sends push to user's phone
    // 3. User confirms on phone
    // 4. eMola sends webhook with result
    
    console.log('[eMola] Real API not implemented, falling back to mock');
    return this.mockInitiate(payment);
  }
  
  /**
   * Mock initiation for development
   */
  private async mockInitiate(payment: ProviderPaymentData): Promise<ProviderInitiateResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const providerReference = `EMOLA-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    console.log(`[eMola MOCK] Initiated payment ${payment.paymentId} -> ${providerReference}`);
    
    // In mock mode with auto-complete, schedule success webhook simulation
    if (process.env.EMOLA_MOCK_AUTO_COMPLETE === 'true') {
      const delay = parseInt(process.env.EMOLA_MOCK_COMPLETE_DELAY || '10000', 10);
      console.log(`[eMola MOCK] Will auto-complete in ${delay}ms`);
      // Note: Auto-complete is handled by a separate mock endpoint or timer
    }
    
    return {
      success: true,
      providerReference,
      rawResponse: {
        mock: true,
        timestamp: new Date().toISOString(),
      },
    };
  }
  
  /**
   * Query payment status from eMola
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
    
    // TODO: Implement real eMola status query API
    // Real implementation would:
    // 1. Call eMola API with providerReference
    // 2. Parse response and map to our status
    
    console.log(`[eMola] Status query not implemented for ${providerReference}`);
    return {
      status: 'PENDING',
      providerReference,
      reason: 'Status query not yet implemented',
    };
  }
  
  /**
   * Verify eMola webhook authenticity
   */
  verifyWebhook(headers: Record<string, string>, body: string | Buffer): WebhookVerificationResult {
    const signature = headers['x-emola-signature'] || headers['X-Emola-Signature'];
    
    // If no webhook secret configured, skip verification in development
    if (!this.config.webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        return { isValid: false, reason: 'Webhook secret not configured' };
      }
      console.warn('[eMola] Webhook verification skipped - no secret configured');
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
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    
    return {
      isValid,
      reason: isValid ? 'Signature verified' : 'Signature mismatch',
    };
  }
  
  /**
   * Parse eMola webhook payload
   */
  parseWebhook(body: Record<string, unknown>): ParsedWebhookEvent | null {
    try {
      // TODO: Adjust to actual eMola webhook payload structure
      // This is a placeholder based on common mobile money webhook patterns
      
      const providerReference = body.reference as string || body.transactionId as string;
      const rawStatus = body.status as string || body.state as string;
      
      if (!providerReference) {
        console.error('[eMola] Webhook missing reference');
        return null;
      }
      
      // Map eMola status to our status
      let status: PaymentStatus;
      switch (rawStatus?.toUpperCase()) {
        case 'SUCCESS':
        case 'COMPLETED':
        case 'PAID':
          status = 'SUCCESS';
          break;
        case 'FAILED':
        case 'DECLINED':
        case 'CANCELLED':
        case 'CANCELED':
          status = 'FAILED';
          break;
        case 'EXPIRED':
        case 'TIMEOUT':
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
      console.error('[eMola] Failed to parse webhook:', error);
      return null;
    }
  }
  
  /**
   * Get next action for frontend
   */
  getNextAction(_result: ProviderInitiateResult): NextAction {
    return {
      type: 'POLL',
      pollIntervalMs: 3000,
      maxPollDurationMs: 120000, // 2 minutes
      instructions: 'Check your phone for the eMola payment prompt. Approve the payment to complete.',
    };
  }
  
  /**
   * eMola supports resending the push notification
   */
  supportsResend(): boolean {
    return true;
  }
}

// Export singleton instance
export const emolaProvider = new EmolaProvider();
