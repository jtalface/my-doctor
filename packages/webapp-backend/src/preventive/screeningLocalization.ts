import type { PreventiveLanguage, ScreeningCode } from './types.js';

interface LocalizedScreeningText {
  name: string;
  interval: string;
  why: string;
  learnMore: string;
}

interface LocalizationBundle {
  disclaimer: string;
  riskNotes: Record<string, string>;
  screening: Record<ScreeningCode, LocalizedScreeningText>;
}

const bundles: Record<PreventiveLanguage, LocalizationBundle> = {
  pt: {
    disclaimer: 'Esta informação não substitui a avaliação por um profissional de saúde.',
    riskNotes: {
      risk_standard: 'Aplicam-se recomendações gerais para o seu perfil.',
      risk_hba1c_high: 'Existem fatores de risco metabólico; este exame pode ser necessário com maior frequência.',
      risk_cardio_high: 'Os seus fatores de risco cardiovasculares podem justificar monitorização mais próxima.',
      risk_cancer_history: 'O histórico familiar pode justificar início mais cedo ou periodicidade mais curta.',
      risk_older_adult_discuss: 'A partir dos 75 anos, o plano deve ser individualizado com um profissional de saúde.',
    },
    screening: {
      blood_pressure: {
        name: 'Tensão arterial',
        interval: 'Anual',
        why: 'Ajuda a identificar risco cardiovascular de forma precoce.',
        learnMore: 'A medição regular permite acompanhar tendências e ajustar prevenção atempadamente.',
      },
      lipid_panel: {
        name: 'Perfil lipídico',
        interval: 'A cada 4-6 anos',
        why: 'Avalia colesterol e risco de doença cardiovascular.',
        learnMore: 'Pode ser mais frequente se houver tabagismo, diabetes ou histórico familiar.',
      },
      hba1c: {
        name: 'HbA1c / glicemia',
        interval: 'A cada 1-3 anos (se risco)',
        why: 'Permite detetar alterações do metabolismo da glicose.',
        learnMore: 'Em pessoas com risco metabólico, a periodicidade pode ser anual.',
      },
      colorectal: {
        name: 'Rastreio colorretal',
        interval: 'A partir dos 45 anos',
        why: 'Deteta sinais precoces de cancro colorretal.',
        learnMore: 'O tipo de exame e intervalo exatos devem ser definidos com orientação clínica.',
      },
      psa_discussion: {
        name: 'PSA (discussão clínica)',
        interval: 'Por volta dos 50 anos',
        why: 'A decisão depende de risco individual e preferências.',
        learnMore: 'Pode ser discutido mais cedo em caso de risco acrescido.',
      },
      vision: {
        name: 'Avaliação da visão',
        interval: 'A cada 1-2 anos',
        why: 'Ajuda a identificar alterações visuais e risco ocular.',
        learnMore: 'Importante em diabetes, hipertensão e idade avançada.',
      },
      dental: {
        name: 'Consulta dentária',
        interval: 'A cada 6-12 meses',
        why: 'Previne doença oral e impacto na saúde geral.',
        learnMore: 'A higiene oral regular reduz inflamação e complicações sistémicas.',
      },
      cervical: {
        name: 'Rastreio do colo do útero',
        interval: '21-65 anos, a cada 3-5 anos',
        why: 'Permite deteção precoce de alterações cervicais.',
        learnMore: 'A frequência varia com idade e tipo de teste.',
      },
      mammogram: {
        name: 'Mamografia',
        interval: 'A partir dos 40 anos, a cada 1-2 anos',
        why: 'Ajuda na deteção precoce do cancro da mama.',
        learnMore: 'O início e intervalo podem variar com risco familiar.',
      },
      dexa: {
        name: 'Densitometria óssea (DEXA)',
        interval: 'A partir dos 65 anos',
        why: 'Avalia risco de osteoporose e fraturas.',
        learnMore: 'Pode ser indicada mais cedo conforme fatores de risco clínico.',
      },
    },
  },
  en: {
    disclaimer: 'This information does not replace evaluation by a healthcare professional.',
    riskNotes: {
      risk_standard: 'General preventive guidance applies to your profile.',
      risk_hba1c_high: 'Metabolic risk factors are present; this test may be needed more often.',
      risk_cardio_high: 'Cardiovascular risk factors may justify closer monitoring.',
      risk_cancer_history: 'Family history may support earlier or more frequent screening.',
      risk_older_adult_discuss: 'After age 75, timing should be individualized with a clinician.',
    },
    screening: {
      blood_pressure: { name: 'Blood pressure', interval: 'Yearly', why: 'Helps detect cardiovascular risk early.', learnMore: 'Routine checks identify trends before symptoms appear.' },
      lipid_panel: { name: 'Lipid panel', interval: 'Every 4-6 years', why: 'Assesses cholesterol and cardiovascular risk.', learnMore: 'May be needed more often with smoking, diabetes, or family history.' },
      hba1c: { name: 'HbA1c / glucose', interval: 'Every 1-3 years if risk', why: 'Detects blood sugar regulation changes early.', learnMore: 'Higher-risk profiles may need annual monitoring.' },
      colorectal: { name: 'Colorectal screening', interval: 'Starting at age 45', why: 'Looks for early signs of colorectal cancer.', learnMore: 'Exact test type and interval should be clinician-guided.' },
      psa_discussion: { name: 'PSA discussion', interval: 'Around age 50', why: 'Shared decision based on personal risk and values.', learnMore: 'May start earlier for higher-risk individuals.' },
      vision: { name: 'Vision exam', interval: 'Every 1-2 years', why: 'Checks for visual and eye health changes.', learnMore: 'Especially important in diabetes, hypertension, and older age.' },
      dental: { name: 'Dental check-up', interval: 'Every 6-12 months', why: 'Prevents oral disease and supports whole-body health.', learnMore: 'Oral health is linked to inflammation and chronic conditions.' },
      cervical: { name: 'Cervical screening', interval: 'Age 21-65, every 3-5 years', why: 'Detects cervical changes early.', learnMore: 'Frequency depends on age and testing method.' },
      mammogram: { name: 'Mammogram', interval: 'Age 40+, every 1-2 years', why: 'Supports early breast cancer detection.', learnMore: 'Start age and cadence vary by risk profile.' },
      dexa: { name: 'Bone density (DEXA)', interval: 'Starting at age 65', why: 'Assesses osteoporosis and fracture risk.', learnMore: 'May be considered earlier with risk factors.' },
    },
  },
  fr: {
    disclaimer: "Ces informations ne remplacent pas l'evaluation par un professionnel de sante.",
    riskNotes: {
      risk_standard: 'Les recommandations generales de prevention s appliquent a votre profil.',
      risk_hba1c_high: 'Des facteurs de risque metabolique sont presents; ce test peut etre necessaire plus souvent.',
      risk_cardio_high: 'Les facteurs de risque cardiovasculaire peuvent justifier un suivi plus rapproche.',
      risk_cancer_history: 'Les antecedents familiaux peuvent justifier un depistage plus precoce ou plus frequent.',
      risk_older_adult_discuss: 'Apres 75 ans, le calendrier doit etre individualise avec un professionnel de sante.',
    },
    screening: {
      blood_pressure: { name: 'Tension arterielle', interval: 'Annuel', why: 'Aide a reperer precocement le risque cardiovasculaire.', learnMore: 'Un suivi regulier permet d agir avant les complications.' },
      lipid_panel: { name: 'Bilan lipidique', interval: 'Tous les 4-6 ans', why: 'Evalue le cholesterol et le risque cardiovasculaire.', learnMore: 'Peut etre plus frequent selon les facteurs de risque.' },
      hba1c: { name: 'HbA1c / glycemie', interval: 'Tous les 1-3 ans si risque', why: 'Permet de depister des troubles glycemiques.', learnMore: 'En cas de risque eleve, un rythme annuel peut etre indique.' },
      colorectal: { name: 'Depistage colorectal', interval: 'A partir de 45 ans', why: 'Recherche des signes precoces de cancer colorectal.', learnMore: 'Le test exact et la periodicite sont a valider avec un clinicien.' },
      psa_discussion: { name: 'PSA (discussion clinique)', interval: 'Vers 50 ans', why: 'Decision partagee selon le risque individuel.', learnMore: 'Une discussion plus precoce peut etre indiquee en cas de risque eleve.' },
      vision: { name: 'Controle de la vue', interval: 'Tous les 1-2 ans', why: 'Depiste les changements visuels et oculaires.', learnMore: 'Important en cas de diabete, HTA ou age avance.' },
      dental: { name: 'Controle dentaire', interval: 'Tous les 6-12 mois', why: 'Previent les maladies bucco-dentaires.', learnMore: 'La sante buccale influence la sante generale.' },
      cervical: { name: 'Depistage du col', interval: '21-65 ans, tous les 3-5 ans', why: 'Permet de detecter tot des anomalies cervicales.', learnMore: 'La frequence depend de l age et du test utilise.' },
      mammogram: { name: 'Mammographie', interval: 'A partir de 40 ans, tous les 1-2 ans', why: 'Favorise le depistage precoce du cancer du sein.', learnMore: 'Le calendrier peut varier selon le risque.' },
      dexa: { name: 'Densitometrie osseuse (DEXA)', interval: 'A partir de 65 ans', why: 'Evalue le risque d osteoporose et de fracture.', learnMore: 'Peut etre propose plus tot selon le contexte clinique.' },
    },
  },
  sw: {
    disclaimer: 'Taarifa hizi hazibadilishi tathmini ya mtaalamu wa afya.',
    riskNotes: {
      risk_standard: 'Mwongozo wa jumla wa kinga unatumika kwa wasifu wako.',
      risk_hba1c_high: 'Kuna vihatarishi vya kimetaboliki; kipimo hiki kinaweza kuhitajika mara kwa mara zaidi.',
      risk_cardio_high: 'Vihatarishi vya moyo na mishipa vinaweza kuhitaji ufuatiliaji wa karibu zaidi.',
      risk_cancer_history: 'Historia ya familia inaweza kuhitaji uchunguzi wa mapema au wa mara kwa mara zaidi.',
      risk_older_adult_discuss: 'Baada ya miaka 75, mpango unapaswa kubinafsishwa na mtaalamu wa afya.',
    },
    screening: {
      blood_pressure: { name: 'Shinikizo la damu', interval: 'Kila mwaka', why: 'Husaidia kugundua hatari ya moyo mapema.', learnMore: 'Vipimo vya mara kwa mara huonyesha mabadiliko kabla ya dalili kali.' },
      lipid_panel: { name: 'Vipimo vya mafuta damu', interval: 'Kila miaka 4-6', why: 'Hupima kolesteroli na hatari ya moyo.', learnMore: 'Huenda vikahitajika mara nyingi zaidi kulingana na hatari.' },
      hba1c: { name: 'HbA1c / sukari', interval: 'Kila miaka 1-3 kama kuna hatari', why: 'Hugundua mabadiliko ya udhibiti wa sukari mapema.', learnMore: 'Walio kwenye hatari kubwa wanaweza kuhitaji kipimo cha kila mwaka.' },
      colorectal: { name: 'Uchunguzi wa utumbo mpana', interval: 'Kuanzia miaka 45', why: 'Hutafuta dalili za mapema za saratani ya utumbo mpana.', learnMore: 'Aina ya kipimo na muda wake huamuliwa kwa ushauri wa daktari.' },
      psa_discussion: { name: 'Mazungumzo ya PSA', interval: 'Takriban miaka 50', why: 'Uamuzi hutegemea hatari binafsi na mapendeleo.', learnMore: 'Huenda ukaanza mapema zaidi kwa walio kwenye hatari kubwa.' },
      vision: { name: 'Uchunguzi wa macho', interval: 'Kila miaka 1-2', why: 'Husaidia kugundua mabadiliko ya kuona.', learnMore: 'Ni muhimu zaidi kwa wenye kisukari, shinikizo la damu, au umri mkubwa.' },
      dental: { name: 'Uchunguzi wa meno', interval: 'Kila miezi 6-12', why: 'Huzuia magonjwa ya kinywa na kusaidia afya kwa ujumla.', learnMore: 'Afya ya kinywa ina uhusiano na magonjwa sugu.' },
      cervical: { name: 'Uchunguzi wa mlango wa kizazi', interval: 'Miaka 21-65, kila miaka 3-5', why: 'Hugundua mabadiliko ya mapema kwenye mlango wa kizazi.', learnMore: 'Muda hutegemea umri na aina ya kipimo.' },
      mammogram: { name: 'Mamogramu', interval: 'Miaka 40+, kila miaka 1-2', why: 'Husaidia kugundua saratani ya matiti mapema.', learnMore: 'Muda wa kuanza na kurudia hutegemea kiwango cha hatari.' },
      dexa: { name: 'Kipimo cha uimara wa mifupa (DEXA)', interval: 'Kuanzia miaka 65', why: 'Hupima hatari ya mifupa kudhoofika na kuvunjika.', learnMore: 'Huenda kikahitajika mapema zaidi kulingana na vihatarishi.' },
    },
  },
};

export function getScreeningLocalization(language: PreventiveLanguage) {
  return bundles[language] || bundles.pt;
}
