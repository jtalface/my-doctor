import { PatientProfileStore, PatientProfile } from "./types";

const DB: Record<string, PatientProfile> = {};

export class InMemoryProfileStore implements PatientProfileStore {
  async load(id: string): Promise<PatientProfile | null> {
    if(!DB[id]){
      DB[id] = {
        id,
        name: "Demo User",
        age: 30,
        gender: "male",
        weight: 80,
        height: 1.75,
        medicalHistory: [],
        medications: []
      };
    }
    return DB[id];
  }
  async save(id: string, profile: PatientProfile): Promise<void> {
    DB[id] = profile;
  }
}
