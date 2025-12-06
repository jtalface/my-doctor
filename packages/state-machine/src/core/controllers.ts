/**
 * Node Controllers
 * 
 * Controllers provide hooks for custom logic at specific nodes in the state machine.
 * Each controller can implement:
 * - `preprocess`: Runs before the LLM call to modify input or extract data
 * - `postprocess`: Runs after the LLM call to modify the response or override next state
 */

// ============================================
// Types & Interfaces
// ============================================

/**
 * Context provided to controller methods
 */
export interface NodeControllerContext {
  /** Current user ID */
  userId: string;
  /** Current session ID */
  sessionId: string;
  /** Current state machine state */
  state: string;
  /** User input for this node */
  input: unknown;
  /** Session memory/context */
  memory: Record<string, unknown>;
  /** Risk calculation utilities */
  risk: RiskUtils;
  /** Screening logic utilities */
  screening: ScreeningUtils;
}

/**
 * Result returned from controller methods
 */
export interface NodeControllerResult {
  /** Modified input to pass to LLM */
  modifiedInput?: unknown;
  /** Extra data to store in context */
  extraData?: Record<string, unknown>;
  /** Override the LLM response entirely */
  overrideResponse?: string;
  /** Override the next state transition */
  overrideNextState?: string;
}

/**
 * Interface for node controllers
 */
export interface NodeController {
  /** Called before LLM processing */
  preprocess?(ctx: NodeControllerContext): Promise<NodeControllerResult | null>;
  /** Called after LLM processing */
  postprocess?(ctx: NodeControllerContext & { llmResponse: string; extraData?: Record<string, unknown> }): Promise<NodeControllerResult | null>;
}

/**
 * Risk calculation utilities interface
 */
export interface RiskUtils {
  computeChestPainRisk?(text: string, memory: Record<string, unknown>): number;
  respiratorySeverityScore?(input: unknown): number;
}

/**
 * Screening logic utilities interface
 */
export interface ScreeningUtils {
  detectCardioRedFlags?(text: string): string | null;
  recommendScreenings?(age: number, sex: string): string[];
}

// ============================================
// Controller Implementations
// ============================================

/**
 * Demographics Controller
 * 
 * Normalizes age input and adds age-specific messaging for older patients.
 */
export class DemographicsController implements NodeController {
  async preprocess(ctx: NodeControllerContext): Promise<NodeControllerResult | null> {
    const input = ctx.input;
    const inputStr = typeof input === "string" ? input : "";
    const ageMatch = inputStr.replace(/\D+/g, "");
    const age = ageMatch ? parseInt(ageMatch, 10) : null;

    return {
      modifiedInput: { 
        ...(typeof input === "object" ? input : {}), 
        normalizedAge: age !== null && !isNaN(age) ? age : null 
      }
    };
  }

  async postprocess(ctx: NodeControllerContext & { llmResponse: string }): Promise<NodeControllerResult | null> {
    const demographics = ctx.memory?.demographics as Record<string, unknown> | undefined;
    const age = demographics?.age_or_birthyear as number | undefined;
    
    if (age && age > 60) {
      return {
        overrideResponse:
          ctx.llmResponse +
          "\n\nSince you are over 60, certain screenings become especially important. I'll check them shortly."
      };
    }
    return null;
  }
}

/**
 * Medical History Controller
 * 
 * Detects chronic conditions from free-text input.
 */
export class MedicalHistoryController implements NodeController {
  private chronicFlags: Record<string, RegExp> = {
    diabetes: /diabet/i,
    hypertension: /(high blood pressure|hypertens)/i,
    asthma: /asthma|wheeze/i
  };

  async preprocess(ctx: NodeControllerContext): Promise<NodeControllerResult | null> {
    const text = String(ctx.input).toLowerCase();
    const problems: string[] = [];

    for (const [key, pattern] of Object.entries(this.chronicFlags)) {
      if (pattern.test(text)) {
        problems.push(key);
      }
    }

    return { extraData: { detectedProblems: problems } };
  }
}

/**
 * Medications Controller
 * 
 * Parses medication list from comma or newline-separated input.
 */
export class MedicationsController implements NodeController {
  async preprocess(ctx: NodeControllerContext): Promise<NodeControllerResult | null> {
    if (typeof ctx.input !== "string") return null;

    const meds = ctx.input
      .split(/[,\n]/)
      .map(x => x.trim())
      .filter(Boolean);

    return { extraData: { parsedMedications: meds } };
  }
}

/**
 * Systems Review Controller
 * 
 * Normalizes yes/no answers for systems review questions.
 */
export class SystemsReviewController implements NodeController {
  async preprocess(ctx: NodeControllerContext): Promise<NodeControllerResult | null> {
    const answer = String(ctx.input).trim().toLowerCase();
    return {
      extraData: { answeredYes: ["yes", "y"].includes(answer) }
    };
  }
}

/**
 * Cardio Symptoms Controller
 * 
 * Detects cardiac red flags and computes risk scores.
 * Can escalate to urgent care if red flags are detected.
 */
export class CardioSymptomsController implements NodeController {
  async preprocess(ctx: NodeControllerContext): Promise<NodeControllerResult | null> {
    const text = String(ctx.input).toLowerCase();

    const redFlag = ctx.screening?.detectCardioRedFlags?.(text);
    const riskScore = ctx.risk?.computeChestPainRisk?.(text, ctx.memory);

    if (redFlag) {
      return {
        overrideNextState: "ESCALATE",
        extraData: { cardioRedFlag: redFlag, riskScore },
        overrideResponse: `I detected symptoms that may require urgent evaluation: ${redFlag}.`
      };
    }

    return { extraData: { cardiacRiskScore: riskScore } };
  }

  async postprocess(ctx: NodeControllerContext & { llmResponse: string; extraData?: Record<string, unknown> }): Promise<NodeControllerResult | null> {
    const riskScore = ctx.extraData?.cardiacRiskScore as number | undefined;
    
    if (riskScore !== undefined && riskScore >= 7) {
      return {
        overrideResponse:
          ctx.llmResponse +
          "\n\nYour symptoms indicate a higher-than-average cardiac risk. I will follow with a few safety questions."
      };
    }
    return null;
  }
}

/**
 * Respiratory Controller
 * 
 * Evaluates respiratory symptom severity and escalates if critical.
 */
export class RespiratoryController implements NodeController {
  async preprocess(ctx: NodeControllerContext): Promise<NodeControllerResult | null> {
    const severity = ctx.risk?.respiratorySeverityScore?.(ctx.input);

    if (severity !== undefined && severity > 8) {
      return {
        overrideNextState: "ESCALATE",
        overrideResponse:
          "Your respiratory symptoms sound severe. I recommend urgent in-person evaluation."
      };
    }

    return { extraData: { respiratorySeverity: severity } };
  }
}

/**
 * Preventive Screening Controller
 * 
 * Generates age and sex-appropriate screening recommendations.
 */
export class PreventiveScreeningController implements NodeController {
  async preprocess(ctx: NodeControllerContext): Promise<NodeControllerResult | null> {
    const demographics = ctx.memory?.demographics as Record<string, unknown> | undefined;
    const age = demographics?.age_or_birthyear as number | undefined;
    const sex = demographics?.sex_at_birth as string | undefined;

    const checklist = ctx.screening?.recommendScreenings?.(age ?? 0, sex ?? "") || [];

    return { extraData: { recommendedScreenings: checklist } };
  }

  async postprocess(ctx: NodeControllerContext & { llmResponse: string; extraData?: Record<string, unknown> }): Promise<NodeControllerResult | null> {
    const list = (ctx.extraData?.recommendedScreenings as string[]) || [];
    if (!list.length) return null;

    const formatted = list.map(x => `• ${x}`).join("\n");

    return {
      overrideResponse:
        ctx.llmResponse +
        `\n\nBased on your profile, here are screenings commonly recommended:\n${formatted}`
    };
  }
}

/**
 * Summary Controller
 * 
 * Prepares session summary and adds disclaimer to output.
 */
export class SummaryController implements NodeController {
  async preprocess(ctx: NodeControllerContext): Promise<NodeControllerResult | null> {
    return { extraData: { summaryData: ctx.memory } };
  }

  async postprocess(ctx: NodeControllerContext & { llmResponse: string }): Promise<NodeControllerResult | null> {
    return {
      overrideResponse:
        ctx.llmResponse +
        "\n\nThis summary is educational and not diagnostic. Please consult a clinician for any concerns."
    };
  }
}


