import mongoose, { Document, Schema } from 'mongoose';
import type { PreventiveLanguage, SmokingStatus, SexAtBirth, WeightCategory } from '../preventive/types.js';

export interface IPreventiveProfile extends Document {
  patientId: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  age?: number;
  sexAtBirth: SexAtBirth;
  genderContext?: string;
  country?: string;
  region?: string;
  pregnancyStatus?: 'yes' | 'no' | 'unknown';
  smokingStatus?: SmokingStatus;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  weightCategory?: WeightCategory;
  chronicConditions: string[];
  knownAllergies: string[];
  familyHistory: string[];
  riskFactors: {
    smoker?: boolean;
    overweightOrObesity?: boolean;
    hypertension?: boolean;
    diabetesOrPrediabetes?: boolean;
    familyHistoryCancer?: boolean;
    familyHistoryCardiovascular?: boolean;
  };
  language: PreventiveLanguage;
  createdAt: Date;
  updatedAt: Date;
}

const PreventiveProfileSchema = new Schema<IPreventiveProfile>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    dateOfBirth: { type: Date },
    age: { type: Number },
    sexAtBirth: { type: String, enum: ['male', 'female', 'other'], required: true },
    genderContext: { type: String, trim: true },
    country: { type: String, trim: true },
    region: { type: String, trim: true },
    pregnancyStatus: { type: String, enum: ['yes', 'no', 'unknown'] },
    smokingStatus: { type: String, enum: ['never', 'former', 'current'] },
    heightCm: { type: Number },
    weightKg: { type: Number },
    bmi: { type: Number },
    weightCategory: { type: String, enum: ['underweight', 'normal', 'overweight', 'obesity'] },
    chronicConditions: { type: [String], default: [] },
    knownAllergies: { type: [String], default: [] },
    familyHistory: { type: [String], default: [] },
    riskFactors: {
      smoker: { type: Boolean, default: false },
      overweightOrObesity: { type: Boolean, default: false },
      hypertension: { type: Boolean, default: false },
      diabetesOrPrediabetes: { type: Boolean, default: false },
      familyHistoryCancer: { type: Boolean, default: false },
      familyHistoryCardiovascular: { type: Boolean, default: false },
    },
    language: { type: String, enum: ['pt', 'en', 'fr', 'sw'], default: 'pt', index: true },
  },
  { timestamps: true }
);

export const PreventiveProfile = mongoose.model<IPreventiveProfile>('PreventiveProfile', PreventiveProfileSchema);
