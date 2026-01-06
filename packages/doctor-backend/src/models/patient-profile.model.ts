/**
 * Patient Profile Model (Read-Only from webapp-backend)
 * 
 * Doctor-backend reads patient profiles but doesn't modify them.
 * This allows doctors to view patient health history.
 */

import mongoose, { Document, Schema } from 'mongoose';

// Simplified interface for reading patient data
export interface IPatientProfile extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Demographics
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  height?: number;
  weight?: number;
  
  // Emergency contact
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Medical info
  allergies: string[];
  chronicConditions: string[];
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  
  // Vaccination history
  vaccinations: Array<{
    name: string;
    date: Date;
    nextDueDate?: Date;
    notes?: string;
  }>;
  
  // Family history
  familyHistory: Array<{
    condition: string;
    relationship: string;
    notes?: string;
  }>;
  
  // Insurance
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  
  // Last check-up
  lastCheckupDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true,
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodType: { type: String },
    height: { type: Number },
    weight: { type: Number },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    currentMedications: [{
      name: { type: String },
      dosage: { type: String },
      frequency: { type: String },
    }],
    vaccinations: [{
      name: { type: String },
      date: { type: Date },
      nextDueDate: { type: Date },
      notes: { type: String },
    }],
    familyHistory: [{
      condition: { type: String },
      relationship: { type: String },
      notes: { type: String },
    }],
    insuranceInfo: {
      provider: { type: String },
      policyNumber: { type: String },
      groupNumber: { type: String },
    },
    lastCheckupDate: { type: Date },
  },
  { timestamps: true }
);

export const PatientProfile = mongoose.model<IPatientProfile>('PatientProfile', PatientProfileSchema);

