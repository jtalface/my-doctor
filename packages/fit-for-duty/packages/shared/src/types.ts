// ==================== ENUMS ====================

export const UserRole = {
  ADMIN: 'Admin',
  ASSESSOR: 'Assessor',
  VIEWER: 'Viewer',
  EMPLOYEE: 'Employee',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const LocationType = {
  ONSHORE: 'Onshore',
  OFFSHORE: 'Offshore',
  REFINERY: 'Refinery',
  PIPELINE: 'Pipeline',
} as const;
export type LocationType = (typeof LocationType)[keyof typeof LocationType];

export const Shift = {
  DAY: 'Day',
  NIGHT: 'Night',
} as const;
export type Shift = (typeof Shift)[keyof typeof Shift];

export const FFDDecision = {
  FIT: 'FIT',
  FIT_WITH_RESTRICTIONS: 'FIT_WITH_RESTRICTIONS',
  TEMP_UNFIT: 'TEMP_UNFIT',
  UNFIT: 'UNFIT',
} as const;
export type FFDDecision = (typeof FFDDecision)[keyof typeof FFDDecision];

export const AssessmentStatus = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VOIDED: 'Voided',
} as const;
export type AssessmentStatus = (typeof AssessmentStatus)[keyof typeof AssessmentStatus];

export const ActionTaken = {
  REASSIGNED: 'Reassigned',
  REST: 'Rest',
  MEDICAL_EVAL: 'MedicalEval',
  SENT_OFFSITE: 'SentOffsite',
} as const;
export type ActionTaken = (typeof ActionTaken)[keyof typeof ActionTaken];

export const JobRoleTag = {
  WORKING_AT_HEIGHTS: 'WorkingAtHeights',
  CONFINED_SPACE: 'ConfinedSpace',
  CRANE: 'Crane',
  ELECTRICAL: 'Electrical',
  H2S: 'H2S',
  HEAVY_EQUIPMENT: 'HeavyEquipment',
} as const;
export type JobRoleTag = (typeof JobRoleTag)[keyof typeof JobRoleTag];

// ==================== USER ====================

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string; // Never sent to client
  role: UserRole;
  locationIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserPublic = Omit<User, 'passwordHash'>;

// ==================== EMPLOYEE PROFILE ====================

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  userId?: string;
  department: string;
  jobRoleId: string;
  locationId: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== LOCATION ====================

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  region: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== JOB ROLE ====================

export interface JobRole {
  id: string;
  name: string;
  safetyCritical: boolean;
  tags: JobRoleTag[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CHECKLIST TEMPLATE ====================

export interface ChecklistItem {
  id: string;
  text: string;
  isRedFlag?: boolean;
}

export interface ChecklistSection {
  id: string;
  name: string;
  items: ChecklistItem[];
  hasVitals?: boolean;
  hasSleepHours?: boolean;
  hasFatigueScore?: boolean;
  hasBACTest?: boolean;
}

export interface FFDChecklistTemplate {
  id: string;
  name: string;
  version: number;
  sections: ChecklistSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ASSESSMENT ====================

export interface ItemResult {
  itemId: string;
  passed: boolean;
  comment?: string;
}

export interface SectionResult {
  sectionId: string;
  sectionName: string;
  items: ItemResult[];
  passed: boolean;
  // Section-specific fields
  sleepHours?: number;
  fatigueScore?: number;
  bacReading?: number;
}

export interface Vitals {
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  spo2?: number;
}

export interface Signatures {
  employeeName: string;
  employeeSignedAt?: Date;
  assessorName: string;
  assessorSignedAt?: Date;
}

export interface FFDAssessment {
  id: string;
  templateId: string;
  templateVersionSnapshot: FFDChecklistTemplate;
  employeeName: string;
  employeeId: string;
  jobRoleId: string;
  locationId: string;
  shift: Shift;
  date: string; // YYYY-MM-DD
  assessorUserId: string;
  sections: SectionResult[];
  vitals?: Vitals;
  finalDecision: FFDDecision;
  restrictionsText?: string;
  actionsTaken: ActionTaken[];
  notes?: string;
  signatures: Signatures;
  status: AssessmentStatus;
  voidReason?: string;
  voidedAt?: Date;
  voidedBy?: string;
  createdAt: Date;
  submittedAt?: Date;
  updatedAt: Date;
}

// Privacy-filtered version for Viewers
export interface FFDAssessmentPublic {
  id: string;
  templateId: string;
  employeeName: string;
  employeeId: string;
  jobRoleId: string;
  locationId: string;
  shift: Shift;
  date: string;
  assessorUserId: string;
  sections: Array<{
    sectionId: string;
    sectionName: string;
    passed: boolean;
    // No item details, no vitals, no medication info
  }>;
  finalDecision: FFDDecision;
  restrictionsText?: string;
  actionsTaken: ActionTaken[];
  status: AssessmentStatus;
  createdAt: Date;
  submittedAt?: Date;
}

// ==================== AUDIT LOG ====================

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  diff?: Record<string, unknown>;
}

// ==================== API RESPONSES ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: UserPublic;
}

export interface ReportSummary {
  totalAssessments: number;
  byDecision: Record<FFDDecision, number>;
  byLocation: Array<{ locationId: string; locationName: string; count: number }>;
  byDate: Array<{ date: string; count: number }>;
}
