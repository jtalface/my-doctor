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
 * // Get ethnic group options for a form (country-specific)
 * const options = getEthnicGroupOptions('MOZ');
 * ```
 */

// Export types
export * from './types.js';

// Export Mozambique data
export * from './moz/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY DATA REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

import type { CountryCode, CountryData, EthnicGroup } from './types.js';
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

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY-AWARE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get ethnic group options for forms by country
 * 
 * @param countryCode - The country code (e.g., 'MOZ')
 * @returns Array of { value, label } for use in select dropdowns
 * 
 * @example
 * ```typescript
 * const options = getEthnicGroupOptions('MOZ');
 * // [{ value: 'tsonga', label: 'Tsonga (Changana, Ronga, Tswa)' }, ...]
 * ```
 */
export function getEthnicGroupOptions(countryCode: CountryCode = 'MOZ'): Array<{ value: string; label: string }> {
  const countryData = COUNTRY_DATA_REGISTRY[countryCode];
  if (!countryData?.ethnicGroups) {
    return [];
  }

  return countryData.ethnicGroups.map((group: EthnicGroup) => {
    let label = group.umbrella_group;
    
    if (group.subgroups && group.subgroups.length > 0) {
      const subgroupNames = group.subgroups.map(sg => 
        typeof sg === 'string' ? sg : sg.name
      );
      label = `${group.umbrella_group} (${subgroupNames.join(', ')})`;
    }
    
    return {
      value: group.umbrella_group.toLowerCase(),
      label,
    };
  });
}

/**
 * Get ethnic group by name for a specific country
 * 
 * @param countryCode - The country code (e.g., 'MOZ')
 * @param groupName - The ethnic group umbrella name
 * @returns The ethnic group data or undefined
 */
export function getEthnicGroup(countryCode: CountryCode, groupName: string): EthnicGroup | undefined {
  const countryData = COUNTRY_DATA_REGISTRY[countryCode];
  if (!countryData?.ethnicGroups) {
    return undefined;
  }

  return countryData.ethnicGroups.find((group: EthnicGroup) => 
    group.umbrella_group.toLowerCase() === groupName.toLowerCase()
  );
}

/**
 * Get ethnic groups by region for a specific country
 * 
 * @param countryCode - The country code (e.g., 'MOZ')
 * @param region - The region/province name
 * @returns Array of ethnic groups in that region
 */
export function getEthnicGroupsByRegion(countryCode: CountryCode, region: string): EthnicGroup[] {
  const countryData = COUNTRY_DATA_REGISTRY[countryCode];
  if (!countryData?.ethnicGroups) {
    return [];
  }

  return countryData.ethnicGroups.filter((group: EthnicGroup) => {
    // Check top-level regions
    if (group.regions?.some(r => r.toLowerCase().includes(region.toLowerCase()))) {
      return true;
    }
    // Check subgroup regions if subgroups are detailed objects
    if (Array.isArray(group.subgroups) && group.subgroups.length > 0) {
      const firstSubgroup = group.subgroups[0];
      if (typeof firstSubgroup === 'object' && 'regions' in firstSubgroup) {
        return (group.subgroups as Array<{ regions: string[] }>).some(sg =>
          sg.regions.some(r => r.toLowerCase().includes(region.toLowerCase()))
        );
      }
    }
    return false;
  });
}

