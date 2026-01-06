/**
 * Mozambique Country Information
 */

import type { CountryInfo, Province } from '../types.js';

export const MOZ_INFO: CountryInfo = {
  code: 'MOZ',
  name: 'Mozambique',
  localName: 'Moçambique',
  languages: [
    {
      code: 'pt',
      name: 'Portuguese',
      localName: 'Português',
      isOfficial: true,
    },
    {
      code: 'sw',
      name: 'Swahili',
      localName: 'Kiswahili',
      isOfficial: false,
    },
    {
      code: 'mgh',
      name: 'Makhuwa',
      localName: 'Emakhuwa',
      isOfficial: false,
    },
    {
      code: 'seh',
      name: 'Sena',
      localName: 'Cisena',
      isOfficial: false,
    },
    {
      code: 'ts',
      name: 'Tsonga',
      localName: 'Xitsonga',
      isOfficial: false,
    },
  ],
  defaultLanguage: 'pt',
  currency: 'Metical',
  currencyCode: 'MZN',
  timezone: 'Africa/Maputo',
  callingCode: '+258',
  capital: 'Maputo',
  region: 'Southern Africa',
};

export const MOZ_PROVINCES: Province[] = [
  // Northern Region
  { code: 'CD', name: 'Cabo Delgado', capital: 'Pemba', region: 'north' },
  { code: 'NI', name: 'Niassa', capital: 'Lichinga', region: 'north' },
  { code: 'NA', name: 'Nampula', capital: 'Nampula', region: 'north' },
  
  // Central Region
  { code: 'ZA', name: 'Zambézia', capital: 'Quelimane', region: 'central' },
  { code: 'TE', name: 'Tete', capital: 'Tete', region: 'central' },
  { code: 'MA', name: 'Manica', capital: 'Chimoio', region: 'central' },
  { code: 'SO', name: 'Sofala', capital: 'Beira', region: 'central' },
  
  // Southern Region
  { code: 'IN', name: 'Inhambane', capital: 'Inhambane', region: 'south' },
  { code: 'GA', name: 'Gaza', capital: 'Xai-Xai', region: 'south' },
  { code: 'MP', name: 'Maputo Província', capital: 'Matola', region: 'south' },
  { code: 'MC', name: 'Maputo Cidade', capital: 'Maputo', region: 'south' },
];

