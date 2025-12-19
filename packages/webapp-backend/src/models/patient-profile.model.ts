import mongoose, { Document, Schema } from 'mongoose';

export interface IPatientProfile extends Document {
  userId: mongoose.Types.ObjectId;
  demographics: {
    dateOfBirth?: Date;
    age?: number;
    sexAtBirth?: 'male' | 'female' | 'other';
    heightCm?: number;
    weightKg?: number;
  };
  medicalHistory: {
    chronicConditions: string[];
    allergies: string[];
    medications: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  lifestyle: {
    smoking?: 'never' | 'former' | 'current';
    alcohol?: 'never' | 'occasional' | 'regular' | 'heavy';
    exercise?: 'sedentary' | 'light' | 'moderate' | 'active';
    diet?: string;
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    demographics: {
      dateOfBirth: { type: Date },
      age: { type: Number },
      sexAtBirth: { type: String, enum: ['male', 'female', 'other'] },
      heightCm: { type: Number },
      weightKg: { type: Number },
    },
    medicalHistory: {
      chronicConditions: [{ type: String }],
      allergies: [{ type: String }],
      medications: [{ type: String }],
      surgeries: [{ type: String }],
      familyHistory: [{ type: String }],
    },
    lifestyle: {
      smoking: { type: String, enum: ['never', 'former', 'current'] },
      alcohol: { type: String, enum: ['never', 'occasional', 'regular', 'heavy'] },
      exercise: { type: String, enum: ['sedentary', 'light', 'moderate', 'active'] },
      diet: { type: String },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PatientProfile = mongoose.model<IPatientProfile>('PatientProfile', PatientProfileSchema);
