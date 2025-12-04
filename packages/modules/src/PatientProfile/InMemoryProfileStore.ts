import { PatientProfileStore, PatientProfile } from "./types";

const PROFILE_DB: Record<string, PatientProfile> = {};

export class InMemoryProfileStore implements PatientProfileStore {
  async load(id: string): Promise<PatientProfile | null> {
    return PROFILE_DB[id] ?? null;
  }

  async save(id: string, profile: PatientProfile): Promise<void> {
    PROFILE_DB[id] = {
      ...profile,
      id,
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async update(id: string, updates: Partial<PatientProfile>): Promise<void> {
    if (PROFILE_DB[id]) {
      PROFILE_DB[id] = {
        ...PROFILE_DB[id],
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }
  }

  async delete(id: string): Promise<void> {
    delete PROFILE_DB[id];
  }
}

