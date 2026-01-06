/**
 * Mozambique Ethnic Groups
 * 
 * Major ethnic groups in Mozambique with relevant demographic and medical information.
 * Data based on census and ethnographic studies.
 */

import type { EthnicGroup } from '../types.js';

export const MOZ_ETHNIC_GROUPS: EthnicGroup[] = [
  {
    umbrella_group: "Tsonga",
    language_family: "Bantu",
    primary_language: "Xitsonga",
    subgroups: [
      {
        name: "Changana",
        alternate_names: ["Shangaan"],
        language: "Xitsonga (Changana dialect)",
        regions: ["Gaza", "Southern Mozambique"]
      },
      {
        name: "Ronga",
        alternate_names: [],
        language: "Xitsonga (Ronga dialect)",
        regions: ["Maputo City", "Maputo"]
      },
      {
        name: "Tswa",
        alternate_names: [],
        language: "Xitsonga (Tswa dialect)",
        regions: ["Southern Mozambique"]
      }
    ],
    description: "The Tsonga are a major ethnic group in southern Mozambique, comprising subgroups including Changana, Ronga, and Tswa. They share cultural and linguistic ties with Tsonga communities in South Africa and have a rich tradition of music, dance, and oral literature.",
    medicalNotes: "Strong traditional medicine practices with herbalists (nyanga). High migration to South Africa for work may affect continuity of healthcare. Consider traditional healing beliefs when discussing treatment plans. Some communities practice traditional scarification."
  },
  {
    umbrella_group: "Tonga",
    language_family: "Bantu",
    primary_language: "Xitonga",
    subgroups: [
      {
        name: "Bitonga",
        alternate_names: ["Tonga"],
        language: "Xitonga",
        regions: ["Inhambane"]
      }
    ],
    description: "The Tonga (Bitonga) are a coastal ethnic group primarily located in Inhambane province. They are traditionally fishermen and farmers, known for their distinctive cultural practices and close relationship with the sea.",
    medicalNotes: "Fishing communities may have specific occupational health concerns including skin conditions from sun exposure and injuries. Coastal diet rich in seafood. Traditional water-based remedies common. Consider access to healthcare in remote coastal areas."
  },
  {
    umbrella_group: "Sena",
    language_family: "Bantu",
    primary_language: "Chisena",
    subgroups: [],
    regions: ["Tete", "Sofala", "Zambezia"],
    description: "The Sena people are concentrated along the Zambezi River valley and the central coastal region. They have a long history as farmers and traders, with cultural practices influenced by their riverine environment.",
    medicalNotes: "River communities have higher exposure to waterborne diseases including cholera and schistosomiasis. Malaria endemic in the region. Flooding events may displace communities and affect healthcare access. Traditional birth attendants still common in rural areas."
  },
  {
    umbrella_group: "Nyungwe",
    language_family: "Bantu",
    primary_language: "Chinyungwe",
    subgroups: [],
    regions: ["Tete"],
    description: "The Nyungwe are found primarily in Tete province, particularly along the Zambezi River. They share cultural elements with both Mozambican and Malawian communities due to their border location.",
    medicalNotes: "Cross-border movement with Malawi and Zimbabwe common - consider regional disease patterns and vaccination histories. Mining activities in the region may present occupational health risks. Hot climate requires attention to heat-related illnesses."
  },
  {
    umbrella_group: "Makua",
    language_family: "Bantu",
    primary_language: "Emakua",
    subgroups: ["Lomwe", "Makua-Metto"],
    regions: ["Nampula", "Cabo Delgado", "Niassa"],
    description: "The Makua are the largest ethnic group in Mozambique, predominantly in the northern provinces. They are traditionally a matrilineal society with women playing important roles in family structure and inheritance. The Lomwe are a closely related subgroup.",
    medicalNotes: "Traditional healing practices include extensive use of medicinal plants. Matrilineal family structure means maternal relatives often involved in healthcare decisions. Traditional initiation ceremonies still practiced - be aware of associated health implications. Some communities have lower vaccination coverage in remote areas."
  },
  {
    umbrella_group: "Yao",
    language_family: "Bantu",
    primary_language: "Chiyao",
    subgroups: [],
    regions: ["Niassa", "Cabo Delgado"],
    description: "The Yao are a predominantly Muslim community with strong historical ties to Tanzania and Malawi. They were historically known as traders and were among the first groups in the region to adopt Islam.",
    medicalNotes: "Islamic dietary laws (halal) may affect medication compliance - check for gelatin or alcohol-based medicines. Male circumcision is universally practiced (protective factor for HIV/STIs). Ramadan fasting may affect medication schedules and chronic disease management. Traditional Islamic medicine practices may be used alongside conventional treatment."
  },
  {
    umbrella_group: "Makonde",
    language_family: "Bantu",
    primary_language: "Chimakonde",
    subgroups: [],
    regions: ["Cabo Delgado"],
    description: "The Makonde are renowned for their woodcarving traditions and were historically resistant to colonial rule. They inhabit the Mueda plateau and coastal areas of Cabo Delgado province, with cultural ties to Makonde communities in Tanzania.",
    medicalNotes: "Traditional scarification and body modification practices may still occur in some communities - screen for related infections. Conflict-affected region may have disrupted healthcare services and increased trauma cases. Traditional healing practices are strong. Some remote plateau communities have limited healthcare access."
  },
  {
    umbrella_group: "Ndau",
    language_family: "Bantu",
    primary_language: "Chindau",
    subgroups: [],
    regions: ["Sofala", "Manica"],
    description: "The Ndau are a subgroup of the broader Shona people, dominant in central Mozambique. They have distinct cultural practices including traditional spirit possession ceremonies and are known for their musical traditions.",
    medicalNotes: "Traditional healing and spirit possession beliefs (especially related to ancestors) may strongly influence healthcare-seeking behavior. Herbalists and spirit mediums consulted for illness. Mental health symptoms may be attributed to spiritual causes. Cross-border connections with Zimbabwe affect healthcare patterns."
  },
  {
    umbrella_group: "Shona",
    language_family: "Bantu",
    primary_language: "Chishona",
    subgroups: ["Manyika", "Korekore"],
    regions: ["Manica"],
    description: "The Shona in Mozambique are related to the larger Shona population in Zimbabwe. Subgroups include the Manyika and Korekore. They have a rich cultural heritage including stone architecture traditions and complex spiritual beliefs.",
    medicalNotes: "Cross-border movement with Zimbabwe is common - verify vaccination status and consider health records from neighboring country. Traditional medicine practices similar to Ndau. Ancestor veneration important in understanding illness. Mining areas may present occupational health concerns."
  },
  {
    umbrella_group: "Chuabo",
    language_family: "Bantu",
    primary_language: "Chichuabo",
    subgroups: [],
    regions: ["Zambezia"],
    description: "The Chuabo people are concentrated around Quelimane and the lower Zambezi delta region of Zambezia province. They are traditionally farmers and fishermen adapted to the delta environment.",
    medicalNotes: "Delta and coastal communities - consider diseases associated with fishing communities and wetland environments including schistosomiasis and malaria. Seasonal flooding affects healthcare access. Traditional birth practices common. Coconut-based diet and traditional fishing lifestyle."
  },
  {
    umbrella_group: "Chopi",
    language_family: "Bantu",
    primary_language: "Chichopi",
    subgroups: [],
    regions: ["Inhambane"],
    description: "The Chopi are famous for their unique timbila (xylophone) orchestras, recognized by UNESCO as Intangible Cultural Heritage. They inhabit coastal areas of Inhambane province and have distinct musical and cultural traditions.",
    medicalNotes: "Coastal fishing communities with associated occupational health concerns. Strong cultural identity may influence healthcare preferences. Traditional ceremonies and music have therapeutic cultural significance. Consider integration of cultural practices in mental health approaches."
  },
  {
    umbrella_group: "Outro",
    language_family: "Various",
    primary_language: "Portuguese",
    subgroups: [],
    regions: [],
    description: "Includes individuals who do not identify with the major ethnic groups listed, including mixed heritage (Mestiço), immigrants from other African countries (Zimbabwe, Malawi, DRC, South Africa), and communities of Indian, Chinese, Portuguese, or other descent.",
    medicalNotes: "May have diverse cultural backgrounds affecting healthcare preferences. Immigrants may have different vaccination histories - verify immunization status. Consider dietary restrictions based on religious or cultural background. Portuguese is commonly the primary language for urban mixed communities. Genetic predispositions may vary based on ancestry."
  }
];

/**
 * Get ethnic group by umbrella group name
 */
export function getEthnicGroup(name: string): EthnicGroup | undefined {
  return MOZ_ETHNIC_GROUPS.find(group => 
    group.umbrella_group.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get ethnic groups by region/province
 */
export function getEthnicGroupsByRegion(region: string): EthnicGroup[] {
  return MOZ_ETHNIC_GROUPS.filter(group => {
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

/**
 * Get all ethnic group options for forms (value and label)
 */
export function getEthnicGroupOptions(): Array<{ value: string; label: string }> {
  return MOZ_ETHNIC_GROUPS.map(group => {
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
 * Get all subgroups flattened into a list
 */
export function getAllSubgroups(): Array<{ name: string; umbrellaGroup: string; regions: string[] }> {
  const result: Array<{ name: string; umbrellaGroup: string; regions: string[] }> = [];
  
  for (const group of MOZ_ETHNIC_GROUPS) {
    if (Array.isArray(group.subgroups)) {
      for (const subgroup of group.subgroups) {
        if (typeof subgroup === 'object' && 'name' in subgroup) {
          result.push({
            name: subgroup.name,
            umbrellaGroup: group.umbrella_group,
            regions: subgroup.regions,
          });
        } else if (typeof subgroup === 'string') {
          result.push({
            name: subgroup,
            umbrellaGroup: group.umbrella_group,
            regions: group.regions || [],
          });
        }
      }
    }
  }
  
  return result;
}
