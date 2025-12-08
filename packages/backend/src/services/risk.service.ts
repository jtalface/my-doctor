/**
 * Risk Service
 * 
 * Computes various health risk scores based on patient data and symptoms.
 */
export class RiskService {
  /**
   * Compute Body Mass Index
   * @param weightKg Weight in kilograms
   * @param heightM Height in meters
   * @returns BMI value
   */
  computeBMI(weightKg: number, heightM: number): number {
    if (heightM <= 0) return 0;
    return weightKg / (heightM * heightM);
  }

  /**
   * Get BMI category
   */
  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return "underweight";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "overweight";
    if (bmi < 35) return "obese_class_1";
    if (bmi < 40) return "obese_class_2";
    return "obese_class_3";
  }

  /**
   * Compute chest pain risk score based on symptoms and history
   * @param text User's symptom description
   * @param memory Session/patient memory context
   * @returns Risk score (0-10)
   */
  computeChestPainRisk(text: string, memory: Record<string, unknown>): number {
    let score = 0;
    const input = text.toLowerCase();

    // Location and radiation patterns
    if (/central|substernal|behind.*sternum/i.test(input)) score += 2;
    if (/radiat|spread|arm|jaw|neck|back/i.test(input)) score += 2;
    
    // Associated symptoms
    if (/sweat|diaphores/i.test(input)) score += 1;
    if (/nausea|vomit/i.test(input)) score += 1;
    if (/short.*breath|dyspnea|breathless/i.test(input)) score += 1;
    if (/dizz|lightheaded|faint/i.test(input)) score += 1;

    // Quality descriptors
    if (/crushing|pressure|tight|squeez|heavy|elephant/i.test(input)) score += 2;

    // Duration
    if (/sudden|abrupt|came on fast/i.test(input)) score += 1;
    if (/ongoing|continuous|won't go away|persist/i.test(input)) score += 1;

    // Exertional
    if (/exertion|exercise|walking|stairs|activity/i.test(input)) score += 1;

    // Risk factors from memory
    const profile = memory?.profile as Record<string, unknown> | undefined;
    const demographics = memory?.demographics as Record<string, unknown> | undefined;
    const data = profile || demographics || {};

    // Age risk
    const age = (data.age || data.age_or_birthyear) as number | undefined;
    if (age && age > 45) score += 1;
    if (age && age > 65) score += 1;

    // Sex risk (males have higher baseline risk)
    const sex = (data.sexAtBirth || data.sex_at_birth) as string | undefined;
    if (sex === "male") score += 1;

    // Known conditions
    const conditions = (memory?.chronicConditions || []) as Array<{ name: string }>;
    const conditionNames = conditions.map(c => c.name?.toLowerCase() || "").join(" ");
    if (/diabetes/i.test(conditionNames)) score += 1;
    if (/hypertension|high.*blood.*pressure/i.test(conditionNames)) score += 1;
    if (/cholesterol|hyperlipidemia/i.test(conditionNames)) score += 1;
    if (/heart|cardiac|coronary/i.test(conditionNames)) score += 2;

    // Smoking
    const socialHistory = memory?.socialHistory as Record<string, unknown> | undefined;
    if (socialHistory?.smoking === "current") score += 1;

    return Math.min(score, 10);
  }

  /**
   * Compute respiratory severity score
   * @param input User's symptom description
   * @returns Severity score (0-10)
   */
  respiratorySeverityScore(input: unknown): number {
    const text = String(input).toLowerCase();
    let score = 0;

    // Breathing difficulty severity
    if (/can't.*breathe|unable.*breathe|gasping/i.test(text)) score += 3;
    if (/severe.*short.*breath|extremely.*difficult/i.test(text)) score += 2;
    if (/short.*breath|difficulty.*breath|breathless/i.test(text)) score += 1;

    // At rest vs exertion
    if (/at rest|sitting|lying|not moving/i.test(text)) score += 2;

    // Associated symptoms
    if (/blue|cyanosis|lips.*blue|fingernails.*blue/i.test(text)) score += 3;
    if (/chest.*pain|chest.*tight/i.test(text)) score += 1;
    if (/wheez/i.test(text)) score += 1;
    if (/cough.*blood|hemoptysis/i.test(text)) score += 2;
    if (/fever/i.test(text)) score += 1;
    if (/confus|altered|drowsy|can't.*stay.*awake/i.test(text)) score += 2;

    // Duration and progression
    if (/sudden|abrupt|came.*on.*fast/i.test(text)) score += 1;
    if (/getting.*worse|worsening|progressing/i.test(text)) score += 1;

    // Specific conditions
    if (/asthma.*attack|asthma.*flare/i.test(text)) score += 1;
    if (/copd.*exacerbation/i.test(text)) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Compute depression risk from PHQ-2 responses
   * @param responses Array of PHQ-2 responses
   * @returns Score (0-6)
   */
  computePHQ2Score(responses: string[]): number {
    return responses.reduce((sum, response) => {
      const normalized = response.toLowerCase();
      if (/not at all/i.test(normalized)) return sum + 0;
      if (/several days/i.test(normalized)) return sum + 1;
      if (/more than half/i.test(normalized)) return sum + 2;
      if (/nearly every day/i.test(normalized)) return sum + 3;
      return sum;
    }, 0);
  }

  /**
   * Check if PHQ-2 score suggests further depression screening
   */
  shouldScreenForDepression(phq2Score: number): boolean {
    return phq2Score >= 3;
  }

  /**
   * Compute cardiovascular risk factors count
   */
  countCardioRiskFactors(memory: Record<string, unknown>): {
    count: number;
    factors: string[];
  } {
    const factors: string[] = [];
    
    const profile = memory?.profile as Record<string, unknown> | undefined;
    const demographics = memory?.demographics as Record<string, unknown> | undefined;
    const data = profile || demographics || {};
    
    // Age
    const age = (data.age || data.age_or_birthyear) as number | undefined;
    if (age && age > 45) factors.push("age > 45");

    // BMI
    const weightKg = (data.weightKg || data.weight) as number | undefined;
    const heightM = (data.heightM || data.height) as number | undefined;
    if (weightKg && heightM) {
      const bmi = this.computeBMI(weightKg, heightM);
      if (bmi >= 30) factors.push("obesity");
    }

    // Smoking
    const socialHistory = memory?.socialHistory as Record<string, unknown> | undefined;
    if (socialHistory?.smoking === "current") factors.push("current smoker");

    // Conditions
    const conditions = (memory?.chronicConditions || []) as Array<{ name: string }>;
    conditions.forEach(c => {
      const name = c.name?.toLowerCase() || "";
      if (/diabetes/i.test(name)) factors.push("diabetes");
      if (/hypertension|high.*blood.*pressure/i.test(name)) factors.push("hypertension");
      if (/cholesterol|hyperlipidemia/i.test(name)) factors.push("dyslipidemia");
    });

    return {
      count: factors.length,
      factors
    };
  }
}

