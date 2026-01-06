/**
 * @mydoctor/country-data
 * 
 * Country-specific data for the MyDoctor platform.
 * 
 * Includes:
 * - Country information (languages, currency, timezone, etc.)
 * - Administrative divisions (provinces, districts)
 * - Ethnic groups with demographic and medical relevance
 * - Medical protocols (national guidelines)
 * - Vaccination schedules
 * 
 * @example
 * ```typescript
 * import { MOZ_COUNTRY_DATA, getEthnicGroupOptions } from '@mydoctor/country-data';
 * 
 * // Get all Mozambique data
 * console.log(MOZ_COUNTRY_DATA.info.name); // "Mozambique"
 * 
 * // Get ethnic group options for a form
 * const options = getEthnicGroupOptions();
 * ```
 */

// Export types
export * from './types.js';

// Export Mozambique data
export * from './moz/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY DATA REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

import type { CountryCode, CountryData } from './types.js';
import { MOZ_COUNTRY_DATA } from './moz/index.js';

/**
 * Registry of all available country data
 */
export const COUNTRY_DATA_REGISTRY: Record<CountryCode, CountryData> = {
  MOZ: MOZ_COUNTRY_DATA,
};

/**
 * Get country data by country code
 */
export function getCountryData(code: CountryCode): CountryData {
  return COUNTRY_DATA_REGISTRY[code];
}

/**
 * Get list of supported country codes
 */
export function getSupportedCountries(): CountryCode[] {
  return Object.keys(COUNTRY_DATA_REGISTRY) as CountryCode[];
}

/**
 * Check if a country is supported
 */
export function isCountrySupported(code: string): code is CountryCode {
  return code in COUNTRY_DATA_REGISTRY;
}

