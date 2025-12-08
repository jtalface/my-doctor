/**
 * Screening Service
 * 
 * Provides preventive screening recommendations based on 
 * age, sex, and risk factors following USPSTF guidelines.
 */

interface ScreeningRecommendation {
  id: string;
  name: string;
  frequency: string;
  ageRange: { min: number; max?: number };
  sex?: "male" | "female" | "all";
  riskFactors?: string[];
}

// USPSTF-based screening guidelines (simplified for MVP)
const SCREENING_GUIDELINES: ScreeningRecommendation[] = [
  // Blood pressure
  {
    id: "bp_screening",
    name: "Blood pressure screening",
    frequency: "annually",
    ageRange: { min: 18 },
    sex: "all"
  },
  // Colorectal cancer
  {
    id: "colorectal_screening",
    name: "Colorectal cancer screening",
    frequency: "every 10 years (colonoscopy) or annually (FIT)",
    ageRange: { min: 45, max: 75 }
  },
  // Breast cancer (mammogram)
  {
    id: "mammogram",
    name: "Mammogram for breast cancer",
    frequency: "every 2 years",
    ageRange: { min: 50, max: 74 },
    sex: "female"
  },
  // Cervical cancer (Pap smear)
  {
    id: "cervical_screening",
    name: "Cervical cancer screening (Pap smear)",
    frequency: "every 3 years (21-29) or every 5 years with HPV test (30-65)",
    ageRange: { min: 21, max: 65 },
    sex: "female"
  },
  // Lung cancer (high risk smokers)
  {
    id: "lung_ct",
    name: "Low-dose CT for lung cancer",
    frequency: "annually",
    ageRange: { min: 50, max: 80 },
    riskFactors: ["smoker", "former_smoker_20_pack_years"]
  },
  // Diabetes
  {
    id: "diabetes_screening",
    name: "Diabetes screening (A1C or fasting glucose)",
    frequency: "every 3 years",
    ageRange: { min: 35, max: 70 },
    riskFactors: ["overweight", "obese"]
  },
  // Lipid panel
  {
    id: "lipid_screening",
    name: "Lipid panel (cholesterol)",
    frequency: "every 5 years",
    ageRange: { min: 40, max: 75 }
  },
  // Prostate cancer (shared decision)
  {
    id: "prostate_screening",
    name: "Prostate cancer screening (PSA) - discuss with doctor",
    frequency: "shared decision making",
    ageRange: { min: 55, max: 69 },
    sex: "male"
  },
  // Osteoporosis
  {
    id: "osteoporosis_screening",
    name: "Bone density screening (DEXA)",
    frequency: "at least once",
    ageRange: { min: 65 },
    sex: "female"
  },
  // Depression
  {
    id: "depression_screening",
    name: "Depression screening",
    frequency: "annually or as needed",
    ageRange: { min: 12 }
  },
  // STI screening (sexually active)
  {
    id: "hiv_screening",
    name: "HIV screening",
    frequency: "at least once (15-65), more if high risk",
    ageRange: { min: 15, max: 65 }
  },
  // Hepatitis C
  {
    id: "hepc_screening",
    name: "Hepatitis C screening",
    frequency: "once",
    ageRange: { min: 18, max: 79 }
  },
  // Abdominal aortic aneurysm (male smokers)
  {
    id: "aaa_screening",
    name: "Abdominal aortic aneurysm screening (ultrasound)",
    frequency: "once",
    ageRange: { min: 65, max: 75 },
    sex: "male",
    riskFactors: ["smoker", "former_smoker"]
  }
];

export class ScreeningService {
  /**
   * Get recommended screenings based on age and sex
   */
  recommendScreenings(age: number, sex: string): string[] {
    const normalizedSex = sex?.toLowerCase();
    const isMale = normalizedSex === "male" || normalizedSex === "m";
    const isFemale = normalizedSex === "female" || normalizedSex === "f";

    return SCREENING_GUIDELINES
      .filter(s => {
        // Check age range
        if (age < s.ageRange.min) return false;
        if (s.ageRange.max && age > s.ageRange.max) return false;

        // Check sex
        if (s.sex === "male" && !isMale) return false;
        if (s.sex === "female" && !isFemale) return false;

        // Skip risk-factor-only screenings in basic recommendation
        if (s.riskFactors && s.riskFactors.length > 0) return false;

        return true;
      })
      .map(s => `${s.name} (${s.frequency})`);
  }

  /**
   * Get all recommended screenings including risk-factor based
   */
  recommendScreeningsWithRiskFactors(
    age: number,
    sex: string,
    riskFactors: string[]
  ): string[] {
    const normalizedSex = sex?.toLowerCase();
    const isMale = normalizedSex === "male" || normalizedSex === "m";
    const isFemale = normalizedSex === "female" || normalizedSex === "f";
    const normalizedRiskFactors = riskFactors.map(rf => rf.toLowerCase());

    return SCREENING_GUIDELINES
      .filter(s => {
        // Check age range
        if (age < s.ageRange.min) return false;
        if (s.ageRange.max && age > s.ageRange.max) return false;

        // Check sex
        if (s.sex === "male" && !isMale) return false;
        if (s.sex === "female" && !isFemale) return false;

        // Check risk factors
        if (s.riskFactors && s.riskFactors.length > 0) {
          const hasRiskFactor = s.riskFactors.some(rf => 
            normalizedRiskFactors.some(nrf => nrf.includes(rf) || rf.includes(nrf))
          );
          if (!hasRiskFactor) return false;
        }

        return true;
      })
      .map(s => `${s.name} (${s.frequency})`);
  }

  /**
   * Detect cardiovascular red flags from text
   */
  detectCardioRedFlags(text: string): string | null {
    const input = text.toLowerCase();

    // Acute MI symptoms
    if (/crushing.*chest|elephant.*chest|severe.*chest.*pain/i.test(input)) {
      if (/radiat|spread|arm|jaw|neck/i.test(input) || /sweat|nausea|breath/i.test(input)) {
        return "Possible acute coronary syndrome - crushing chest pain with radiation or associated symptoms";
      }
    }

    // Sudden severe symptoms
    if (/sudden.*severe.*chest/i.test(input)) {
      return "Sudden severe chest pain - needs urgent evaluation";
    }

    // Syncope with chest pain
    if (/faint|pass.*out|lost.*conscious/i.test(input) && /chest/i.test(input)) {
      return "Syncope with chest pain - possible cardiac emergency";
    }

    // Palpitations with concerning features
    if (/palpitation|racing.*heart|heart.*racing/i.test(input)) {
      if (/faint|dizz|chest.*pain|short.*breath/i.test(input)) {
        return "Palpitations with hemodynamic symptoms";
      }
    }

    return null;
  }

  /**
   * Detect respiratory red flags
   */
  detectRespiratoryRedFlags(text: string): string | null {
    const input = text.toLowerCase();

    // Severe respiratory distress
    if (/can't.*breathe|unable.*breathe|gasping/i.test(input)) {
      return "Severe respiratory distress";
    }

    // Cyanosis
    if (/blue.*lips|blue.*fingernails|turning.*blue/i.test(input)) {
      return "Possible cyanosis - oxygen deprivation";
    }

    // Hemoptysis
    if (/cough.*blood|blood.*cough|hemoptysis/i.test(input)) {
      return "Hemoptysis - coughing blood";
    }

    // Altered mental status with breathing difficulty
    if (/confus|drowsy|can't.*stay.*awake/i.test(input) && /breath/i.test(input)) {
      return "Altered mental status with respiratory symptoms";
    }

    return null;
  }

  /**
   * Detect mental health red flags
   */
  detectMentalHealthRedFlags(text: string): string | null {
    const input = text.toLowerCase();

    // Suicidal ideation
    if (/suicid|kill.*myself|end.*my.*life|want.*to.*die|better.*off.*dead/i.test(input)) {
      return "URGENT: Possible suicidal ideation - immediate evaluation needed";
    }

    // Self-harm
    if (/hurt.*myself|cutting|self.*harm/i.test(input)) {
      return "Self-harm concern - needs mental health evaluation";
    }

    // Psychotic symptoms
    if (/voices.*telling|hearing.*voices|seeing.*things.*not.*there/i.test(input)) {
      return "Possible psychotic symptoms";
    }

    return null;
  }

  /**
   * Get all screening guidelines
   */
  getAllGuidelines(): ScreeningRecommendation[] {
    return [...SCREENING_GUIDELINES];
  }
}

