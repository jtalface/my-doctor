import { ControllerContext, ControllerResult } from "../state/types";
import { BaseController } from "./base.controller";

/**
 * Demographics Controller
 * 
 * Extracts age, sex, height, and weight from user input.
 */
export class DemographicsController extends BaseController {
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    const input = String(ctx.input);
    const extraData: Record<string, unknown> = {};

    // Parse age
    const age = this.parseAge(input);
    if (age !== null) {
      extraData.age = age;
    }

    // Parse sex
    const sex = this.parseSex(input);
    if (sex !== null) {
      extraData.sexAtBirth = sex;
    }

    // Parse height
    const height = this.parseHeight(input);
    if (height !== null) {
      extraData.heightM = height;
    }

    // Parse weight
    const weight = this.parseWeight(input);
    if (weight !== null) {
      extraData.weightKg = weight;
    }

    // If we extracted nothing, check if user is declining
    if (Object.keys(extraData).length === 0) {
      if (/\b(prefer not|rather not|skip|private)\b/i.test(input)) {
        extraData.declined = true;
      }
    }

    // Check if we're missing required info
    const memoryDemographics = ctx.memory?.demographics as Record<string, unknown> | undefined;
    const existingAge = memoryDemographics?.age || ctx.memory?.age;
    const missingAge = !age && !existingAge;

    if (Object.keys(extraData).length > 0) {
      return {
        extraData: { demographics: extraData }
      };
    }

    // If missing age and user didn't provide, signal to ask again
    if (missingAge && !extraData.declined) {
      return {
        extraData: { demographics: { needsAge: true } }
      };
    }

    return null;
  }

  async postprocess(
    ctx: ControllerContext & { llmResponse: string }
  ): Promise<ControllerResult | null> {
    // Calculate BMI if we have both height and weight
    const demographics = ctx.memory?.demographics as Record<string, unknown> | undefined;
    const height = demographics?.heightM as number | undefined;
    const weight = demographics?.weightKg as number | undefined;

    if (height && weight) {
      const bmi = ctx.risk.computeBMI(weight, height);
      return {
        extraData: {
          demographics: {
            ...demographics,
            bmi
          }
        }
      };
    }

    return null;
  }
}

