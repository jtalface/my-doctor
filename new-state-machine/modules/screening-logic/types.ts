import { PatientProfile } from "../patient-profile/types";

export interface ScreeningLogic {
  nextQuestion(
    profile: PatientProfile | null,
    sessionMemory: any,
    userInput: string
  ): Promise<string>;
}
