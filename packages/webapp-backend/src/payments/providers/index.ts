/**
 * Payment Providers Index
 */

export * from './providerTypes.js';
export { emolaProvider } from './emolaProvider.js';
export { multicaixaProvider } from './multicaixaProvider.js';

import { IPaymentProvider } from './providerTypes.js';
import { emolaProvider } from './emolaProvider.js';
import { multicaixaProvider } from './multicaixaProvider.js';
import { PaymentProvider, CountryCode } from '../models/payment.model.js';

/**
 * Provider registry for looking up providers by name or country
 */
const providerRegistry: Map<PaymentProvider, IPaymentProvider> = new Map([
  ['EMOLA', emolaProvider],
  ['MULTICAIXA', multicaixaProvider],
]);

/**
 * Country to provider mapping
 */
const countryProviders: Map<CountryCode, PaymentProvider> = new Map([
  ['MZ', 'EMOLA'],
  ['AO', 'MULTICAIXA'],
]);

/**
 * Get provider by name
 */
export function getProvider(name: PaymentProvider): IPaymentProvider {
  const provider = providerRegistry.get(name);
  if (!provider) {
    throw new Error(`Unknown payment provider: ${name}`);
  }
  return provider;
}

/**
 * Get default provider for a country
 */
export function getProviderForCountry(country: CountryCode): IPaymentProvider {
  const providerName = countryProviders.get(country);
  if (!providerName) {
    throw new Error(`No payment provider configured for country: ${country}`);
  }
  return getProvider(providerName);
}

/**
 * Get provider name for a country
 */
export function getProviderNameForCountry(country: CountryCode): PaymentProvider {
  const providerName = countryProviders.get(country);
  if (!providerName) {
    throw new Error(`No payment provider configured for country: ${country}`);
  }
  return providerName;
}

/**
 * Check if a country is supported
 */
export function isCountrySupported(country: string): country is CountryCode {
  return country === 'MZ' || country === 'AO';
}

/**
 * Get all supported countries
 */
export function getSupportedCountries(): CountryCode[] {
  return ['MZ', 'AO'];
}

/**
 * Get all registered providers
 */
export function getAllProviders(): IPaymentProvider[] {
  return Array.from(providerRegistry.values());
}
