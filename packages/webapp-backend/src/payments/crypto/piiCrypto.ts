/**
 * PII Crypto Module
 * 
 * Handles encryption/decryption of sensitive PII data (phone numbers).
 * Uses AES-256-GCM for authenticated encryption.
 * 
 * SECURITY NOTES:
 * - Never log raw phone numbers
 * - Store only encrypted msisdn + last4 for display
 * - Use environment variable PII_ENCRYPTION_KEY (32 bytes, base64 encoded)
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment
 * Key must be 32 bytes (256 bits), base64 encoded
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.PII_ENCRYPTION_KEY;
  
  if (!keyBase64) {
    // In development, use a deterministic key (NOT FOR PRODUCTION)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[PII Crypto] WARNING: Using development encryption key. Set PII_ENCRYPTION_KEY in production!');
      return crypto.createHash('sha256').update('dev-pii-key-not-for-production').digest();
    }
    throw new Error('PII_ENCRYPTION_KEY environment variable is required in production');
  }
  
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('PII_ENCRYPTION_KEY must be exactly 32 bytes (256 bits) when base64 decoded');
  }
  
  return key;
}

/**
 * Encrypt a phone number (MSISDN)
 * Returns base64 encoded string: iv + authTag + ciphertext
 */
export function encryptMsisdn(msisdn: string): string {
  if (!msisdn) {
    throw new Error('MSISDN cannot be empty');
  }
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(msisdn, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Combine: iv (12 bytes) + authTag (16 bytes) + ciphertext
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'base64'),
  ]);
  
  return combined.toString('base64');
}

/**
 * Decrypt an encrypted MSISDN
 * Input is base64 encoded string: iv + authTag + ciphertext
 */
export function decryptMsisdn(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }
  
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');
  
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted data: too short');
  }
  
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

/**
 * Extract last 4 digits from MSISDN for safe display
 * Strips any non-digit characters first
 */
export function extractMsisdnLast4(msisdn: string): string {
  if (!msisdn) {
    return '';
  }
  
  // Remove all non-digit characters
  const digitsOnly = msisdn.replace(/\D/g, '');
  
  if (digitsOnly.length < 4) {
    return digitsOnly; // Return what we have if less than 4 digits
  }
  
  return digitsOnly.slice(-4);
}

/**
 * Mask MSISDN for logging (shows only last 4 digits)
 * Example: +258841234567 -> ***4567
 */
export function maskMsisdn(msisdn: string): string {
  if (!msisdn) {
    return '[no msisdn]';
  }
  
  const last4 = extractMsisdnLast4(msisdn);
  return `***${last4}`;
}

/**
 * Encrypt MSISDN and return both encrypted value and last4 for storage
 */
export function prepareMsisdnForStorage(msisdn: string): { encrypted: string; last4: string } {
  return {
    encrypted: encryptMsisdn(msisdn),
    last4: extractMsisdnLast4(msisdn),
  };
}
