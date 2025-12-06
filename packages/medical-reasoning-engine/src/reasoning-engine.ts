/**
 * Medical Reasoning Engine
 * 
 * A rule-based implementation that analyzes patient data to:
 * - Compute health scores (BMI, cardiac risk, etc.)
 * - Detect red flags requiring urgent attention
 * - Generate recommendations for education and follow-up
 */

import {
  IMedicalReasoningEngine,
  ReasoningContext,
  ReasoningResult,
  ReasoningScores,
  RedFlag
} from "./types";

export class MedicalReasoningEngine implements IMedicalReasoningEngine {
  async analyze(ctx: ReasoningContext): Promise<ReasoningResult> {
    const { state, input, memory, risk, screening } = ctx;

    const redFlags: RedFlag[] = [];
    const scores: ReasoningScores = {};
    const educationTopics: string[] = [];
    const screeningSuggestions: string[] = [];
    const followUpQuestions: string[] = [];
    const notes: string[] = [];

    // Extract profile from memory
    const profile = (memory?.profile || memory?.demographics || {}) as Record<string, unknown>;
    const weight = (profile.weightKg ?? profile.weight) as number | undefined;
    const height = (profile.heightM ?? profile.height) as number | undefined;

    // ---------------------------------------------------------------
    // BMI Analysis
    // ---------------------------------------------------------------
    if (weight && height && risk?.computeBMI) {
      const bmi = risk.computeBMI(weight, height);
      scores.bmi = bmi;
      notes.push(`BMI ≈ ${bmi.toFixed(1)}`);

      if (bmi >= 30) {
        educationTopics.push("weight management", "cardiometabolic risk");
      } else if (bmi >= 25) {
        educationTopics.push("healthy lifestyle and nutrition");
      }
    }

    // ---------------------------------------------------------------
    // Cardiovascular Analysis
    // ---------------------------------------------------------------
    const isCardioState = state.toLowerCase().includes("cardio");
    const hasCardioSymptoms = /chest|heart|palpitation/i.test(String(input));

    if (isCardioState || hasCardioSymptoms) {
      // Compute cardiac risk score
      if (risk?.computeChestPainRisk) {
        const cardioRisk = risk.computeChestPainRisk(String(input), memory);
        scores.cardioRisk = cardioRisk;

        if (cardioRisk >= 8) {
          redFlags.push({
            id: "cardio_high_risk",
            label: "High cardiac risk pattern",
            reason: "Chest symptoms + elevated risk factors",
            severity: "high"
          });
        } else if (cardioRisk >= 5) {
          educationTopics.push("chest pain red-flag symptoms");
        }
      }

      // Check for specific cardiovascular red flags
      if (screening?.detectCardioRedFlags) {
        const rf = screening.detectCardioRedFlags(String(input));
        if (rf) {
          redFlags.push({
            id: "cardio_red_flag",
            label: "Cardiovascular red flag",
            reason: rf,
            severity: "high"
          });
        }
      }
    }

    // ---------------------------------------------------------------
    // Respiratory Analysis
    // ---------------------------------------------------------------
    const isRespState = state.toLowerCase().includes("resp");
    const hasRespSymptoms = /cough|breath|wheeze/i.test(String(input));

    if (isRespState || hasRespSymptoms) {
      if (risk?.respiratorySeverityScore) {
        const severity = risk.respiratorySeverityScore(String(input));
        scores.respiratorySeverity = severity;

        if (severity >= 8) {
          redFlags.push({
            id: "resp_very_severe",
            label: "Severe respiratory symptoms",
            reason: "High severity score",
            severity: "high"
          });
        } else if (severity >= 5) {
          educationTopics.push("asthma/COPD management and triggers");
        }
      }
    }

    // ---------------------------------------------------------------
    // Depression Screening (PHQ-2)
    // ---------------------------------------------------------------
    const screenings = memory?.screenings as Record<string, unknown> | undefined;
    const phq2 = screenings?.phq2 as string[] | undefined;

    if (phq2 && Array.isArray(phq2)) {
      const score = phq2.reduce((sum: number, v: string) => {
        switch (v) {
          case "several days": return sum + 1;
          case "more than half the days": return sum + 2;
          case "nearly every day": return sum + 3;
          default: return sum;
        }
      }, 0);

      scores.depressionScore = score;

      if (score >= 3) {
        educationTopics.push("mental health support", "depression awareness");
        followUpQuestions.push(
          "Have these feelings impaired your sleep, appetite, or daily functioning?"
        );
      }
    }

    // ---------------------------------------------------------------
    // Preventive Screening Recommendations
    // ---------------------------------------------------------------
    const age = (profile.age_or_birthyear ?? profile.age) as number | undefined;
    const sex = (profile.sex_at_birth ?? profile.sex) as string | undefined;

    if (screening?.recommendScreenings && age) {
      const recommended = screening.recommendScreenings(age, sex || "");
      screeningSuggestions.push(...recommended);
    }

    // ---------------------------------------------------------------
    // Determine if escalation is needed
    // ---------------------------------------------------------------
    const hasHighRedFlag = redFlags.some(r => r.severity === "high");

    return {
      redFlags,
      scores,
      recommendations: {
        educationTopics,
        screeningSuggestions,
        followUpQuestions
      },
      notes,
      overrideNextState: hasHighRedFlag ? "ESCALATE" : undefined
    };
  }
}

