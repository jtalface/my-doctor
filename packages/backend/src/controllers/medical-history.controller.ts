import { ControllerContext, ControllerResult } from "../state/types";
import { BaseController } from "./base.controller";

/**
 * Medical History Controller
 * 
 * Extracts chronic conditions and medical history from user input.
 */

const COMMON_CONDITIONS = [
  "diabetes",
  "hypertension",
  "high blood pressure",
  "heart disease",
  "coronary artery disease",
  "atrial fibrillation",
  "heart failure",
  "asthma",
  "copd",
  "emphysema",
  "cancer",
  "stroke",
  "epilepsy",
  "seizures",
  "thyroid",
  "hypothyroid",
  "hyperthyroid",
  "arthritis",
  "rheumatoid",
  "osteoarthritis",
  "depression",
  "anxiety",
  "bipolar",
  "schizophrenia",
  "kidney disease",
  "liver disease",
  "hepatitis",
  "hiv",
  "aids",
  "lupus",
  "multiple sclerosis",
  "parkinson",
  "alzheimer",
  "dementia",
  "anemia",
  "sleep apnea",
  "gerd",
  "acid reflux",
  "ibs",
  "crohn",
  "colitis",
  "celiac",
  "gout",
  "osteoporosis",
  "fibromyalgia"
];

export class MedicalHistoryController extends BaseController {
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    const input = String(ctx.input).toLowerCase();
    const conditions: string[] = [];

    // Check for negation first
    if (this.hasNegation(input) && /\b(condition|disease|illness|problem)\b/i.test(input)) {
      return {
        extraData: {
          medicalHistory: {
            chronicConditions: [],
            noKnownConditions: true
          }
        }
      };
    }

    // Check for "none" or similar
    if (/^(none|no|n\/a|nothing|healthy)$/i.test(input.trim())) {
      return {
        extraData: {
          medicalHistory: {
            chronicConditions: [],
            noKnownConditions: true
          }
        }
      };
    }

    // Extract mentioned conditions
    for (const condition of COMMON_CONDITIONS) {
      if (input.includes(condition)) {
        conditions.push(this.normalizeCondition(condition));
      }
    }

    // Also extract any "diagnosed with X" patterns
    const diagnosedMatch = input.match(/diagnosed (?:with )?([a-z\s]+?)(?:\.|,|and|$)/gi);
    if (diagnosedMatch) {
      for (const match of diagnosedMatch) {
        const condition = match.replace(/diagnosed (?:with )?/i, "").trim();
        if (condition && !conditions.includes(condition)) {
          conditions.push(condition);
        }
      }
    }

    // Extract "I have X" patterns
    const haveMatch = input.match(/i (?:have|got|suffer from) ([a-z\s]+?)(?:\.|,|and|$)/gi);
    if (haveMatch) {
      for (const match of haveMatch) {
        const condition = match.replace(/i (?:have|got|suffer from) /i, "").trim();
        if (condition && condition.length > 2 && !conditions.includes(condition)) {
          conditions.push(condition);
        }
      }
    }

    if (conditions.length > 0 || /^(none|no|n\/a|nothing)$/i.test(input.trim())) {
      return {
        extraData: {
          medicalHistory: {
            chronicConditions: conditions,
            noKnownConditions: conditions.length === 0
          }
        }
      };
    }

    return null;
  }

  /**
   * Normalize condition names
   */
  private normalizeCondition(condition: string): string {
    const normalizations: Record<string, string> = {
      "high blood pressure": "hypertension",
      "heart attack": "myocardial infarction",
      "sugar diabetes": "diabetes",
      "copd": "COPD",
      "hiv": "HIV",
      "aids": "AIDS",
      "ibs": "IBS",
      "gerd": "GERD"
    };

    return normalizations[condition.toLowerCase()] || condition;
  }
}

