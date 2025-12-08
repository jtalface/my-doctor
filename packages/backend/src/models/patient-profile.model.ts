import mongoose, { Schema, Document } from "mongoose";

// ============================================
// Patient Profile Schema
// ============================================

export interface IDemographics {
  age?: number;
  birthYear?: number;
  sexAtBirth?: "male" | "female" | "other" | "prefer_not_to_say";
  heightM?: number;
  weightKg?: number;
}

export interface ISocialHistory {
  smoking?: "never" | "former" | "current";
  alcohol?: "none" | "occasional" | "moderate" | "heavy";
  drugs?: boolean;
  housingInsecurity?: boolean;
  medAffordabilityIssues?: boolean;
}

export interface IAllergy {
  name: string;
  severity?: "mild" | "moderate" | "severe";
  reaction?: string;
}

export interface IChronicCondition {
  name: string;
  diagnosedYear?: number;
  status?: "active" | "managed" | "resolved";
}

export interface IMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: Date;
}

export interface IPatientProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  demographics: IDemographics;
  socialHistory: ISocialHistory;
  allergies: IAllergy[];
  chronicConditions: IChronicCondition[];
  medications: IMedication[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DemographicsSchema = new Schema<IDemographics>(
  {
    age: { type: Number },
    birthYear: { type: Number },
    sexAtBirth: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    heightM: { type: Number },
    weightKg: { type: Number }
  },
  { _id: false }
);

const SocialHistorySchema = new Schema<ISocialHistory>(
  {
    smoking: { type: String, enum: ["never", "former", "current"] },
    alcohol: { type: String, enum: ["none", "occasional", "moderate", "heavy"] },
    drugs: { type: Boolean },
    housingInsecurity: { type: Boolean },
    medAffordabilityIssues: { type: Boolean }
  },
  { _id: false }
);

const AllergySchema = new Schema<IAllergy>(
  {
    name: { type: String, required: true },
    severity: { type: String, enum: ["mild", "moderate", "severe"] },
    reaction: { type: String }
  },
  { _id: false }
);

const ChronicConditionSchema = new Schema<IChronicCondition>(
  {
    name: { type: String, required: true },
    diagnosedYear: { type: Number },
    status: { type: String, enum: ["active", "managed", "resolved"] }
  },
  { _id: false }
);

const MedicationSchema = new Schema<IMedication>(
  {
    name: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String },
    startDate: { type: Date }
  },
  { _id: false }
);

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    demographics: { type: DemographicsSchema, default: {} },
    socialHistory: { type: SocialHistorySchema, default: {} },
    allergies: { type: [AllergySchema], default: [] },
    chronicConditions: { type: [ChronicConditionSchema], default: [] },
    medications: { type: [MedicationSchema], default: [] },
    lastUpdated: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Indexes
PatientProfileSchema.index({ userId: 1 });

export const PatientProfile = mongoose.model<IPatientProfile>("PatientProfile", PatientProfileSchema);

// ============================================
// Patient Profile Repository
// ============================================

export class PatientProfileRepository {
  async findByUserId(userId: string): Promise<IPatientProfile | null> {
    return PatientProfile.findOne({ userId });
  }

  async create(userId: string): Promise<IPatientProfile> {
    const profile = new PatientProfile({ userId });
    return profile.save();
  }

  async findOrCreate(userId: string): Promise<IPatientProfile> {
    let profile = await this.findByUserId(userId);
    if (!profile) {
      profile = await this.create(userId);
    }
    return profile;
  }

  async updateDemographics(userId: string, demographics: Partial<IDemographics>): Promise<IPatientProfile | null> {
    return PatientProfile.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          ...Object.entries(demographics).reduce((acc, [key, value]) => {
            acc[`demographics.${key}`] = value;
            return acc;
          }, {} as Record<string, unknown>),
          lastUpdated: new Date()
        }
      },
      { new: true }
    );
  }

  async updateSocialHistory(userId: string, socialHistory: Partial<ISocialHistory>): Promise<IPatientProfile | null> {
    return PatientProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...Object.entries(socialHistory).reduce((acc, [key, value]) => {
            acc[`socialHistory.${key}`] = value;
            return acc;
          }, {} as Record<string, unknown>),
          lastUpdated: new Date()
        }
      },
      { new: true }
    );
  }

  async addAllergy(userId: string, allergy: IAllergy): Promise<IPatientProfile | null> {
    return PatientProfile.findOneAndUpdate(
      { userId },
      { $push: { allergies: allergy }, $set: { lastUpdated: new Date() } },
      { new: true }
    );
  }

  async addChronicCondition(userId: string, condition: IChronicCondition): Promise<IPatientProfile | null> {
    return PatientProfile.findOneAndUpdate(
      { userId },
      { $push: { chronicConditions: condition }, $set: { lastUpdated: new Date() } },
      { new: true }
    );
  }

  async addMedication(userId: string, medication: IMedication): Promise<IPatientProfile | null> {
    return PatientProfile.findOneAndUpdate(
      { userId },
      { $push: { medications: medication }, $set: { lastUpdated: new Date() } },
      { new: true }
    );
  }

  async update(userId: string, data: Partial<IPatientProfile>): Promise<IPatientProfile | null> {
    return PatientProfile.findOneAndUpdate(
      { userId },
      { $set: { ...data, lastUpdated: new Date() } },
      { new: true }
    );
  }
}

