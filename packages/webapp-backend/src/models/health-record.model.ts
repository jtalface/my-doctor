import mongoose, { Document, Schema } from 'mongoose';

export interface IVitalReading {
  type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'blood_sugar' | 'oxygen';
  value: number | { systolic: number; diastolic: number };
  unit: string;
  recordedAt: Date;
  source: 'self_reported' | 'device' | 'clinical';
}

export interface IHealthEvent {
  type: 'symptom' | 'diagnosis' | 'procedure' | 'medication_change' | 'red_flag';
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  sessionId?: mongoose.Types.ObjectId;
  recordedAt: Date;
  resolvedAt?: Date;
}

export interface IScreening {
  type: string;
  name: string;
  recommendedDate?: Date;
  completedDate?: Date;
  result?: string;
  notes?: string;
}

export interface IHealthRecord extends Document {
  userId: mongoose.Types.ObjectId;
  vitals: IVitalReading[];
  events: IHealthEvent[];
  screenings: IScreening[];
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VitalReadingSchema = new Schema<IVitalReading>(
  {
    type: {
      type: String,
      enum: ['blood_pressure', 'heart_rate', 'temperature', 'weight', 'blood_sugar', 'oxygen'],
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now },
    source: {
      type: String,
      enum: ['self_reported', 'device', 'clinical'],
      default: 'self_reported',
    },
  },
  { _id: false }
);

const HealthEventSchema = new Schema<IHealthEvent>(
  {
    type: {
      type: String,
      enum: ['symptom', 'diagnosis', 'procedure', 'medication_change', 'red_flag'],
      required: true,
    },
    description: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
    recordedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
  },
  { _id: true }
);

const ScreeningSchema = new Schema<IScreening>(
  {
    type: { type: String, required: true },
    name: { type: String, required: true },
    recommendedDate: { type: Date },
    completedDate: { type: Date },
    result: { type: String },
    notes: { type: String },
  },
  { _id: true }
);

const HealthRecordSchema = new Schema<IHealthRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    vitals: [VitalReadingSchema],
    events: [HealthEventSchema],
    screenings: [ScreeningSchema],
    notes: [{ type: String }],
  },
  { timestamps: true }
);

export const HealthRecord = mongoose.model<IHealthRecord>('HealthRecord', HealthRecordSchema);
