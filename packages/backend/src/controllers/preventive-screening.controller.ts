import { ControllerContext, ControllerResult } from "../state/types";
import { BaseController } from "./base.controller";

/**
 * Preventive Screening Controller
 * 
 * Generates preventive screening recommendations based on patient demographics.
 */
export class PreventiveScreeningController extends BaseController {
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    // Get demographics from memory
    const demographics = ctx.memory?.demographics as Record<string, unknown> | undefined;
    const age = demographics?.age as number | undefined;
    const sex = demographics?.sexAtBirth as string | undefined;

    if (!age) {
      return {
        extraData: {
          screeningRecommendations: {
            error: "Age not available for screening recommendations"
          }
        }
      };
    }

    // Get basic recommendations
    const recommendations = ctx.screening.recommendScreenings(age, sex || "");

    // Get risk factors from memory
    const riskFactors: string[] = [];
    
    // Smoking
    const socialHistory = ctx.memory?.socialHistory as Record<string, unknown> | undefined;
    if (socialHistory?.smoking === "current") {
      riskFactors.push("smoker");
    } else if (socialHistory?.smoking === "former") {
      riskFactors.push("former_smoker");
    }

    // BMI
    const bmi = demographics?.bmi as number | undefined;
    if (bmi && bmi >= 25) {
      riskFactors.push("overweight");
    }
    if (bmi && bmi >= 30) {
      riskFactors.push("obese");
    }

    // Family history (if captured)
    const familyHistory = ctx.memory?.familyHistory as Record<string, unknown> | undefined;
    if (familyHistory?.heartDisease) {
      riskFactors.push("family_history_heart");
    }
    if (familyHistory?.cancer) {
      riskFactors.push("family_history_cancer");
    }

    return {
      extraData: {
        screeningRecommendations: {
          age,
          sex,
          riskFactors,
          recommendations,
          generatedAt: new Date().toISOString()
        }
      }
    };
  }

  async postprocess(
    ctx: ControllerContext & { llmResponse: string }
  ): Promise<ControllerResult | null> {
    const screeningData = ctx.memory?.screeningRecommendations as Record<string, unknown> | undefined;
    
    if (screeningData?.recommendations) {
      const recommendations = screeningData.recommendations as string[];
      
      if (recommendations.length > 0) {
        const recommendationList = recommendations
          .map((r, i) => `${i + 1}. ${r}`)
          .join("\n");

        return {
          overrideResponse: `Based on your age (${screeningData.age}) and health profile, here are recommended preventive screenings to discuss with your healthcare provider:\n\n${recommendationList}\n\nRemember, these are general guidelines. Your doctor may recommend different screenings based on your individual health history.`
        };
      }
    }

    return null;
  }
}

