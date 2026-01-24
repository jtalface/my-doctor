/**
 * Status Transitions Tests
 * 
 * Tests for payment status transition rules.
 */

type PaymentStatus = 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELED';

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  'CREATED': ['PENDING', 'FAILED', 'CANCELED'],
  'PENDING': ['SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED'],
  'SUCCESS': [],
  'FAILED': [],
  'EXPIRED': [],
  'CANCELED': [],
};

const TERMINAL_STATUSES: PaymentStatus[] = ['SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED'];

function isTerminalStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

function isValidTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

describe('Payment Status Transitions', () => {
  describe('Terminal Status Detection', () => {
    it('should identify SUCCESS as terminal', () => {
      expect(isTerminalStatus('SUCCESS')).toBe(true);
    });
    
    it('should identify FAILED as terminal', () => {
      expect(isTerminalStatus('FAILED')).toBe(true);
    });
    
    it('should identify EXPIRED as terminal', () => {
      expect(isTerminalStatus('EXPIRED')).toBe(true);
    });
    
    it('should identify CANCELED as terminal', () => {
      expect(isTerminalStatus('CANCELED')).toBe(true);
    });
    
    it('should NOT identify CREATED as terminal', () => {
      expect(isTerminalStatus('CREATED')).toBe(false);
    });
    
    it('should NOT identify PENDING as terminal', () => {
      expect(isTerminalStatus('PENDING')).toBe(false);
    });
  });
  
  describe('Valid Transitions', () => {
    it('should allow CREATED -> PENDING', () => {
      expect(isValidTransition('CREATED', 'PENDING')).toBe(true);
    });
    
    it('should allow CREATED -> FAILED', () => {
      expect(isValidTransition('CREATED', 'FAILED')).toBe(true);
    });
    
    it('should allow PENDING -> SUCCESS', () => {
      expect(isValidTransition('PENDING', 'SUCCESS')).toBe(true);
    });
    
    it('should allow PENDING -> FAILED', () => {
      expect(isValidTransition('PENDING', 'FAILED')).toBe(true);
    });
    
    it('should allow PENDING -> EXPIRED', () => {
      expect(isValidTransition('PENDING', 'EXPIRED')).toBe(true);
    });
    
    it('should allow same status (no-op)', () => {
      expect(isValidTransition('PENDING', 'PENDING')).toBe(true);
      expect(isValidTransition('SUCCESS', 'SUCCESS')).toBe(true);
    });
  });
  
  describe('Invalid Transitions', () => {
    it('should NOT allow SUCCESS -> PENDING (terminal)', () => {
      expect(isValidTransition('SUCCESS', 'PENDING')).toBe(false);
    });
    
    it('should NOT allow SUCCESS -> FAILED (terminal)', () => {
      expect(isValidTransition('SUCCESS', 'FAILED')).toBe(false);
    });
    
    it('should NOT allow FAILED -> SUCCESS (terminal)', () => {
      expect(isValidTransition('FAILED', 'SUCCESS')).toBe(false);
    });
    
    it('should NOT allow EXPIRED -> PENDING (terminal)', () => {
      expect(isValidTransition('EXPIRED', 'PENDING')).toBe(false);
    });
    
    it('should NOT allow PENDING -> CREATED (backwards)', () => {
      expect(isValidTransition('PENDING', 'CREATED')).toBe(false);
    });
    
    it('should NOT allow CREATED -> SUCCESS (skip PENDING)', () => {
      expect(isValidTransition('CREATED', 'SUCCESS')).toBe(false);
    });
  });
  
  describe('Terminal Status Cannot Transition', () => {
    const terminalStatuses: PaymentStatus[] = ['SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED'];
    const allStatuses: PaymentStatus[] = ['CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED'];
    
    terminalStatuses.forEach(terminal => {
      allStatuses.filter(s => s !== terminal).forEach(other => {
        it(`should NOT allow ${terminal} -> ${other}`, () => {
          expect(isValidTransition(terminal, other)).toBe(false);
        });
      });
    });
  });
});
