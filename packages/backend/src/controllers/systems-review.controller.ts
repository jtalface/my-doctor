import { ControllerContext, ControllerResult } from "../state/types";
import { BaseController } from "./base.controller";

/**
 * Systems Review Controller
 * 
 * Handles the review of systems to identify symptom categories.
 */
export class SystemsReviewController extends BaseController {
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    const input = String(ctx.input).toLowerCase();
    
    const systemFlags = {
      constitutional: false,
      cardiovascular: false,
      respiratory: false,
      gastrointestinal: false,
      musculoskeletal: false,
      neurological: false,
      psychiatric: false,
      dermatologic: false,
      genitourinary: false,
      endocrine: false
    };

    // Constitutional (general)
    if (/\b(fever|chills|fatigue|tired|weight loss|weight gain|sweats|weakness)\b/i.test(input)) {
      systemFlags.constitutional = true;
    }

    // Cardiovascular
    if (/\b(chest|heart|palpitation|racing|irregular|edema|swelling.*leg|shortness.*breath)\b/i.test(input)) {
      systemFlags.cardiovascular = true;
    }

    // Respiratory
    if (/\b(cough|wheeze|breath|respiratory|asthma|copd|phlegm|mucus|congestion)\b/i.test(input)) {
      systemFlags.respiratory = true;
    }

    // Gastrointestinal
    if (/\b(nausea|vomit|diarrhea|constipation|abdominal|stomach|heartburn|reflux|bloating)\b/i.test(input)) {
      systemFlags.gastrointestinal = true;
    }

    // Musculoskeletal
    if (/\b(joint|muscle|back|pain|stiff|arthritis|ache|sore)\b/i.test(input)) {
      systemFlags.musculoskeletal = true;
    }

    // Neurological
    if (/\b(headache|dizz|numb|tingling|seizure|tremor|balance|memory|confusion)\b/i.test(input)) {
      systemFlags.neurological = true;
    }

    // Psychiatric
    if (/\b(depress|anxiety|stress|sleep|insomnia|mood|panic|worry)\b/i.test(input)) {
      systemFlags.psychiatric = true;
    }

    // Dermatologic
    if (/\b(rash|itch|skin|hives|lesion|mole|acne|eczema|psoriasis)\b/i.test(input)) {
      systemFlags.dermatologic = true;
    }

    // Genitourinary
    if (/\b(urin|bladder|kidney|sexual|menstrual|period|discharge)\b/i.test(input)) {
      systemFlags.genitourinary = true;
    }

    // Endocrine
    if (/\b(thyroid|diabetes|hormone|thirst|hungry|metabolism)\b/i.test(input)) {
      systemFlags.endocrine = true;
    }

    const affectedSystems = Object.entries(systemFlags)
      .filter(([, value]) => value)
      .map(([key]) => key);

    return {
      extraData: {
        systemsReview: {
          affectedSystems,
          hasSymptoms: affectedSystems.length > 0,
          reviewedAt: new Date().toISOString()
        }
      }
    };
  }
}

