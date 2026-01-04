import mongoose, { Document, Schema } from 'mongoose';

// Vaccination record for tracking individual vaccine doses
export interface IVaccinationRecord {
  doseId: string;                           // References VaccineDose.id from vaccination-form.ts
  status: 'yes' | 'no' | 'unknown';         // Administered, not administered, or unknown
  dateAdministered?: Date;                  // Date when vaccine was given
  notes?: string;                           // Optional notes (e.g., batch number, facility)
  updatedAt?: Date;                         // When this record was last updated
}

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
  // Vaccination records for dependents (children)
  vaccinationRecords?: IVaccinationRecord[];
  vaccinationCountry?: string;              // Country code for vaccination schema (e.g., 'moz')
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schema for vaccination records
const VaccinationRecordSchema = new Schema({
  doseId: { type: String, required: true },
  status: { type: String, enum: ['yes', 'no', 'unknown'], required: true },
  dateAdministered: { type: Date },
  notes: { type: String },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

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
    // Vaccination tracking
    vaccinationRecords: [VaccinationRecordSchema],
    vaccinationCountry: { type: String, default: 'moz' }, // Default to Mozambique
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PatientProfile = mongoose.model<IPatientProfile>('PatientProfile', PatientProfileSchema);
