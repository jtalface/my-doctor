import mongoose, { Schema, Document } from "mongoose";

// ============================================
// Health Record Schema
// ============================================

export interface IVitalRecord {
  date: Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  notes?: string;
}

export interface IConditionRecord {
  name: string;
  diagnosedDate?: Date;
  resolvedDate?: Date;
  status: "active" | "managed" | "resolved";
  notes?: string;
}

export interface IMedicationRecord {
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  prescribedBy?: string;
}

export interface IScreeningRecord {
  type: string;
  date: Date;
  result?: string;
  notes?: string;
  nextDueDate?: Date;
}

export interface IRedFlagEvent {
  date: Date;
  sessionId?: string;
  nodeId?: string;
  flagId: string;
  label: string;
  reason: string;
  severity: "low" | "moderate" | "high";
  action?: string;
  resolved?: boolean;
  resolvedDate?: Date;
}

export interface IHealthNote {
  date: Date;
  sessionId?: string;
  category?: string;
  content: string;
  createdBy?: string;
}

export interface IHealthRecord extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vitalsHistory: IVitalRecord[];
  conditionsHistory: IConditionRecord[];
  medicationHistory: IMedicationRecord[];
  screeningsHistory: IScreeningRecord[];
  redFlagEvents: IRedFlagEvent[];
  notes: IHealthNote[];
  createdAt: Date;
  updatedAt: Date;
}

const VitalRecordSchema = new Schema<IVitalRecord>(
  {
    date: { type: Date, required: true, default: Date.now },
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    heartRate: { type: Number },
    temperature: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    oxygenSaturation: { type: Number },
    notes: { type: String }
  },
  { _id: false }
);

const ConditionRecordSchema = new Schema<IConditionRecord>(
  {
    name: { type: String, required: true },
    diagnosedDate: { type: Date },
    resolvedDate: { type: Date },
    status: { type: String, enum: ["active", "managed", "resolved"], required: true },
    notes: { type: String }
  },
  { _id: false }
);

const MedicationRecordSchema = new Schema<IMedicationRecord>(
  {
    name: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    reason: { type: String },
    prescribedBy: { type: String }
  },
  { _id: false }
);

const ScreeningRecordSchema = new Schema<IScreeningRecord>(
  {
    type: { type: String, required: true },
    date: { type: Date, required: true },
    result: { type: String },
    notes: { type: String },
    nextDueDate: { type: Date }
  },
  { _id: false }
);

const RedFlagEventSchema = new Schema<IRedFlagEvent>(
  {
    date: { type: Date, required: true, default: Date.now },
    sessionId: { type: String },
    nodeId: { type: String },
    flagId: { type: String, required: true },
    label: { type: String, required: true },
    reason: { type: String, required: true },
    severity: { type: String, enum: ["low", "moderate", "high"], required: true },
    action: { type: String },
    resolved: { type: Boolean, default: false },
    resolvedDate: { type: Date }
  },
  { _id: false }
);

const HealthNoteSchema = new Schema<IHealthNote>(
  {
    date: { type: Date, required: true, default: Date.now },
    sessionId: { type: String },
    category: { type: String },
    content: { type: String, required: true },
    createdBy: { type: String }
  },
  { _id: false }
);

const HealthRecordSchema = new Schema<IHealthRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    vitalsHistory: { type: [VitalRecordSchema], default: [] },
    conditionsHistory: { type: [ConditionRecordSchema], default: [] },
    medicationHistory: { type: [MedicationRecordSchema], default: [] },
    screeningsHistory: { type: [ScreeningRecordSchema], default: [] },
    redFlagEvents: { type: [RedFlagEventSchema], default: [] },
    notes: { type: [HealthNoteSchema], default: [] }
  },
  {
    timestamps: true
  }
);

// Indexes
HealthRecordSchema.index({ userId: 1 });

export const HealthRecord = mongoose.model<IHealthRecord>("HealthRecord", HealthRecordSchema);

// ============================================
// Health Record Repository
// ============================================

export class HealthRecordRepository {
  async findByUserId(userId: string): Promise<IHealthRecord | null> {
    return HealthRecord.findOne({ userId });
  }

  async create(userId: string): Promise<IHealthRecord> {
    const record = new HealthRecord({ userId });
    return record.save();
  }

  async findOrCreate(userId: string): Promise<IHealthRecord> {
    let record = await this.findByUserId(userId);
    if (!record) {
      record = await this.create(userId);
    }
    return record;
  }

  async addVital(userId: string, vital: IVitalRecord): Promise<IHealthRecord | null> {
    return HealthRecord.findOneAndUpdate(
      { userId },
      { $push: { vitalsHistory: vital } },
      { new: true }
    );
  }

  async addCondition(userId: string, condition: IConditionRecord): Promise<IHealthRecord | null> {
    return HealthRecord.findOneAndUpdate(
      { userId },
      { $push: { conditionsHistory: condition } },
      { new: true }
    );
  }

  async addMedication(userId: string, medication: IMedicationRecord): Promise<IHealthRecord | null> {
    return HealthRecord.findOneAndUpdate(
      { userId },
      { $push: { medicationHistory: medication } },
      { new: true }
    );
  }

  async addScreening(userId: string, screening: IScreeningRecord): Promise<IHealthRecord | null> {
    return HealthRecord.findOneAndUpdate(
      { userId },
      { $push: { screeningsHistory: screening } },
      { new: true }
    );
  }

  async addRedFlagEvent(userId: string, redFlag: IRedFlagEvent): Promise<IHealthRecord | null> {
    return HealthRecord.findOneAndUpdate(
      { userId },
      { $push: { redFlagEvents: redFlag } },
      { new: true }
    );
  }

  async addNote(userId: string, note: IHealthNote): Promise<IHealthRecord | null> {
    return HealthRecord.findOneAndUpdate(
      { userId },
      { $push: { notes: note } },
      { new: true }
    );
  }

  async getRecentRedFlags(userId: string, limit = 10): Promise<IRedFlagEvent[]> {
    const record = await HealthRecord.findOne({ userId });
    if (!record) return [];
    return record.redFlagEvents
      .filter(rf => !rf.resolved)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }
}

