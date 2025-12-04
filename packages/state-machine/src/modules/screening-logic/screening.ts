import { ScreeningLogic } from "./types";
import { PatientProfile } from "../patient-profile/types";

export class ScreeningLogicImpl implements ScreeningLogic {
  async nextQuestion(
    _profile: PatientProfile | null,
    _sessionMemory: unknown,
    userInput: string
  ): Promise<string> {
    const text = userInput.toLowerCase();
    if(/blood pressure|hypertension|high blood pressure|bp/.test(text)){
      return "When was your last blood pressure measurement, and do you know the numbers?";
    }
    if(/diabet|sugar|glucose|hba1c/.test(text)){
      return "Do you remember your last blood sugar or HbA1c result, and roughly when it was checked?";
    }
    if(/smok|tobacco/.test(text)){
      return "How often do you smoke, and for how many years?";
    }
    if(/asthma|breath/.test(text)){
      return "Do you use any inhalers, and how often do you have breathing symptoms?";
    }
    // default, gentle: ask about general habits
    return "Would you like to talk about lifestyle factors like sleep, exercise, or food habits?";
  }
}
