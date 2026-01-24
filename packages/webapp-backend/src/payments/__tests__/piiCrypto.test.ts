/**
 * PII Crypto Tests
 * 
 * Tests for MSISDN encryption and masking.
 */

import * as crypto from 'crypto';

// Test encryption/decryption logic
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Use a fixed test key
const TEST_KEY = crypto.createHash('sha256').update('test-key-for-unit-tests').digest();

function encryptMsisdn(msisdn: string, key: Buffer = TEST_KEY): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(msisdn, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'base64'),
  ]);
  
  return combined.toString('base64');
}

function decryptMsisdn(encryptedData: string, key: Buffer = TEST_KEY): string {
  const combined = Buffer.from(encryptedData, 'base64');
  
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

function extractMsisdnLast4(msisdn: string): string {
  const digitsOnly = msisdn.replace(/\D/g, '');
  if (digitsOnly.length < 4) return digitsOnly;
  return digitsOnly.slice(-4);
}

function maskMsisdn(msisdn: string): string {
  if (!msisdn) return '[no msisdn]';
  const last4 = extractMsisdnLast4(msisdn);
  return `***${last4}`;
}

describe('PII Crypto', () => {
  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt MSISDN correctly', () => {
      const original = '+258841234567';
      const encrypted = encryptMsisdn(original);
      const decrypted = decryptMsisdn(encrypted);
      
      expect(decrypted).toBe(original);
    });
    
    it('should produce different ciphertext for same input (random IV)', () => {
      const msisdn = '+258841234567';
      const encrypted1 = encryptMsisdn(msisdn);
      const encrypted2 = encryptMsisdn(msisdn);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
    
    it('should handle various phone formats', () => {
      const formats = [
        '+258841234567',
        '258841234567',
        '841234567',
        '+244 923 456 789',
        '(244) 923-456-789',
      ];
      
      formats.forEach(format => {
        const encrypted = encryptMsisdn(format);
        const decrypted = decryptMsisdn(encrypted);
        expect(decrypted).toBe(format);
      });
    });
    
    it('should fail to decrypt with wrong key', () => {
      const original = '+258841234567';
      const encrypted = encryptMsisdn(original);
      
      const wrongKey = crypto.createHash('sha256').update('wrong-key').digest();
      
      expect(() => decryptMsisdn(encrypted, wrongKey)).toThrow();
    });
    
    it('should fail to decrypt tampered data', () => {
      const original = '+258841234567';
      const encrypted = encryptMsisdn(original);
      
      // Tamper with the ciphertext
      const buffer = Buffer.from(encrypted, 'base64');
      buffer[buffer.length - 1] ^= 0xff; // Flip bits
      const tampered = buffer.toString('base64');
      
      expect(() => decryptMsisdn(tampered)).toThrow();
    });
  });
  
  describe('Last 4 Extraction', () => {
    it('should extract last 4 digits from full number', () => {
      expect(extractMsisdnLast4('+258841234567')).toBe('4567');
    });
    
    it('should handle numbers with spaces and dashes', () => {
      expect(extractMsisdnLast4('+258 84 123 4567')).toBe('4567');
      expect(extractMsisdnLast4('+258-84-123-4567')).toBe('4567');
    });
    
    it('should handle numbers with parentheses', () => {
      expect(extractMsisdnLast4('(258) 84 123 4567')).toBe('4567');
    });
    
    it('should return all digits if less than 4', () => {
      expect(extractMsisdnLast4('123')).toBe('123');
      expect(extractMsisdnLast4('12')).toBe('12');
    });
    
    it('should return empty string for empty input', () => {
      expect(extractMsisdnLast4('')).toBe('');
    });
  });
  
  describe('Masking', () => {
    it('should mask MSISDN correctly', () => {
      expect(maskMsisdn('+258841234567')).toBe('***4567');
    });
    
    it('should handle empty/null input', () => {
      expect(maskMsisdn('')).toBe('[no msisdn]');
    });
  });
});
