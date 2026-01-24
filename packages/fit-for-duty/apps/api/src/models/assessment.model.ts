import mongoose, { Document, Schema } from 'mongoose';
import {
  Shift,
  FFDDecision,
  AssessmentStatus,
  ActionTaken,
  type SectionResult,
  type ItemResult,
  type Vitals,
  type Signatures,
  type FFDChecklistTemplate,
} from '@ffd/shared';

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  templateVersionSnapshot: FFDChecklistTemplate;
  employeeName: string;
  employeeId: string;
  jobRoleId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  shift: typeof Shift[keyof typeof Shift];
  date: string;
  assessorUserId: mongoose.Types.ObjectId;
  sections: SectionResult[];
  vitals?: Vitals;
  finalDecision: typeof FFDDecision[keyof typeof FFDDecision];
  restrictionsText?: string;
  actionsTaken: Array<typeof ActionTaken[keyof typeof ActionTaken]>;
  notes?: string;
  signatures: Signatures;
  status: typeof AssessmentStatus[keyof typeof AssessmentStatus];
  voidReason?: string;
  voidedAt?: Date;
  voidedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  submittedAt?: Date;
  updatedAt: Date;
}

const ItemResultSchema = new Schema<ItemResult>(
  {
    itemId: { type: String, required: true },
    passed: { type: Boolean, required: true },
    comment: { type: String },
  },
  { _id: false }
);

const SectionResultSchema = new Schema<SectionResult>(
  {
    sectionId: { type: String, required: true },
    sectionName: { type: String, required: true },
    items: [ItemResultSchema],
    passed: { type: Boolean, required: true },
    sleepHours: { type: Number },
    fatigueScore: { type: Number },
    bacReading: { type: Number },
  },
  { _id: false }
);

const VitalsSchema = new Schema<Vitals>(
  {
    bpSystolic: { type: Number },
    bpDiastolic: { type: Number },
    heartRate: { type: Number },
    spo2: { type: Number },
  },
  { _id: false }
);

const SignaturesSchema = new Schema<Signatures>(
  {
    employeeName: { type: String, required: true },
    employeeSignedAt: { type: Date },
    assessorName: { type: String, required: true },
    assessorSignedAt: { type: Date },
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    templateVersionSnapshot: { type: Schema.Types.Mixed, required: true },
    employeeName: { type: String, required: true },
    employeeId: { type: String, required: true },
    jobRoleId: { type: Schema.Types.ObjectId, ref: 'JobRole', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    shift: { type: String, enum: Object.values(Shift), required: true },
    date: { type: String, required: true },
    assessorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sections: [SectionResultSchema],
    vitals: VitalsSchema,
    finalDecision: {
      type: String,
      enum: Object.values(FFDDecision),
      default: FFDDecision.FIT,
    },
    restrictionsText: { type: String },
    actionsTaken: [{
      type: String,
      enum: Object.values(ActionTaken),
    }],
    notes: { type: String },
    signatures: SignaturesSchema,
    status: {
      type: String,
      enum: Object.values(AssessmentStatus),
      default: AssessmentStatus.DRAFT,
    },
    voidReason: { type: String },
    voidedAt: { type: Date },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

AssessmentSchema.index({ date: -1 });
AssessmentSchema.index({ employeeId: 1 });
AssessmentSchema.index({ locationId: 1 });
AssessmentSchema.index({ jobRoleId: 1 });
AssessmentSchema.index({ assessorUserId: 1 });
AssessmentSchema.index({ status: 1 });
AssessmentSchema.index({ finalDecision: 1 });
AssessmentSchema.index({ createdAt: -1 });

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
