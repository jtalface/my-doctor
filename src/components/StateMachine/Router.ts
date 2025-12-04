import { State } from "./types/states";

/**
 * Router determines the next state based on user input.
 * Uses simple rule-based matching as initial implementation.
 */
export class Router {
  /**
   * Determines the next state based on current state and user input.
   */
  async nextState(current: State, userInput: string): Promise<State> {
    const input = userInput.toLowerCase().trim();

    // Escalation patterns - high priority symptoms
    if (/chest|pain|faint|breath|shortness|emergency/i.test(userInput)) {
      return State.ESCALATE;
    }

    // State-specific routing
    switch (current) {
      case State.START:
        if (/yes/i.test(input)) return State.AGENDA;
        if (/no/i.test(input)) return State.EPHEMERAL_CONSENT;
        if (/privacy|ask/i.test(input)) return State.PRIVACY_SUMMARY;
        return State.EPHEMERAL_CONSENT;

      case State.PRIVACY_SUMMARY:
        if (/yes/i.test(input)) return State.AGENDA;
        return State.EPHEMERAL_CONSENT;

      case State.EPHEMERAL_CONSENT:
        if (/yes/i.test(input)) return State.AGENDA;
        return State.END_NOSESSION;

      case State.AGENDA:
        return State.DEMOGRAPHICS;

      case State.DEMOGRAPHICS:
        return State.MEDICAL_HISTORY;

      case State.DEMOGRAPHICS_ASKAGE:
        return State.MEDICAL_HISTORY;

      case State.MEDICAL_HISTORY:
        if (this.hasConditions(input)) return State.MED_HISTORY_FOLLOWUP;
        return State.MEDICATIONS;

      case State.MED_HISTORY_FOLLOWUP:
        return State.MEDICATIONS;

      case State.MEDICATIONS:
        return State.ALLERGIES;

      case State.ALLERGIES:
        return State.SOCIAL_HISTORY;

      case State.SOCIAL_HISTORY:
        return State.SYSTEMS_REVIEW_INTRO;

      case State.SYSTEMS_REVIEW_INTRO:
        return State.SYSTEMS_CARDIO;

      case State.SYSTEMS_CARDIO:
        if (this.hasSymptoms(input)) return State.SYSTEMS_CARDIO_FOLLOWUP;
        return State.SYSTEMS_RESP;

      case State.SYSTEMS_CARDIO_FOLLOWUP:
        return State.SYSTEMS_RESP;

      case State.SYSTEMS_RESP:
        if (this.hasSymptoms(input)) return State.SYSTEMS_RESP_FOLLOWUP;
        return State.SYSTEMS_GI;

      case State.SYSTEMS_RESP_FOLLOWUP:
        return State.SYSTEMS_GI;

      case State.SYSTEMS_GI:
        return State.SYSTEMS_NEURO;

      case State.SYSTEMS_NEURO:
        return State.SYSTEMS_MSK;

      case State.SYSTEMS_MSK:
        return State.SYSTEMS_PSYCH;

      case State.SYSTEMS_PSYCH:
        if (this.needsPHQ2(input)) return State.PHQ2;
        return State.PREVENTIVE_SCREENINGS;

      case State.PHQ2:
        return State.PHQ2_Q2;

      case State.PHQ2_Q2:
        return State.PREVENTIVE_SCREENINGS;

      case State.PREVENTIVE_SCREENINGS:
        return State.PREVENTIVE_CHECKLIST;

      case State.PREVENTIVE_CHECKLIST:
        return State.VACCINATIONS;

      case State.PREVENTIVE_LIPIDS:
        return State.PREVENTIVE_DIABETES;

      case State.PREVENTIVE_DIABETES:
        return State.VACCINATIONS;

      case State.VACCINATIONS:
        return State.SUMMARY_PLAN;

      case State.SUMMARY_PLAN:
        return State.SAVING_AND_REMINDERS;

      case State.SAVING_AND_REMINDERS:
        if (/yes/i.test(input)) return State.SAVING;
        return State.END_OK;

      case State.SAVING:
        return State.END_OK;

      case State.ESCALATE:
        return State.ESCALATE_SUMMARY;

      case State.ESCALATE_SUMMARY:
        return State.END_ESCALATED;

      // Legacy states (original flow)
      case State.GREET:
        return State.COLLECT_BASIC_INFO;

      case State.COLLECT_BASIC_INFO:
        return State.SCREENING;

      case State.SCREENING:
        return State.WELLNESS_EDUCATION;

      case State.WELLNESS_EDUCATION:
        return State.FOLLOW_UP;

      case State.FOLLOW_UP:
        return State.END;

      default:
        return State.END;
    }
  }

  private hasConditions(input: string): boolean {
    const conditionKeywords = [
      "diabetes", "hypertension", "heart", "asthma", "cancer",
      "surgery", "chronic", "condition", "disease", "diagnosed"
    ];
    return conditionKeywords.some(keyword => input.toLowerCase().includes(keyword));
  }

  private hasSymptoms(input: string): boolean {
    const negativePatterns = /\b(no|none|nope|not really|nothing|never)\b/i;
    if (negativePatterns.test(input)) return false;
    
    const symptomKeywords = [
      "yes", "pain", "ache", "discomfort", "trouble", "difficulty",
      "sometimes", "often", "frequently", "always"
    ];
    return symptomKeywords.some(keyword => input.toLowerCase().includes(keyword));
  }

  private needsPHQ2(input: string): boolean {
    const moodKeywords = [
      "depressed", "sad", "anxious", "worried", "stressed",
      "can't sleep", "insomnia", "low mood", "hopeless"
    ];
    return moodKeywords.some(keyword => input.toLowerCase().includes(keyword));
  }
}

