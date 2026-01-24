/**
 * Payment Orchestrator
 * 
 * Central service for managing payment lifecycle.
 * Handles idempotency, provider coordination, and status management.
 */

import * as crypto from 'crypto';
import mongoose from 'mongoose';
import { Payment, IPayment, PaymentStatus, PaymentProvider, CountryCode, CurrencyCode, PaymentMethod } from './models/payment.model.js';
import { PaymentEvent } from './models/payment-event.model.js';
import { getProvider, getProviderForCountry, getProviderNameForCountry, isCountrySupported } from './providers/index.js';
import { NextAction } from './providers/providerTypes.js';
import { prepareMsisdnForStorage, decryptMsisdn, maskMsisdn } from './crypto/piiCrypto.js';
import { isTerminalStatus, isValidTransition } from './mapping/statusMapping.js';

/**
 * Request to initiate a payment
 */
export interface InitiatePaymentRequest {
  orderId: string;
  country: string;
  amount: number; // Minor units (centavos)
  currency: string;
  method: string;
  msisdn?: string;
  customer?: {
    name?: string;
    email?: string;
  };
}

/**
 * Response from payment initiation
 */
export interface InitiatePaymentResponse {
  paymentId: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerReference?: string;
  nextAction?: NextAction;
}

/**
 * Public payment data (safe to return to clients)
 */
export interface PublicPaymentData {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  currency: CurrencyCode;
  country: CountryCode;
  provider: PaymentProvider;
  createdAt: string;
  updatedAt: string;
  msisdnLast4?: string;
  failureReason?: string;
  providerReference?: string;
}

/**
 * Idempotency window in milliseconds (10 minutes)
 */
const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000;

/**
 * Resend throttle window in milliseconds (30 seconds)
 */
const RESEND_THROTTLE_MS = 30 * 1000;

/**
 * Generate idempotency key
 * Uses: orderId + country + amountMinor + currency + provider + time_bucket
 */
function generateIdempotencyKey(
  orderId: string,
  country: CountryCode,
  amountMinor: number,
  currency: CurrencyCode,
  provider: PaymentProvider
): string {
  // Time bucket: floor(now / 10 minutes)
  const timeBucket = Math.floor(Date.now() / IDEMPOTENCY_WINDOW_MS);
  
  const data = `${orderId}:${country}:${amountMinor}:${currency}:${provider}:phase1:${timeBucket}`;
  
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate country code
 */
function validateCountry(country: string): CountryCode {
  if (!isCountrySupported(country)) {
    throw new Error(`Unsupported country: ${country}. Supported: MZ, AO`);
  }
  return country;
}

/**
 * Validate currency for country
 */
function validateCurrency(currency: string, country: CountryCode): CurrencyCode {
  const validCurrencies: Record<CountryCode, CurrencyCode> = {
    'MZ': 'MZN',
    'AO': 'AOA',
  };
  
  const expectedCurrency = validCurrencies[country];
  if (currency !== expectedCurrency) {
    throw new Error(`Invalid currency ${currency} for country ${country}. Expected: ${expectedCurrency}`);
  }
  
  return currency as CurrencyCode;
}

/**
 * Validate payment method
 */
function validateMethod(method: string): PaymentMethod {
  if (method !== 'MOBILE_MONEY' && method !== 'LOCAL_RAIL') {
    throw new Error(`Invalid payment method: ${method}. Supported: MOBILE_MONEY, LOCAL_RAIL`);
  }
  return method;
}

/**
 * Payment Orchestrator Class
 */
class PaymentOrchestrator {
  /**
   * Initiate a new payment
   * Implements idempotency - returns existing payment if same request within window
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    // Validate inputs
    const country = validateCountry(request.country);
    const currency = validateCurrency(request.currency, country);
    const method = validateMethod(request.method);
    const amountMinor = Math.floor(request.amount);
    
    if (amountMinor <= 0) {
      throw new Error('Amount must be a positive integer (minor units)');
    }
    
    // Get provider for this country
    const providerName = getProviderNameForCountry(country);
    const provider = getProvider(providerName);
    
    // Validate MSISDN requirement for mobile money
    if (method === 'MOBILE_MONEY' && providerName === 'EMOLA' && !request.msisdn) {
      throw new Error('MSISDN (phone number) is required for eMola payments');
    }
    
    // Generate idempotency key
    const idempotencyKey = generateIdempotencyKey(
      request.orderId,
      country,
      amountMinor,
      currency,
      providerName
    );
    
    // Check for existing payment with same idempotency key
    const existingPayment = await Payment.findOne({ idempotencyKey });
    
    if (existingPayment) {
      console.log(`[Orchestrator] Found existing payment for idempotency key: ${existingPayment._id}`);
      
      // Return existing payment
      return {
        paymentId: existingPayment._id.toString(),
        status: existingPayment.status,
        provider: existingPayment.provider,
        providerReference: existingPayment.providerReference,
        nextAction: existingPayment.providerReference ? provider.getNextAction({
          success: true,
          providerReference: existingPayment.providerReference,
          displayReference: existingPayment.providerReference,
        }) : undefined,
      };
    }
    
    // Prepare MSISDN for storage (encrypt + extract last4)
    let msisdnEncrypted: string | undefined;
    let msisdnLast4: string | undefined;
    
    if (request.msisdn) {
      const prepared = prepareMsisdnForStorage(request.msisdn);
      msisdnEncrypted = prepared.encrypted;
      msisdnLast4 = prepared.last4;
      console.log(`[Orchestrator] MSISDN prepared for storage: ***${prepared.last4}`);
    }
    
    // Create payment record
    const payment = new Payment({
      orderId: request.orderId,
      country,
      currency,
      amountMinor,
      method,
      provider: providerName,
      status: 'CREATED',
      idempotencyKey,
      msisdnEncrypted,
      msisdnLast4,
      customer: request.customer,
    });
    
    await payment.save();
    console.log(`[Orchestrator] Created payment: ${payment._id}`);
    
    // Log initiation event
    await this.logEvent(payment._id, providerName, 'initiate.requested', {
      orderId: request.orderId,
      country,
      amountMinor,
      currency,
      method,
      msisdnMasked: request.msisdn ? maskMsisdn(request.msisdn) : undefined,
    });
    
    // Initiate with provider
    try {
      const result = await provider.initiate({
        paymentId: payment._id.toString(),
        orderId: request.orderId,
        country,
        currency,
        amountMinor,
        msisdn: request.msisdn, // Pass raw MSISDN to provider (internal use only)
        customer: request.customer,
      });
      
      if (!result.success) {
        // Update payment as failed
        payment.status = 'FAILED';
        payment.failureReason = result.error || 'Provider initiation failed';
        await payment.save();
        
        await this.logEvent(payment._id, providerName, 'error', {
          error: result.error,
          rawResponse: result.rawResponse,
        });
        
        throw new Error(result.error || 'Failed to initiate payment with provider');
      }
      
      // Update payment with provider reference
      payment.status = 'PENDING';
      payment.providerReference = result.providerReference;
      payment.lastInitiatedAt = new Date();
      await payment.save();
      
      await this.logEvent(payment._id, providerName, 'status.changed', {
        from: 'CREATED',
        to: 'PENDING',
        providerReference: result.providerReference,
      });
      
      return {
        paymentId: payment._id.toString(),
        status: payment.status,
        provider: providerName,
        providerReference: result.providerReference,
        nextAction: provider.getNextAction(result),
      };
    } catch (error) {
      // If provider call fails, update payment status
      if (payment.status === 'CREATED') {
        payment.status = 'FAILED';
        payment.failureReason = error instanceof Error ? error.message : 'Unknown error';
        await payment.save();
      }
      throw error;
    }
  }
  
  /**
   * Get payment by ID (public data only)
   */
  async getPayment(paymentId: string): Promise<PublicPaymentData | null> {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return null;
    }
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return null;
    }
    
    return this.toPublicPayment(payment);
  }
  
  /**
   * Resend payment prompt (for mobile money providers that support it)
   */
  async resendPayment(paymentId: string): Promise<InitiatePaymentResponse> {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new Error('Invalid payment ID');
    }
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    // Check if payment is in resendable state
    if (payment.status !== 'PENDING') {
      throw new Error(`Cannot resend payment in ${payment.status} status. Only PENDING payments can be resent.`);
    }
    
    // Get provider
    const provider = getProvider(payment.provider);
    
    // Check if provider supports resend
    if (!provider.supportsResend()) {
      throw new Error(`Provider ${payment.provider} does not support resending payment prompts`);
    }
    
    // Check throttle (30 seconds between resends)
    if (payment.lastInitiatedAt) {
      const timeSinceLastInitiate = Date.now() - payment.lastInitiatedAt.getTime();
      if (timeSinceLastInitiate < RESEND_THROTTLE_MS) {
        const waitSeconds = Math.ceil((RESEND_THROTTLE_MS - timeSinceLastInitiate) / 1000);
        throw new Error(`Please wait ${waitSeconds} seconds before resending`);
      }
    }
    
    // Decrypt MSISDN for provider
    let msisdn: string | undefined;
    if (payment.msisdnEncrypted) {
      msisdn = decryptMsisdn(payment.msisdnEncrypted);
    }
    
    // Log resend request
    await this.logEvent(payment._id, payment.provider, 'resend.requested', {
      previousReference: payment.providerReference,
    });
    
    // Re-initiate with provider
    const result = await provider.initiate({
      paymentId: payment._id.toString(),
      orderId: payment.orderId,
      country: payment.country,
      currency: payment.currency,
      amountMinor: payment.amountMinor,
      msisdn,
      customer: payment.customer,
      providerReference: payment.providerReference,
    });
    
    if (!result.success) {
      await this.logEvent(payment._id, payment.provider, 'error', {
        error: result.error,
        action: 'resend',
      });
      throw new Error(result.error || 'Failed to resend payment prompt');
    }
    
    // Update last initiated timestamp
    payment.lastInitiatedAt = new Date();
    if (result.providerReference && result.providerReference !== payment.providerReference) {
      payment.providerReference = result.providerReference;
    }
    await payment.save();
    
    return {
      paymentId: payment._id.toString(),
      status: payment.status,
      provider: payment.provider,
      providerReference: payment.providerReference,
      nextAction: provider.getNextAction(result),
    };
  }
  
  /**
   * Process webhook from provider
   */
  async processWebhook(
    providerName: PaymentProvider,
    headers: Record<string, string>,
    rawBody: string | Buffer,
    parsedBody: Record<string, unknown>
  ): Promise<{ success: boolean; paymentId?: string; status?: PaymentStatus }> {
    const provider = getProvider(providerName);
    
    // Verify webhook authenticity
    const verification = provider.verifyWebhook(headers, rawBody);
    if (!verification.isValid) {
      console.error(`[Orchestrator] Webhook verification failed for ${providerName}: ${verification.reason}`);
      throw new Error(`Webhook verification failed: ${verification.reason}`);
    }
    
    // Parse webhook
    const event = provider.parseWebhook(parsedBody);
    if (!event) {
      console.error(`[Orchestrator] Failed to parse webhook for ${providerName}`);
      throw new Error('Failed to parse webhook payload');
    }
    
    // Find payment by provider reference
    const payment = await Payment.findOne({ providerReference: event.providerReference });
    if (!payment) {
      console.warn(`[Orchestrator] No payment found for provider reference: ${event.providerReference}`);
      // Store event for debugging even if payment not found
      return { success: false };
    }
    
    // Log webhook event
    await this.logEvent(payment._id, providerName, 'webhook.received', {
      rawStatus: event.status,
      providerReference: event.providerReference,
      // Sanitize payload to remove any PII
      payloadSummary: {
        status: event.status,
        amount: event.amount,
        currency: event.currency,
        timestamp: event.timestamp,
      },
    });
    
    // Update payment status if valid transition
    const previousStatus = payment.status;
    
    if (isValidTransition(previousStatus, event.status)) {
      payment.status = event.status;
      
      if (event.status === 'FAILED' || event.status === 'EXPIRED') {
        payment.failureReason = event.reason || 'Payment was not completed';
      }
      
      await payment.save();
      
      await this.logEvent(payment._id, providerName, 'status.changed', {
        from: previousStatus,
        to: event.status,
        reason: event.reason,
      });
      
      console.log(`[Orchestrator] Payment ${payment._id} status updated: ${previousStatus} -> ${event.status}`);
    } else {
      console.warn(`[Orchestrator] Invalid status transition for ${payment._id}: ${previousStatus} -> ${event.status}`);
    }
    
    return {
      success: true,
      paymentId: payment._id.toString(),
      status: payment.status,
    };
  }
  
  /**
   * Query payment status from provider (for reconciliation)
   */
  async queryProviderStatus(paymentId: string): Promise<PaymentStatus> {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new Error('Invalid payment ID');
    }
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    if (!payment.providerReference) {
      throw new Error('Payment has no provider reference');
    }
    
    if (isTerminalStatus(payment.status)) {
      return payment.status;
    }
    
    const provider = getProvider(payment.provider);
    const result = await provider.queryStatus(payment.providerReference);
    
    // Log query event
    await this.logEvent(payment._id, payment.provider, 'reconciliation.query', {
      providerReference: payment.providerReference,
      result: {
        status: result.status,
        reason: result.reason,
      },
    });
    
    // Update if status changed
    if (result.status !== payment.status && isValidTransition(payment.status, result.status)) {
      const previousStatus = payment.status;
      payment.status = result.status;
      
      if (result.status === 'FAILED' || result.status === 'EXPIRED') {
        payment.failureReason = result.reason || 'Status updated via reconciliation';
      }
      
      await payment.save();
      
      await this.logEvent(payment._id, payment.provider, 'status.changed', {
        from: previousStatus,
        to: result.status,
        source: 'reconciliation',
      });
    }
    
    return payment.status;
  }
  
  /**
   * Get pending payments for reconciliation
   * Returns payments stuck in PENDING for more than the specified minutes
   */
  async getPendingPaymentsForReconciliation(olderThanMinutes: number = 10): Promise<IPayment[]> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    
    return Payment.find({
      status: 'PENDING',
      updatedAt: { $lt: cutoff },
      providerReference: { $exists: true, $ne: null },
    }).limit(100); // Limit batch size
  }
  
  /**
   * Log payment event
   */
  private async logEvent(
    paymentId: mongoose.Types.ObjectId,
    provider: string,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      await PaymentEvent.create({
        paymentId,
        provider,
        eventType,
        payloadJson: payload,
      });
    } catch (error) {
      console.error('[Orchestrator] Failed to log event:', error);
      // Don't throw - logging should not break the flow
    }
  }
  
  /**
   * Convert internal payment to public representation
   */
  private toPublicPayment(payment: IPayment): PublicPaymentData {
    return {
      paymentId: payment._id.toString(),
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amountMinor,
      currency: payment.currency,
      country: payment.country,
      provider: payment.provider,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      msisdnLast4: payment.msisdnLast4,
      failureReason: payment.failureReason,
      providerReference: payment.providerReference,
    };
  }
}

// Export singleton instance
export const paymentOrchestrator = new PaymentOrchestrator();
