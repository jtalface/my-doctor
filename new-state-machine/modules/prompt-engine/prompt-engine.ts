import { PatientProfile } from "../patient-profile/types";

export class PromptEngine {
  buildPrompt(nodePrompt: string, profile: PatientProfile | null, sessionMemory: any){
    const header = "You are a calm, neutral health education assistant. Provide general, non-prescriptive information.\n";
    const profileText = profile ? ("Patient (approx): " + JSON.stringify({ age: profile.age, gender: profile.gender }) + "\n") : "";
    const memoryHint = sessionMemory && sessionMemory.lastState ? ("Last state: " + sessionMemory.lastState + "\n") : "";
    return header + profileText + memoryHint + "System: " + nodePrompt + "\nAssistant:";
  }
}
