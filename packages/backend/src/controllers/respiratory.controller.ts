import { ControllerContext, ControllerResult } from "../state/types";
import { BaseController } from "./base.controller";

/**
 * Respiratory Controller
 * 
 * Evaluates respiratory symptoms for severity and red flags.
 */
export class RespiratoryController extends BaseController {
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    const input = String(ctx.input);
    const symptoms: Record<string, unknown> = {};
    const redFlags: string[] = [];

    // Dyspnea severity
    if (/can't.*breathe|unable.*breathe|gasping|suffocating/i.test(input)) {
      symptoms.dyspneaSeverity = "severe";
      redFlags.push("severe_dyspnea");
    } else if (/very.*short.*breath|significant.*difficulty/i.test(input)) {
      symptoms.dyspneaSeverity = "moderate";
    } else if (/mild.*short.*breath|little.*difficulty/i.test(input)) {
      symptoms.dyspneaSeverity = "mild";
    }

    // At rest vs exertional
    if (/at rest|sitting|lying|not.*moving|even.*when.*still/i.test(input)) {
      symptoms.atRest = true;
      redFlags.push("dyspnea_at_rest");
    }
    if (/walk|stair|exert|exercise|activity/i.test(input)) {
      symptoms.exertional = true;
    }

    // Cough characteristics
    if (/cough/i.test(input)) {
      symptoms.cough = true;
      
      if (/dry.*cough|non.*productive/i.test(input)) {
        symptoms.coughType = "dry";
      } else if (/wet.*cough|productive|phlegm|mucus|sputum/i.test(input)) {
        symptoms.coughType = "productive";
        
        // Sputum color
        if (/green|yellow/i.test(input)) {
          symptoms.sputumColor = "purulent";
        } else if (/blood|red|pink.*frothy/i.test(input)) {
          symptoms.sputumColor = "bloody";
          redFlags.push("hemoptysis");
        } else if (/clear|white/i.test(input)) {
          symptoms.sputumColor = "mucoid";
        }
      }
    }

    // Hemoptysis
    if (/cough.*blood|blood.*cough|hemoptysis/i.test(input)) {
      symptoms.hemoptysis = true;
      redFlags.push("hemoptysis");
    }

    // Wheezing
    if (/wheez/i.test(input)) {
      symptoms.wheezing = true;
    }

    // Stridor (upper airway)
    if (/stridor|noisy.*breath.*in|high.*pitch.*breath/i.test(input)) {
      symptoms.stridor = true;
      redFlags.push("stridor");
    }

    // Cyanosis
    if (/blue.*lips|blue.*fingernails|cyanosis|turning.*blue/i.test(input)) {
      symptoms.cyanosis = true;
      redFlags.push("cyanosis");
    }

    // Duration
    if (/days|week|month|chronic|long.*time/i.test(input)) {
      symptoms.duration = "chronic";
    } else if (/today|yesterday|just.*started|hour/i.test(input)) {
      symptoms.duration = "acute";
    }

    // Fever
    if (/fever|temperature|chills/i.test(input)) {
      symptoms.fever = true;
    }

    // Altered mental status
    if (/confus|drowsy|can't.*stay.*awake|altered|not.*thinking.*clearly/i.test(input)) {
      symptoms.alteredMentalStatus = true;
      redFlags.push("altered_mental_status");
    }

    // Calculate severity score
    const severityScore = ctx.risk.respiratorySeverityScore(input);

    // Check for critical red flags
    const respRedFlag = ctx.screening.detectRespiratoryRedFlags(input);
    if (respRedFlag) {
      redFlags.push("critical_pattern");
    }

    // Determine if urgent
    const isUrgent = redFlags.length >= 2 ||
                     severityScore >= 8 ||
                     respRedFlag !== null ||
                     symptoms.cyanosis ||
                     symptoms.alteredMentalStatus;

    return {
      extraData: {
        respiratorySymptoms: {
          symptoms,
          redFlags,
          severityScore,
          criticalRedFlag: respRedFlag,
          isUrgent,
          evaluatedAt: new Date().toISOString()
        }
      },
      overrideNextState: isUrgent ? "URGENT_RESPIRATORY" : undefined
    };
  }

  async postprocess(
    ctx: ControllerContext & { llmResponse: string }
  ): Promise<ControllerResult | null> {
    const respData = ctx.memory?.respiratorySymptoms as Record<string, unknown> | undefined;
    
    if (respData?.isUrgent) {
      return {
        overrideResponse: `⚠️ IMPORTANT: Your breathing symptoms sound serious. Please seek immediate medical attention. If you're having severe difficulty breathing, call 911 now.\n\n${ctx.llmResponse}`
      };
    }

    return null;
  }
}

