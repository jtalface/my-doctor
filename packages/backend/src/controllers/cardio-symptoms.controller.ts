import { ControllerContext, ControllerResult } from "../state/types";
import { BaseController } from "./base.controller";

/**
 * Cardio Symptoms Controller
 * 
 * Evaluates cardiovascular symptoms for red flags and risk scoring.
 */
export class CardioSymptomsController extends BaseController {
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    const input = String(ctx.input);
    const symptoms: Record<string, unknown> = {};
    const redFlags: string[] = [];

    // Location
    if (/central|substernal|behind.*sternum|middle.*chest/i.test(input)) {
      symptoms.location = "central/substernal";
    } else if (/left.*chest|left.*side/i.test(input)) {
      symptoms.location = "left chest";
    } else if (/right.*chest|right.*side/i.test(input)) {
      symptoms.location = "right chest";
    }

    // Quality/character
    if (/crush|squeez|pressure|tight|heavy|elephant/i.test(input)) {
      symptoms.quality = "pressure/crushing";
      redFlags.push("pressure_character");
    } else if (/sharp|stabbing|knife/i.test(input)) {
      symptoms.quality = "sharp/stabbing";
    } else if (/burn|aching|dull/i.test(input)) {
      symptoms.quality = "burning/aching";
    }

    // Radiation
    if (/radiat|spread|arm|jaw|neck|back|shoulder/i.test(input)) {
      symptoms.radiation = true;
      const radiationSites: string[] = [];
      if (/arm/i.test(input)) radiationSites.push("arm");
      if (/jaw/i.test(input)) radiationSites.push("jaw");
      if (/neck/i.test(input)) radiationSites.push("neck");
      if (/back/i.test(input)) radiationSites.push("back");
      if (/shoulder/i.test(input)) radiationSites.push("shoulder");
      symptoms.radiationSites = radiationSites;
      redFlags.push("radiation");
    }

    // Associated symptoms
    if (/sweat|diaphores/i.test(input)) {
      symptoms.diaphoresis = true;
      redFlags.push("diaphoresis");
    }
    if (/nausea|vomit/i.test(input)) {
      symptoms.nausea = true;
      redFlags.push("nausea");
    }
    if (/short.*breath|dyspnea|breathless|can't.*catch.*breath/i.test(input)) {
      symptoms.dyspnea = true;
      redFlags.push("dyspnea");
    }
    if (/dizz|lightheaded|faint|syncope/i.test(input)) {
      symptoms.dizziness = true;
      redFlags.push("presyncope");
    }
    if (/palpitat|racing|irregular|skipping/i.test(input)) {
      symptoms.palpitations = true;
    }

    // Duration
    if (/second|momentary|brief/i.test(input)) {
      symptoms.duration = "seconds";
    } else if (/minute|few min/i.test(input)) {
      symptoms.duration = "minutes";
    } else if (/hour|all day|ongoing|constant/i.test(input)) {
      symptoms.duration = "hours/ongoing";
      redFlags.push("prolonged_duration");
    }

    // Onset
    if (/sudden|abrupt|came.*on.*fast|out.*of.*nowhere/i.test(input)) {
      symptoms.onset = "sudden";
      redFlags.push("sudden_onset");
    } else if (/gradual|slowly|been.*building/i.test(input)) {
      symptoms.onset = "gradual";
    }

    // Exertional
    if (/exert|exercise|walk|stair|activity|physical/i.test(input)) {
      symptoms.exertional = true;
      redFlags.push("exertional");
    }

    // Calculate risk using service
    const riskScore = ctx.risk.computeChestPainRisk(input, ctx.memory);

    // Check for immediate red flags
    const cardioRedFlag = ctx.screening.detectCardioRedFlags(input);
    if (cardioRedFlag) {
      redFlags.push("critical_pattern");
    }

    // Determine if urgent escalation needed
    const isUrgent = redFlags.length >= 3 || 
                     riskScore >= 8 || 
                     cardioRedFlag !== null ||
                     /severe|worst|can't.*breathe|crushing.*pain/i.test(input);

    return {
      extraData: {
        cardioSymptoms: {
          symptoms,
          redFlags,
          riskScore,
          criticalRedFlag: cardioRedFlag,
          isUrgent,
          evaluatedAt: new Date().toISOString()
        }
      },
      overrideNextState: isUrgent ? "URGENT_CARDIO" : undefined
    };
  }

  async postprocess(
    ctx: ControllerContext & { llmResponse: string }
  ): Promise<ControllerResult | null> {
    // Add safety reminder to response if concerning symptoms
    const cardioData = ctx.memory?.cardioSymptoms as Record<string, unknown> | undefined;
    
    if (cardioData?.isUrgent) {
      return {
        overrideResponse: `⚠️ IMPORTANT: Based on what you've described, I'm concerned about your symptoms. Please seek immediate medical evaluation. If you're having severe chest pain, call 911 now.\n\n${ctx.llmResponse}`
      };
    }

    return null;
  }
}

