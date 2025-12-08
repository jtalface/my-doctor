import { ControllerContext, ControllerResult } from "../state/types";
import { BaseController } from "./base.controller";

/**
 * Medications Controller
 * 
 * Extracts medication information from user input.
 */

const COMMON_MEDICATIONS = [
  "aspirin",
  "ibuprofen",
  "advil",
  "tylenol",
  "acetaminophen",
  "metformin",
  "lisinopril",
  "amlodipine",
  "metoprolol",
  "atorvastatin",
  "lipitor",
  "omeprazole",
  "prilosec",
  "losartan",
  "albuterol",
  "gabapentin",
  "hydrochlorothiazide",
  "sertraline",
  "zoloft",
  "fluoxetine",
  "prozac",
  "levothyroxine",
  "synthroid",
  "prednisone",
  "insulin",
  "warfarin",
  "coumadin",
  "clopidogrel",
  "plavix",
  "pantoprazole",
  "montelukast",
  "singulair",
  "escitalopram",
  "lexapro",
  "duloxetine",
  "cymbalta",
  "trazodone",
  "alprazolam",
  "xanax",
  "lorazepam",
  "ativan",
  "furosemide",
  "lasix",
  "carvedilol",
  "potassium",
  "vitamin d",
  "vitamin b12",
  "multivitamin",
  "fish oil",
  "omega-3",
  "calcium",
  "magnesium",
  "iron",
  "probiotics"
];

export class MedicationsController extends BaseController {
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    const input = String(ctx.input).toLowerCase();
    const medications: Array<{ name: string; details?: string }> = [];

    // Check for negation
    if (/^(none|no|n\/a|nothing|not taking any)$/i.test(input.trim())) {
      return {
        extraData: {
          medications: [],
          noMedications: true
        }
      };
    }

    if (this.hasNegation(input) && /\b(medication|medicine|drug|pill|prescription)\b/i.test(input)) {
      return {
        extraData: {
          medications: [],
          noMedications: true
        }
      };
    }

    // Extract known medications
    for (const med of COMMON_MEDICATIONS) {
      if (input.includes(med.toLowerCase())) {
        // Try to extract dosage
        const dosagePattern = new RegExp(
          `${med}\\s*(\\d+\\s*(?:mg|mcg|g|ml|units?)?)?`,
          "i"
        );
        const match = input.match(dosagePattern);
        
        medications.push({
          name: med,
          details: match?.[1] || undefined
        });
      }
    }

    // Extract medication patterns like "taking X"
    const takingMatch = input.match(/taking\s+([a-z0-9\s,]+?)(?:\.|for|$)/gi);
    if (takingMatch) {
      for (const match of takingMatch) {
        const medString = match.replace(/taking\s+/i, "").trim();
        const meds = medString.split(/,|and/).map(m => m.trim());
        for (const med of meds) {
          if (med && med.length > 2 && !medications.some(m => m.name === med)) {
            medications.push({ name: med });
          }
        }
      }
    }

    // Extract "X mg" patterns
    const dosagePatterns = input.match(/([a-z]+)\s+(\d+)\s*(mg|mcg|g|ml|units?)/gi);
    if (dosagePatterns) {
      for (const match of dosagePatterns) {
        const parts = match.match(/([a-z]+)\s+(\d+)\s*(mg|mcg|g|ml|units?)/i);
        if (parts && !medications.some(m => m.name.toLowerCase() === parts[1].toLowerCase())) {
          medications.push({
            name: parts[1],
            details: `${parts[2]}${parts[3]}`
          });
        }
      }
    }

    if (medications.length > 0) {
      return {
        extraData: {
          medications,
          noMedications: false
        }
      };
    }

    return null;
  }

  async postprocess(
    ctx: ControllerContext & { llmResponse: string }
  ): Promise<ControllerResult | null> {
    // Check for potential drug interactions (simplified)
    const medications = (ctx.memory?.medications || []) as Array<{ name: string }>;
    
    if (medications.length >= 2) {
      const warnings = this.checkInteractions(medications);
      if (warnings.length > 0) {
        return {
          extraData: {
            medicationWarnings: warnings
          }
        };
      }
    }

    return null;
  }

  /**
   * Basic drug interaction checking (simplified)
   */
  private checkInteractions(medications: Array<{ name: string }>): string[] {
    const warnings: string[] = [];
    const medNames = medications.map(m => m.name.toLowerCase());

    // Blood thinners together
    const bloodThinners = ["warfarin", "coumadin", "aspirin", "clopidogrel", "plavix"];
    const userBloodThinners = medNames.filter(m => bloodThinners.includes(m));
    if (userBloodThinners.length >= 2) {
      warnings.push("Multiple blood thinners detected - discuss bleeding risk with your doctor");
    }

    // NSAIDs with blood thinners
    const nsaids = ["ibuprofen", "advil", "naproxen", "aleve"];
    if (medNames.some(m => nsaids.includes(m)) && medNames.some(m => bloodThinners.includes(m))) {
      warnings.push("NSAIDs with blood thinners may increase bleeding risk");
    }

    // Multiple sedatives
    const sedatives = ["alprazolam", "xanax", "lorazepam", "ativan", "trazodone", "ambien"];
    const userSedatives = medNames.filter(m => sedatives.includes(m));
    if (userSedatives.length >= 2) {
      warnings.push("Multiple sedatives detected - discuss with your doctor");
    }

    return warnings;
  }
}

