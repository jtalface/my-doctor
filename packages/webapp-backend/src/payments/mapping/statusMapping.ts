/**
 * Payment Status Mapping and Transition Rules
 * 
 * Defines valid status transitions and helper functions for status management.
 */

import { PaymentStatus } from '../models/payment.model.js';

/**
 * Valid status transitions
 * Key: current status, Value: allowed next statuses
 */
const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  'CREATED': ['PENDING', 'FAILED', 'CANCELED'],
  'PENDING': ['SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED'],
  'SUCCESS': [], // Terminal state - no transitions allowed
  'FAILED': [], // Terminal state - no transitions allowed
  'EXPIRED': [], // Terminal state - no transitions allowed
  'CANCELED': [], // Terminal state - no transitions allowed
};

/**
 * Terminal statuses that cannot transition to any other status
 */
export const TERMINAL_STATUSES: PaymentStatus[] = ['SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED'];

/**
 * Check if a status is terminal (final)
 */
export function isTerminalStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  // Same status is always "valid" (no-op)
  if (from === to) return true;
  
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get allowed next statuses for a given status
 */
export function getAllowedTransitions(status: PaymentStatus): PaymentStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}

/**
 * Validate status transition and throw if invalid
 */
export function validateTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
}

/**
 * Map of status to user-friendly display text
 */
export const STATUS_DISPLAY_TEXT: Record<PaymentStatus, { en: string; pt: string }> = {
  'CREATED': {
    en: 'Payment initiated',
    pt: 'Pagamento iniciado',
  },
  'PENDING': {
    en: 'Awaiting confirmation',
    pt: 'Aguardando confirmação',
  },
  'SUCCESS': {
    en: 'Payment successful',
    pt: 'Pagamento bem-sucedido',
  },
  'FAILED': {
    en: 'Payment failed',
    pt: 'Pagamento falhou',
  },
  'EXPIRED': {
    en: 'Payment expired',
    pt: 'Pagamento expirado',
  },
  'CANCELED': {
    en: 'Payment canceled',
    pt: 'Pagamento cancelado',
  },
};
