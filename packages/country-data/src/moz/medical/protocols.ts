/**
 * Mozambique Medical Protocols
 * 
 * Country-specific medical protocols and guidelines from the
 * Ministry of Health (MISAU - Ministério da Saúde).
 */

import type { MedicalProtocol } from '../../types.js';

export const MOZ_MEDICAL_PROTOCOLS: MedicalProtocol[] = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // MALARIA PROTOCOLS
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: 'malaria-treatment',
    name: 'Malaria Treatment Protocol',
    localName: 'Protocolo de Tratamento da Malária',
    category: 'infectious-disease',
    description: 'Standard treatment guidelines for uncomplicated and severe malaria in Mozambique',
    source: 'MISAU - Programa Nacional de Controlo da Malária',
    lastUpdated: '2024-01-01',
    applicableAgeGroups: ['newborn', 'infant', 'toddler', 'preschool', 'child', 'adolescent', 'adult', 'elderly'],
    content: `
# Tratamento da Malária em Moçambique

## Malária Não Complicada
- **Primeira linha**: Arteméter-Lumefantrina (AL) por 3 dias
  - Peso 5-14kg: 1 comprimido 2x/dia
  - Peso 15-24kg: 2 comprimidos 2x/dia
  - Peso 25-34kg: 3 comprimidos 2x/dia
  - Peso >35kg: 4 comprimidos 2x/dia

## Malária em Grávidas
- **1º Trimestre**: Quinino 10mg/kg 3x/dia por 7 dias
- **2º e 3º Trimestre**: Arteméter-Lumefantrina

## Malária Grave
- Transferir imediatamente para unidade sanitária com capacidade
- Artesunato IV/IM como primeira escolha
- Dose: 2.4mg/kg às 0, 12, 24 horas, depois 1x/dia

## Prevenção
- Redes mosquiteiras tratadas com inseticida (REMTI)
- Pulverização intradomiciliária (PIDOM)
- IPTp para grávidas (Sulfadoxina-Pirimetamina)
    `,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // HIV/AIDS PROTOCOLS
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: 'hiv-tarv',
    name: 'HIV/AIDS Treatment Protocol',
    localName: 'Protocolo de Tratamento Anti-Retroviral (TARV)',
    category: 'infectious-disease',
    description: 'Antiretroviral treatment guidelines following WHO recommendations',
    source: 'MISAU - Programa Nacional de ITS/HIV/SIDA',
    lastUpdated: '2024-01-01',
    applicableAgeGroups: ['infant', 'toddler', 'preschool', 'child', 'adolescent', 'adult', 'elderly'],
    content: `
# Tratamento Anti-Retroviral (TARV)

## Início do TARV
- Todas as pessoas vivendo com HIV devem iniciar TARV independentemente do CD4
- Priorizar grávidas, crianças <5 anos, TB activa, CD4 <350

## Regime de Primeira Linha - Adultos
- **Preferencial**: TDF + 3TC + DTG
- **Alternativo**: TDF + 3TC + EFV

## Regime de Primeira Linha - Crianças
- **<4 semanas**: AZT + 3TC + NVP
- **4 semanas - 3 anos**: ABC + 3TC + LPV/r
- **3-10 anos**: ABC + 3TC + DTG (ou EFV)
- **>10 anos**: TDF + 3TC + DTG

## Prevenção da Transmissão Vertical (PTV)
- Todas as grávidas HIV+ devem iniciar TARV
- Profilaxia para o recém-nascido: NVP por 6 semanas
    `,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TUBERCULOSIS PROTOCOLS
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: 'tb-treatment',
    name: 'Tuberculosis Treatment Protocol',
    localName: 'Protocolo de Tratamento da Tuberculose',
    category: 'infectious-disease',
    description: 'TB diagnosis and treatment guidelines',
    source: 'MISAU - Programa Nacional de Controlo da Tuberculose',
    lastUpdated: '2024-01-01',
    applicableAgeGroups: ['infant', 'toddler', 'preschool', 'child', 'adolescent', 'adult', 'elderly'],
    content: `
# Tratamento da Tuberculose

## Diagnóstico
- GeneXpert MTB/RIF como teste inicial
- Baciloscopia quando GeneXpert não disponível
- Raio-X do tórax como auxiliar

## Tratamento - Casos Novos
**Fase Intensiva (2 meses)**:
- RHZE (Rifampicina, Isoniazida, Pirazinamida, Etambutol)

**Fase de Manutenção (4 meses)**:
- RH (Rifampicina, Isoniazida)

## TB Resistente
- Encaminhar para centro de referência
- Regime individualizado baseado em teste de sensibilidade

## Coinfecção TB/HIV
- Iniciar tratamento de TB imediatamente
- Iniciar TARV nas primeiras 2-8 semanas após início do tratamento de TB
    `,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // MATERNAL HEALTH
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: 'prenatal-care',
    name: 'Prenatal Care Protocol',
    localName: 'Protocolo de Cuidados Pré-Natais',
    category: 'prenatal',
    description: 'Antenatal care guidelines for pregnant women',
    source: 'MISAU - Programa de Saúde Materna',
    lastUpdated: '2024-01-01',
    applicableAgeGroups: ['adolescent', 'adult'],
    content: `
# Cuidados Pré-Natais

## Consultas Recomendadas
- Mínimo de 4 consultas (OMS recomenda 8)
- 1ª consulta: até 12 semanas
- 2ª consulta: 20-26 semanas
- 3ª consulta: 30-34 semanas
- 4ª consulta: 36-40 semanas

## Exames de Rotina
- Hemoglobina (rastreio de anemia)
- Teste de HIV (com aconselhamento)
- Teste de Sífilis (RPR)
- Grupo sanguíneo e Rh
- Urina (proteínas, glicose)

## Suplementação
- Ácido Fólico: 400mcg/dia
- Sulfato Ferroso: 60mg/dia
- IPTp (Sulfadoxina-Pirimetamina): a partir das 13 semanas, em cada consulta

## Vacinas
- Vacina contra o Tétano (VAT): mínimo 2 doses
    `,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHILD HEALTH
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: 'imci',
    name: 'Integrated Management of Childhood Illness',
    localName: 'AIDI - Atenção Integrada às Doenças da Infância',
    category: 'pediatric',
    description: 'WHO/UNICEF strategy for managing common childhood illnesses',
    source: 'MISAU - Programa de Saúde da Criança',
    lastUpdated: '2024-01-01',
    applicableAgeGroups: ['newborn', 'infant', 'toddler', 'preschool'],
    content: `
# AIDI - Atenção Integrada às Doenças da Infância

## Sinais de Perigo (Referência Urgente)
- Não consegue beber ou mamar
- Vomita tudo
- Convulsões
- Letárgica ou inconsciente
- Tiragem subcostal grave

## Avaliação da Criança Doente
1. Verificar sinais de perigo
2. Avaliar tosse ou dificuldade respiratória
3. Avaliar diarreia
4. Avaliar febre
5. Verificar desnutrição e anemia
6. Verificar vacinação

## Classificação e Tratamento
- **Pneumonia**: Amoxicilina por 5 dias
- **Diarreia**: SRO + Zinco por 10-14 dias
- **Malária**: Teste rápido + AL se positivo
- **Desnutrição aguda**: ATPU (PlumpyNut) se grave
    `,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // NUTRITION
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: 'nutrition-screening',
    name: 'Nutrition Screening Protocol',
    localName: 'Protocolo de Rastreio Nutricional',
    category: 'nutrition',
    description: 'Guidelines for nutrition assessment and management of malnutrition',
    source: 'MISAU - Programa de Reabilitação Nutricional',
    lastUpdated: '2024-01-01',
    applicableAgeGroups: ['newborn', 'infant', 'toddler', 'preschool', 'child'],
    content: `
# Rastreio e Tratamento Nutricional

## Indicadores
- **Peso/Idade**: Detecta baixo peso
- **Peso/Altura**: Detecta desnutrição aguda
- **Altura/Idade**: Detecta desnutrição crónica
- **MUAC** (Perímetro braquial): Rastreio rápido em crianças 6-59 meses

## Classificação (MUAC)
- **Verde** (≥125mm): Normal
- **Amarelo** (115-124mm): Desnutrição Aguda Moderada (DAM)
- **Vermelho** (<115mm): Desnutrição Aguda Grave (DAG)

## Tratamento
**DAM (Desnutrição Aguda Moderada)**:
- CSB++ (farinha fortificada)
- Acompanhamento quinzenal

**DAG (Desnutrição Aguda Grave) sem complicações**:
- ATPU (PlumpyNut): 200kcal/kg/dia
- Amoxicilina por 7 dias
- Suplementação de vitaminas

**DAG com complicações**:
- Internamento hospitalar
- F75 na fase de estabilização
- F100 na fase de reabilitação
    `,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHOLERA
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: 'cholera-treatment',
    name: 'Cholera Treatment Protocol',
    localName: 'Protocolo de Tratamento da Cólera',
    category: 'infectious-disease',
    description: 'Emergency guidelines for cholera outbreaks',
    source: 'MISAU - Programa de Doenças Diarreicas',
    lastUpdated: '2024-01-01',
    applicableAgeGroups: ['infant', 'toddler', 'preschool', 'child', 'adolescent', 'adult', 'elderly'],
    content: `
# Tratamento da Cólera

## Avaliação da Desidratação
- **Sem desidratação**: Plano A - SRO em casa
- **Desidratação moderada**: Plano B - SRO na unidade sanitária
- **Desidratação grave**: Plano C - Rehidratação IV

## Plano C (Desidratação Grave)
**Lactato de Ringer IV**:
- 30ml/kg em 30 min, depois 70ml/kg em 2h30 (crianças <1 ano)
- 30ml/kg em 30 min, depois 70ml/kg em 2h30 (>1 ano)

## Antibióticos
- **Adultos**: Doxiciclina 300mg dose única ou Ciprofloxacina 1g dose única
- **Crianças**: Eritromicina 12.5mg/kg 4x/dia por 3 dias
- **Grávidas**: Eritromicina

## Prevenção
- Tratamento da água
- Lavagem das mãos
- Saneamento adequado
- Vacina oral contra cólera em áreas de risco
    `,
  },
];

/**
 * Get medical protocol by ID
 */
export function getMedicalProtocol(id: string): MedicalProtocol | undefined {
  return MOZ_MEDICAL_PROTOCOLS.find(protocol => protocol.id === id);
}

/**
 * Get medical protocols by category
 */
export function getMedicalProtocolsByCategory(category: string): MedicalProtocol[] {
  return MOZ_MEDICAL_PROTOCOLS.filter(protocol => protocol.category === category);
}

/**
 * Get medical protocols applicable to an age group
 */
export function getMedicalProtocolsForAgeGroup(ageGroup: string): MedicalProtocol[] {
  return MOZ_MEDICAL_PROTOCOLS.filter(protocol => 
    protocol.applicableAgeGroups?.includes(ageGroup as any)
  );
}

