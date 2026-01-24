/**
 * Payments API Service
 * 
 * Client for payment-related API endpoints.
 */

import { getAccessToken } from '../auth/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

// Types
export type PaymentStatus = 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELED';
export type PaymentProvider = 'EMOLA' | 'MULTICAIXA';
export type CountryCode = 'MZ' | 'AO';
export type CurrencyCode = 'MZN' | 'AOA';
export type PaymentMethod = 'MOBILE_MONEY' | 'LOCAL_RAIL';

export interface NextAction {
  type: 'POLL' | 'REDIRECT' | 'DISPLAY_REFERENCE';
  pollIntervalMs?: number;
  maxPollDurationMs?: number;
  redirectUrl?: string;
  reference?: string;
  instructions?: string;
}

export interface InitiatePaymentRequest {
  orderId: string;
  country: CountryCode;
  amount: number; // Minor units (centavos)
  currency: CurrencyCode;
  method: PaymentMethod;
  msisdn?: string;
  customer?: {
    name?: string;
    email?: string;
  };
}

export interface InitiatePaymentResponse {
  paymentId: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerReference?: string;
  nextAction?: NextAction;
}

export interface PaymentDetails {
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

export interface SupportedCountriesResponse {
  countries: CountryCode[];
  currencies: Record<CountryCode, CurrencyCode>;
  providers: Record<CountryCode, PaymentProvider>;
}

/**
 * Make authenticated request
 */
async function authRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Initiate a new payment
 */
export async function initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
  return authRequest('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get payment details
 */
export async function getPayment(paymentId: string): Promise<PaymentDetails> {
  return authRequest(`/api/payments/${paymentId}`);
}

/**
 * Resend payment prompt (for mobile money)
 */
export async function resendPayment(paymentId: string): Promise<InitiatePaymentResponse> {
  return authRequest(`/api/payments/${paymentId}/resend`, {
    method: 'POST',
  });
}

/**
 * Get supported countries
 */
export async function getSupportedCountries(): Promise<SupportedCountriesResponse> {
  return authRequest('/api/payments/countries/supported');
}

/**
 * Check if status is terminal (final)
 */
export function isTerminalStatus(status: PaymentStatus): boolean {
  return ['SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED'].includes(status);
}

/**
 * Format amount for display
 */
export function formatAmount(amountMinor: number, currency: CurrencyCode): string {
  const amount = amountMinor / 100;
  const formatter = new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Country display names
 */
export const COUNTRY_NAMES: Record<CountryCode, string> = {
  'MZ': 'Moçambique',
  'AO': 'Angola',
};

/**
 * Provider display names
 */
export const PROVIDER_NAMES: Record<PaymentProvider, string> = {
  'EMOLA': 'eMola',
  'MULTICAIXA': 'Multicaixa Express',
};

/**
 * Status display text
 */
export const STATUS_TEXT: Record<PaymentStatus, { en: string; pt: string }> = {
  'CREATED': { en: 'Payment initiated', pt: 'Pagamento iniciado' },
  'PENDING': { en: 'Awaiting confirmation', pt: 'Aguardando confirmação' },
  'SUCCESS': { en: 'Payment successful', pt: 'Pagamento bem-sucedido' },
  'FAILED': { en: 'Payment failed', pt: 'Pagamento falhou' },
  'EXPIRED': { en: 'Payment expired', pt: 'Pagamento expirado' },
  'CANCELED': { en: 'Payment canceled', pt: 'Pagamento cancelado' },
};
