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
        why: 'A medição regular da tensão arterial ajuda a detetar hipertensão cedo, muitas vezes antes de surgirem sintomas. Controlar este indicador reduz o risco de AVC, enfarte, insuficiência renal e outras complicações cardiovasculares. Em linguagem simples: acompanhar a tensão ao longo do tempo permite agir mais cedo com mudanças de estilo de vida e, quando necessário, tratamento médico.',
        learnMore: '## Porque este rastreio é importante\nA hipertensão pode evoluir em silêncio durante anos. Quando não é identificada e controlada, aumenta o risco de doença cardíaca, AVC e lesão renal.\n\n## Qual é o intervalo recomendado\nPara a maioria dos adultos, a avaliação anual é um bom ponto de partida. Em pessoas com valores limítrofes, hipertensão já conhecida ou maior risco cardiovascular, o controlo pode ser mais frequente.\n\n## Como é feita a avaliação\nA medição é rápida e indolor, geralmente com braçadeira no braço, em consulta, farmácia ou através de automonitorização validada em casa. O mais importante é avaliar tendência e não apenas um valor isolado.\n\n## Como pode aceder\nPode medir em centros de saúde, clínicas, farmácias e campanhas comunitárias. Se tiver aparelho em casa, partilhe os registos com o seu profissional de saúde.\n\n## Dica prática\nMeça em repouso, evite café/tabaco nos 30 minutos antes e registe os valores para discussão clínica.',
      },
      lipid_panel: {
        name: 'Perfil lipídico',
        interval: 'A cada 4-6 anos',
        why: 'O perfil lipídico avalia colesterol total, LDL, HDL e triglicéridos para estimar risco cardiovascular. Alterações nestes valores podem acumular-se sem sintomas e aumentar risco de enfarte e AVC ao longo dos anos. Em termos práticos, este exame ajuda a decidir quando reforçar dieta, exercício e, em alguns casos, iniciar medicação preventiva.',
        learnMore: '## Porque este rastreio é importante\nO colesterol elevado nem sempre causa sintomas imediatos, mas contribui para aterosclerose (acumulação de placas nas artérias). Detetar cedo permite prevenir eventos cardiovasculares futuros.\n\n## Qual é o intervalo recomendado\nEm geral, o rastreio pode ser feito a cada 4 a 6 anos em adultos de baixo risco. Em perfis com diabetes, tabagismo, obesidade, hipertensão ou histórico familiar, a periodicidade pode ser menor.\n\n## Como é feito o exame\nÉ uma análise de sangue simples. O laboratório mede diferentes frações de gordura no sangue e os resultados são interpretados no contexto do risco global da pessoa.\n\n## Como pode aceder\nPode fazer através de pedido em consulta médica, em laboratórios privados ou em unidades públicas, conforme cobertura e disponibilidade local.\n\n## Dica prática\nLeve resultados anteriores para comparar tendência ao longo do tempo; isso melhora a decisão clínica.',
      },
      hba1c: {
        name: 'HbA1c / glicemia',
        interval: 'A cada 1-3 anos (se risco)',
        why: 'A HbA1c e a glicemia ajudam a identificar pré-diabetes e diabetes em fase inicial. Detectar cedo permite intervir antes de danos em olhos, rins, nervos e coração. Em termos simples: este rastreio mostra como o corpo está a gerir o açúcar no sangue e orienta medidas preventivas eficazes.',
        learnMore: '## Porque este rastreio é importante\nAlterações da glicose podem evoluir sem sintomas claros no início. O diagnóstico precoce reduz o risco de complicações a médio e longo prazo.\n\n## Qual é o intervalo recomendado\nEm pessoas sem risco elevado, o intervalo costuma ser mais espaçado. Quando existem fatores de risco metabólico, obesidade, histórico familiar ou alterações anteriores, a avaliação tende a ser mais frequente (por vezes anual).\n\n## Como é feito o exame\nA glicemia é medida por análise de sangue pontual. A HbA1c reflete a média da glicose dos últimos meses, ajudando a perceber tendência de controlo metabólico.\n\n## Como pode aceder\nPode realizar em laboratório com pedido médico ou por programas de rastreio quando disponíveis. A interpretação deve ser feita com profissional de saúde.\n\n## Dica prática\nSe tiver resultados no limite, combine um plano claro de reavaliação e estilo de vida com metas realistas.',
      },
      colorectal: {
        name: 'Rastreio colorretal',
        interval: 'A partir dos 45 anos',
        why: 'O rastreio colorretal procura sinais precoces de cancro ou lesões pré-cancerosas antes de causarem sintomas. Quando identificado cedo, o tratamento é geralmente mais eficaz e menos agressivo. Na prática, este rastreio salva vidas ao antecipar diagnóstico e intervenção.',
        learnMore: '## Porque este rastreio é importante\nO cancro colorretal pode desenvolver-se de forma silenciosa durante anos. O rastreio permite encontrar alterações iniciais e tratá-las precocemente.\n\n## Qual é o intervalo recomendado\nA recomendação habitual inicia por volta dos 45 anos, mas o intervalo exato depende do tipo de teste e do risco individual.\n\n## Como é feito o rastreio\nPode incluir pesquisa de sangue oculto nas fezes e, quando indicado, colonoscopia ou outros exames complementares. O método é escolhido com base em idade, risco e contexto clínico.\n\n## Como pode aceder\nFale com médico de família, gastrenterologia ou programas de rastreio locais. Muitos sistemas têm circuitos próprios para referenciação.\n\n## Dica prática\nNão adie por ausência de sintomas: o maior benefício do rastreio é justamente antes de haver sinais.',
      },
      psa_discussion: {
        name: 'PSA (discussão clínica)',
        interval: 'Por volta dos 50 anos',
        why: 'O PSA não é uma decisão “igual para todos”: deve ser discutido com base em idade, risco pessoal e preferências. Esta conversa ajuda a equilibrar benefícios e possíveis limitações do rastreio do cancro da próstata. Em linguagem simples, o objetivo é tomar uma decisão informada e adequada ao seu perfil.',
        learnMore: '## Porque esta discussão é importante\nO PSA pode ajudar na deteção precoce em alguns casos, mas também pode levar a investigação adicional que nem sempre traz benefício proporcional. Por isso, a decisão deve ser partilhada.\n\n## Quando discutir\nA conversa costuma iniciar por volta dos 50 anos, podendo ser antecipada se houver risco aumentado (por exemplo, histórico familiar relevante).\n\n## O que é avaliado na consulta\nSão discutidos fatores de risco, expectativas, vantagens, limitações e possíveis próximos passos caso o resultado venha alterado.\n\n## Como pode aceder\nPode abordar o tema em consulta de medicina geral/familiar, urologia ou prevenção personalizada.\n\n## Dica prática\nLeve dúvidas escritas para a consulta; isso ajuda a tomar decisão mais alinhada com os seus valores.',
      },
      vision: {
        name: 'Avaliação da visão',
        interval: 'A cada 1-2 anos',
        why: 'A avaliação da visão deteta precocemente alterações que afetam qualidade de vida, segurança e autonomia. Também ajuda a identificar sinais de doenças oculares que podem progredir sem que a pessoa note no início. Em termos práticos, este rastreio protege visão funcional para trabalho, condução e atividades diárias.',
        learnMore: '## Porque este rastreio é importante\nProblemas visuais não corrigidos aumentam risco de quedas, acidentes e redução de produtividade. Algumas doenças oculares evoluem silenciosamente e beneficiam de deteção precoce.\n\n## Qual é o intervalo recomendado\nPara muitos adultos, o controlo a cada 1 a 2 anos é adequado. Em pessoas com diabetes, hipertensão, idade avançada ou sintomas, a frequência pode ser maior.\n\n## Como é feita a avaliação\nA consulta pode incluir medição de acuidade visual, avaliação de refração, pressão ocular e exame das estruturas do olho.\n\n## Como pode aceder\nPode marcar em oftalmologia/optometria em clínica privada, rede seguradora ou serviços públicos, conforme disponibilidade.\n\n## Dica prática\nProcure avaliação antes de renovar carta de condução ou se notar visão turva, dor ocular ou dificuldade noturna.',
      },
      dental: {
        name: 'Consulta dentária',
        interval: 'A cada 6-12 meses',
        why: 'A consulta dentária regular não serve apenas para tratar cáries: ajuda a prevenir dor, infeções, perda de dentes, doença das gengivas e dificuldade em mastigar ou falar. A saúde oral está ligada à saúde geral, por isso inflamação e infeções na boca podem agravar problemas como diabetes, doença cardiovascular e complicações em fases de maior fragilidade. Em termos simples: cuidar da boca cedo evita tratamentos mais complexos, mais caros e mais desconfortáveis no futuro. Para a maioria das pessoas, o intervalo recomendado é entre 6 e 12 meses, mas pode ser mais curto se houver risco aumentado (por exemplo, doença gengival, tabagismo, diabetes, aparelho dentário, boca seca ou histórico de cáries frequentes).',
        learnMore: '## Porque esta consulta é importante\nA consulta dentária regular permite identificar problemas numa fase inicial, quando o tratamento é mais simples e menos desconfortável. Cáries pequenas, inflamação das gengivas e desgaste dos dentes podem evoluir sem dor no início, por isso a avaliação periódica evita surpresas e ajuda a proteger a mastigação, a fala e a qualidade de vida.\n\n## Qual é o intervalo recomendado\nPara a maioria das pessoas, recomenda-se consulta de 6 em 6 meses até 12 em 12 meses. Em perfis com maior risco (por exemplo: doença das gengivas, tabagismo, diabetes, boca seca, aparelho dentário ou cáries frequentes), o intervalo pode precisar de ser mais curto.\n\n## Como é feita a consulta\nNuma consulta de rotina, o profissional observa dentes, gengivas e mucosas, procura sinais de cárie, tártaro, sangramento, retração gengival e outras alterações. Se necessário, pode indicar limpeza profissional, tratamentos específicos e orientações práticas de higiene oral para casa.\n\n## Como pode aceder ao rastreio\nPode marcar numa clínica dentária privada, através do seu seguro/plano de saúde (quando inclui estomatologia), ou em serviços públicos disponíveis na sua área. Se tiver dúvidas sobre onde ir, contacte o centro de saúde local para saber as opções de referenciação.\n\n## Dica prática\nSe já passaram mais de 12 meses desde a última consulta, vale a pena marcar uma avaliação agora e registar a próxima data para manter o acompanhamento em dia.',
      },
      cervical: {
        name: 'Rastreio do colo do útero',
        interval: '21-65 anos, a cada 3-5 anos',
        why: 'O rastreio do colo do útero identifica alterações antes de evoluírem para doença mais grave. Quando feito no intervalo certo, reduz significativamente risco de cancro do colo do útero. Em termos simples: é uma prevenção altamente eficaz quando mantida de forma regular.',
        learnMore: '## Porque este rastreio é importante\nAs alterações cervicais podem existir sem sintomas. O rastreio permite detetar e acompanhar lesões precoces com elevada taxa de sucesso.\n\n## Qual é o intervalo recomendado\nEntre os 21 e os 65 anos, a periodicidade costuma variar entre 3 e 5 anos, conforme idade e tipo de teste realizado.\n\n## Como é feito o exame\nO profissional recolhe uma amostra do colo do útero para análise laboratorial (teste citológico/HPV, conforme protocolo).\n\n## Como pode aceder\nPode realizar em consulta de saúde da mulher, medicina geral/familiar, ginecologia ou programas de rastreio públicos quando disponíveis.\n\n## Dica prática\nSe perdeu o último intervalo, marque nova avaliação sem esperar sintomas.',
      },
      mammogram: {
        name: 'Mamografia',
        interval: 'A partir dos 40 anos, a cada 1-2 anos',
        why: 'A mamografia é uma ferramenta importante para detectar alterações mamárias em fases iniciais, muitas vezes antes de serem palpáveis. A deteção precoce aumenta opções terapêuticas e pode melhorar prognóstico. Em linguagem prática, fazer no intervalo recomendado aumenta a probabilidade de encontrar problemas quando ainda são tratáveis com menor impacto.',
        learnMore: '## Porque este rastreio é importante\nO cancro da mama pode evoluir sem sinais evidentes no início. O rastreio regular melhora a identificação precoce e o planeamento terapêutico.\n\n## Qual é o intervalo recomendado\nEm geral, inicia por volta dos 40 anos com repetição a cada 1-2 anos, ajustado ao risco individual e orientação clínica.\n\n## Como é feito o exame\nA mamografia é um exame de imagem das mamas realizado por técnico qualificado, com leitura por equipa especializada.\n\n## Como pode aceder\nPode ser marcado por indicação médica, em programas de rastreio organizados ou em serviços privados/seguradoras.\n\n## Dica prática\nInforme sempre histórico familiar e exames anteriores para comparação de imagens.',
      },
      dexa: {
        name: 'Densitometria óssea (DEXA)',
        interval: 'A partir dos 65 anos',
        why: 'A DEXA mede densidade mineral óssea e ajuda a estimar risco de osteoporose e fraturas. Identificar perda óssea cedo permite intervir com medidas de proteção antes de ocorrerem quedas e fraturas incapacitantes. Em termos simples: é um exame preventivo para manter autonomia e mobilidade no envelhecimento.',
        learnMore: '## Porque este rastreio é importante\nA osteoporose pode evoluir sem sintomas até ocorrer uma fratura. O rastreio ajuda a prevenir eventos que afetam fortemente qualidade de vida e independência.\n\n## Qual é o intervalo recomendado\nA recomendação comum começa a partir dos 65 anos, mas pode ser antecipada conforme fatores clínicos e medicação de risco.\n\n## Como é feito o exame\nA DEXA é um exame de imagem rápido, de baixa radiação, que quantifica densidade óssea em zonas-chave.\n\n## Como pode aceder\nPode ser solicitado em consulta de medicina geral/familiar, reumatologia, endocrinologia ou geriatria, conforme contexto clínico.\n\n## Dica prática\nCombine resultado da DEXA com plano de prevenção de quedas, atividade física e ingestão adequada de cálcio/vitamina D.',
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
