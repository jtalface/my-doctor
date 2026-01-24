/**
 * Webhook Verification Tests
 * 
 * Tests for webhook signature verification.
 */

import * as crypto from 'crypto';

// Mock webhook verification logic
function verifyWebhookSignature(
  secret: string | undefined,
  signatureHeader: string | undefined,
  body: string,
  isDev: boolean = false
): { isValid: boolean; reason: string } {
  if (!secret) {
    if (!isDev) {
      return { isValid: false, reason: 'Webhook secret not configured' };
    }
    return { isValid: true, reason: 'Verification skipped (development mode)' };
  }
  
  if (!signatureHeader) {
    return { isValid: false, reason: 'No signature header present' };
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
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

describe('Webhook Signature Verification', () => {
  const secret = 'test-webhook-secret-123';
  const body = JSON.stringify({ reference: 'REF123', status: 'SUCCESS' });
  
  it('should verify valid signature', () => {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    const result = verifyWebhookSignature(secret, signature, body);
    
    expect(result.isValid).toBe(true);
    expect(result.reason).toBe('Signature verified');
  });
  
  it('should reject invalid signature', () => {
    const invalidSignature = 'invalid-signature-' + 'a'.repeat(32);
    
    const result = verifyWebhookSignature(secret, invalidSignature, body);
    
    expect(result.isValid).toBe(false);
  });
  
  it('should reject when no signature header present', () => {
    const result = verifyWebhookSignature(secret, undefined, body);
    
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('No signature header present');
  });
  
  it('should reject in production when secret not configured', () => {
    const result = verifyWebhookSignature(undefined, 'some-sig', body, false);
    
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Webhook secret not configured');
  });
  
  it('should skip verification in development when secret not configured', () => {
    const result = verifyWebhookSignature(undefined, undefined, body, true);
    
    expect(result.isValid).toBe(true);
    expect(result.reason).toContain('development');
  });
  
  it('should verify different payloads correctly', () => {
    const body1 = JSON.stringify({ status: 'SUCCESS' });
    const body2 = JSON.stringify({ status: 'FAILED' });
    
    const sig1 = crypto.createHmac('sha256', secret).update(body1).digest('hex');
    const sig2 = crypto.createHmac('sha256', secret).update(body2).digest('hex');
    
    expect(sig1).not.toBe(sig2);
    expect(verifyWebhookSignature(secret, sig1, body1).isValid).toBe(true);
    expect(verifyWebhookSignature(secret, sig2, body2).isValid).toBe(true);
    expect(verifyWebhookSignature(secret, sig1, body2).isValid).toBe(false);
  });
});
