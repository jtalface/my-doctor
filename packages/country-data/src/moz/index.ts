/**
 * Mozambique (MOZ) Country Data
 * 
 * All country-specific data for Mozambique including:
 * - Country information
 * - Provinces and administrative divisions
 * - Ethnic groups
 * - Medical protocols and vaccination schedules
 */

import type { CountryData } from '../types.js';
import { MOZ_INFO, MOZ_PROVINCES } from './info.js';
import { MOZ_ETHNIC_GROUPS } from './ethnic-groups.js';
import { MOZ_VACCINATION_SCHEMA } from './medical/vaccinations.js';
import { MOZ_MEDICAL_PROTOCOLS } from './medical/protocols.js';

// Re-export all individual modules
export * from './info.js';
export * from './ethnic-groups.js';
export * from './medical/index.js';

/**
 * Complete Mozambique country data bundle
 */
export const MOZ_COUNTRY_DATA: CountryData = {
  info: MOZ_INFO,
  ethnicGroups: MOZ_ETHNIC_GROUPS,
  provinces: MOZ_PROVINCES,
  vaccinationSchema: MOZ_VACCINATION_SCHEMA,
  medicalProtocols: MOZ_MEDICAL_PROTOCOLS,
};

