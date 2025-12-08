import {
  IMedicalReasoningEngine,
  ReasoningContext,
  ReasoningResult,
  ReasoningScores,
  RedFlag,
  ReasoningRecommendations
} from "./types";
import { RiskService } from "../services/risk.service";
import { ScreeningService } from "../services/screening.service";

/**
 * Medical Reasoning Engine
 * 
 * Analyzes patient data to:
 * - Compute health scores (BMI, cardiac risk, respiratory severity, depression)
 * - Detect red flags requiring urgent attention
 * - Generate recommendations for education, screening, and follow-up
 */
export class MedicalReasoningEngine implements IMedicalReasoningEngine {
  private riskService: RiskService;
  private screeningService: ScreeningService;

  constructor() {
    this.riskService = new RiskService();
    this.screeningService = new ScreeningService();
  }

  async analyze(ctx: ReasoningContext): Promise<ReasoningResult> {
    const { state, input, memory, profile } = ctx;

    const redFlags: RedFlag[] = [];
    const scores: ReasoningScores = {};
    const educationTopics: string[] = [];
    const screeningSuggestions: string[] = [];
    const followUpQuestions: string[] = [];
    const notes: string[] = [];

    // Extract demographics
    const demographics = (profile || memory?.demographics || {}) as Record<string, unknown>;
    const weight = (demographics.weightKg || demographics.weight) as number | undefined;
    const height = (demographics.heightM || demographics.height) as number | undefined;
    const age = (demographics.age || demographics.age_or_birthyear) as number | undefined;
    const sex = (demographics.sexAtBirth || demographics.sex_at_birth || demographics.sex) as string | undefined;

    // ---------------------------------------------------------------
    // 1. BMI Analysis
    // ---------------------------------------------------------------
    if (weight && height) {
      const bmi = this.riskService.computeBMI(weight, height);
      scores.bmi = bmi;
      notes.push(`BMI ≈ ${bmi.toFixed(1)} (${this.riskService.getBMICategory(bmi)})`);

      if (bmi >= 30) {
        educationTopics.push("weight management");
        educationTopics.push("cardiometabolic risk");
        redFlags.push({
          id: "bmi_obese",
          label: "Obesity",
          reason: `BMI ${bmi.toFixed(1)} indicates obesity`,
          severity: "moderate"
        });
      } else if (bmi >= 25) {
        educationTopics.push("healthy lifestyle and nutrition");
      } else if (bmi < 18.5) {
        educationTopics.push("nutrition and healthy weight");
        redFlags.push({
          id: "bmi_underweight",
          label: "Underweight",
          reason: `BMI ${bmi.toFixed(1)} indicates underweight`,
          severity: "low"
        });
      }
    }

    // ---------------------------------------------------------------
    // 2. Cardiovascular Analysis
    // ---------------------------------------------------------------
    const isCardioState = state.toLowerCase().includes("cardio");
    const inputStr = String(input).toLowerCase();
    const hasCardioSymptoms = /chest|heart|palpitation/i.test(inputStr);

    if (isCardioState || hasCardioSymptoms) {
      const cardioRisk = this.riskService.computeChestPainRisk(String(input), memory);
      scores.cardioRisk = cardioRisk;

      if (cardioRisk >= 8) {
        redFlags.push({
          id: "cardio_high_risk",
          label: "High cardiac risk pattern",
          reason: "Chest symptoms with elevated risk factors",
          severity: "high"
        });
      } else if (cardioRisk >= 5) {
        educationTopics.push("chest pain red-flag symptoms");
        redFlags.push({
          id: "cardio_moderate_risk",
          label: "Moderate cardiac risk",
          reason: "Chest symptoms requiring evaluation",
          severity: "moderate"
        });
      }

      // Check for specific red flags
      const cardioRedFlag = this.screeningService.detectCardioRedFlags(String(input));
      if (cardioRedFlag) {
        redFlags.push({
          id: "cardio_critical",
          label: "Cardiovascular red flag",
          reason: cardioRedFlag,
          severity: "high"
        });
      }
    }

    // ---------------------------------------------------------------
    // 3. Respiratory Analysis
    // ---------------------------------------------------------------
    const isRespState = state.toLowerCase().includes("resp");
    const hasRespSymptoms = /cough|breath|wheeze/i.test(inputStr);

    if (isRespState || hasRespSymptoms) {
      const severity = this.riskService.respiratorySeverityScore(input);
      scores.respiratorySeverity = severity;

      if (severity >= 8) {
        redFlags.push({
          id: "resp_severe",
          label: "Severe respiratory symptoms",
          reason: "High severity respiratory distress",
          severity: "high"
        });
      } else if (severity >= 5) {
        educationTopics.push("respiratory symptom management");
        redFlags.push({
          id: "resp_moderate",
          label: "Moderate respiratory symptoms",
          reason: "Respiratory symptoms requiring attention",
          severity: "moderate"
        });
      }

      // Check for specific red flags
      const respRedFlag = this.screeningService.detectRespiratoryRedFlags(String(input));
      if (respRedFlag) {
        redFlags.push({
          id: "resp_critical",
          label: "Respiratory red flag",
          reason: respRedFlag,
          severity: "high"
        });
      }
    }

    // ---------------------------------------------------------------
    // 4. Mental Health Analysis
    // ---------------------------------------------------------------
    const isMentalHealthState = state.toLowerCase().includes("mental") || 
                                state.toLowerCase().includes("depression");
    
    // Check for mental health red flags in any state
    const mentalRedFlag = this.screeningService.detectMentalHealthRedFlags(String(input));
    if (mentalRedFlag) {
      redFlags.push({
        id: "mental_health_critical",
        label: "Mental health concern",
        reason: mentalRedFlag,
        severity: "high"
      });
    }

    // PHQ-2 scoring from memory
    const screenings = memory?.screenings as Record<string, unknown> | undefined;
    const phq2Responses = screenings?.phq2 as string[] | undefined;

    if (phq2Responses && Array.isArray(phq2Responses)) {
      const phq2Score = this.riskService.computePHQ2Score(phq2Responses);
      scores.depressionScore = phq2Score;

      if (this.riskService.shouldScreenForDepression(phq2Score)) {
        educationTopics.push("mental health support");
        educationTopics.push("depression awareness");
        followUpQuestions.push(
          "Have these feelings impaired your sleep, appetite, or daily functioning?"
        );
        redFlags.push({
          id: "depression_screen_positive",
          label: "Positive depression screen",
          reason: `PHQ-2 score ${phq2Score}/6 suggests further evaluation`,
          severity: "moderate"
        });
      }
    }

    // ---------------------------------------------------------------
    // 5. Preventive Screening Recommendations
    // ---------------------------------------------------------------
    if (age && sex) {
      const recommended = this.screeningService.recommendScreenings(age, sex);
      screeningSuggestions.push(...recommended);
    }

    // ---------------------------------------------------------------
    // 6. Determine Override State
    // ---------------------------------------------------------------
    const hasHighSeverityRedFlag = redFlags.some(rf => rf.severity === "high");
    let overrideNextState: string | undefined;

    if (hasHighSeverityRedFlag) {
      // Determine which escalation path
      const hasCardioHigh = redFlags.some(rf => rf.id.startsWith("cardio") && rf.severity === "high");
      const hasRespHigh = redFlags.some(rf => rf.id.startsWith("resp") && rf.severity === "high");
      const hasMentalHigh = redFlags.some(rf => rf.id.startsWith("mental") && rf.severity === "high");

      if (hasMentalHigh) {
        overrideNextState = "CRISIS_RESOURCES";
      } else if (hasCardioHigh) {
        overrideNextState = "URGENT_CARDIO";
      } else if (hasRespHigh) {
        overrideNextState = "URGENT_RESPIRATORY";
      }
    }

    // ---------------------------------------------------------------
    // 7. Build Result
    // ---------------------------------------------------------------
    const recommendations: ReasoningRecommendations = {
      educationTopics: [...new Set(educationTopics)],
      screeningSuggestions: [...new Set(screeningSuggestions)],
      followUpQuestions: [...new Set(followUpQuestions)]
    };

    return {
      redFlags,
      scores,
      recommendations,
      notes,
      overrideNextState
    };
  }
}

