import { ControllerContext, ControllerResult } from "../state/types";
import { BaseController } from "./base.controller";

/**
 * Summary Controller
 * 
 * Generates a summary of the health check-in session.
 */
export class SummaryController extends BaseController {
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    const summary = this.buildSummary(ctx.memory);

    return {
      extraData: {
        sessionSummary: summary
      }
    };
  }

  async postprocess(
    ctx: ControllerContext & { llmResponse: string }
  ): Promise<ControllerResult | null> {
    const summary = ctx.memory?.sessionSummary as Record<string, unknown> | undefined;
    
    if (summary) {
      const formattedSummary = this.formatSummary(summary);
      return {
        overrideResponse: formattedSummary
      };
    }

    return null;
  }

  /**
   * Build summary from session memory
   */
  private buildSummary(memory: Record<string, unknown>): Record<string, unknown> {
    const summary: Record<string, unknown> = {
      generatedAt: new Date().toISOString()
    };

    // Demographics
    const demographics = memory?.demographics as Record<string, unknown> | undefined;
    if (demographics) {
      summary.demographics = {
        age: demographics.age,
        sex: demographics.sexAtBirth,
        bmi: demographics.bmi
      };
    }

    // Medical history
    const medHistory = memory?.medicalHistory as Record<string, unknown> | undefined;
    if (medHistory) {
      summary.chronicConditions = medHistory.chronicConditions || [];
    }

    // Medications
    const medications = memory?.medications as unknown[] | undefined;
    if (medications) {
      summary.medications = medications;
    }

    // Symptoms reviewed
    const symptoms: string[] = [];
    
    if (memory?.cardioSymptoms) {
      symptoms.push("Cardiovascular");
      summary.cardioEvaluation = memory.cardioSymptoms;
    }
    if (memory?.respiratorySymptoms) {
      symptoms.push("Respiratory");
      summary.respiratoryEvaluation = memory.respiratorySymptoms;
    }
    if (memory?.systemsReview) {
      const systemsReview = memory.systemsReview as Record<string, unknown>;
      summary.systemsReviewed = systemsReview.affectedSystems || [];
    }

    summary.symptomsReviewed = symptoms;

    // Red flags identified
    const redFlags: string[] = [];
    
    const cardioData = memory?.cardioSymptoms as Record<string, unknown> | undefined;
    if (cardioData?.redFlags) {
      redFlags.push(...(cardioData.redFlags as string[]));
    }
    
    const respData = memory?.respiratorySymptoms as Record<string, unknown> | undefined;
    if (respData?.redFlags) {
      redFlags.push(...(respData.redFlags as string[]));
    }

    summary.redFlagsIdentified = redFlags;
    summary.hasRedFlags = redFlags.length > 0;

    // Screening recommendations
    const screeningData = memory?.screeningRecommendations as Record<string, unknown> | undefined;
    if (screeningData?.recommendations) {
      summary.screeningRecommendations = screeningData.recommendations;
    }

    // Risk scores
    const riskScores: Record<string, number> = {};
    if (cardioData?.riskScore !== undefined) {
      riskScores.cardiovascular = cardioData.riskScore as number;
    }
    if (respData?.severityScore !== undefined) {
      riskScores.respiratory = respData.severityScore as number;
    }
    if (demographics?.bmi !== undefined) {
      riskScores.bmi = demographics.bmi as number;
    }
    
    if (Object.keys(riskScores).length > 0) {
      summary.riskScores = riskScores;
    }

    return summary;
  }

  /**
   * Format summary for display
   */
  private formatSummary(summary: Record<string, unknown>): string {
    const sections: string[] = [];

    sections.push("📋 **Health Check-in Summary**\n");

    // Demographics
    const demographics = summary.demographics as Record<string, unknown> | undefined;
    if (demographics) {
      let demoLine = "**Basic Info:** ";
      if (demographics.age) demoLine += `Age ${demographics.age}`;
      if (demographics.sex) demoLine += `, ${demographics.sex}`;
      if (demographics.bmi) demoLine += `, BMI ${(demographics.bmi as number).toFixed(1)}`;
      sections.push(demoLine);
    }

    // Conditions
    const conditions = summary.chronicConditions as string[] | undefined;
    if (conditions && conditions.length > 0) {
      sections.push(`\n**Medical Conditions:** ${conditions.join(", ")}`);
    }

    // Medications
    const medications = summary.medications as Array<{ name: string }> | undefined;
    if (medications && medications.length > 0) {
      sections.push(`\n**Medications:** ${medications.map(m => m.name).join(", ")}`);
    }

    // Symptoms reviewed
    const symptomsReviewed = summary.symptomsReviewed as string[] | undefined;
    if (symptomsReviewed && symptomsReviewed.length > 0) {
      sections.push(`\n**Systems Reviewed:** ${symptomsReviewed.join(", ")}`);
    }

    // Red flags
    if (summary.hasRedFlags) {
      sections.push("\n⚠️ **Important Findings:**");
      const redFlags = summary.redFlagsIdentified as string[] | undefined;
      if (redFlags) {
        sections.push(redFlags.map(rf => `  • ${rf.replace(/_/g, " ")}`).join("\n"));
      }
    }

    // Risk scores
    const riskScores = summary.riskScores as Record<string, number> | undefined;
    if (riskScores && Object.keys(riskScores).length > 0) {
      sections.push("\n**Risk Scores:**");
      for (const [key, value] of Object.entries(riskScores)) {
        if (key === "bmi") {
          sections.push(`  • BMI: ${value.toFixed(1)}`);
        } else {
          sections.push(`  • ${key}: ${value}/10`);
        }
      }
    }

    // Screening recommendations
    const screenings = summary.screeningRecommendations as string[] | undefined;
    if (screenings && screenings.length > 0) {
      sections.push("\n**Recommended Screenings:**");
      screenings.slice(0, 5).forEach(s => {
        sections.push(`  • ${s}`);
      });
    }

    // Footer
    sections.push("\n---");
    sections.push("*This summary is for educational purposes only. Please consult your healthcare provider for medical advice.*");

    return sections.join("\n");
  }
}

