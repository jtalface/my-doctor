import {
  FFDDecision,
  AssessmentStatus,
  type SectionResult,
  type FFDAssessment,
  type FFDAssessmentPublic,
  UserRole,
} from '@ffd/shared';
import { Assessment, Template, JobRole, type IAssessment } from '../models/index.js';
import mongoose from 'mongoose';

/**
 * Check if any red flags are triggered in the sections
 */
export function hasRedFlags(sections: SectionResult[], templateSnapshot: any): boolean {
  for (const section of sections) {
    const templateSection = templateSnapshot.sections.find((s: any) => s.id === section.sectionId);
    if (!templateSection) continue;
    
    for (const item of section.items) {
      const templateItem = templateSection.items.find((i: any) => i.id === item.itemId);
      // Red flag items: if marked as NOT passed (i.e., the red flag condition is present)
      if (templateItem?.isRedFlag && !item.passed) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validate BAC reading (must be exactly 0.00 if provided)
 */
export function validateBAC(sections: SectionResult[]): { valid: boolean; message?: string } {
  for (const section of sections) {
    if (section.bacReading !== undefined && section.bacReading !== null) {
      // BAC must be exactly 0.00 (allow small floating point tolerance)
      if (Math.abs(section.bacReading) > 0.001) {
        return { valid: false, message: 'BAC reading must be 0.00% to pass' };
      }
    }
  }
  return { valid: true };
}

/**
 * Check if fatigue score triggers warning
 */
export function hasFatigueWarning(sections: SectionResult[]): boolean {
  for (const section of sections) {
    if (section.fatigueScore !== undefined && section.fatigueScore > 4) {
      return true;
    }
  }
  return false;
}

/**
 * Validate final decision based on business rules
 */
export function validateFinalDecision(
  decision: string,
  sections: SectionResult[],
  templateSnapshot: any,
  jobRole: any
): { valid: boolean; message?: string; suggestedDecision?: string } {
  const redFlags = hasRedFlags(sections, templateSnapshot);
  const bacCheck = validateBAC(sections);
  const anySectionFailed = sections.some(s => !s.passed);
  
  // Red flags => cannot be FIT
  if (redFlags && decision === FFDDecision.FIT) {
    return {
      valid: false,
      message: 'Cannot mark as FIT when red flags are present',
      suggestedDecision: FFDDecision.TEMP_UNFIT,
    };
  }
  
  // Invalid BAC => cannot be FIT
  if (!bacCheck.valid && decision === FFDDecision.FIT) {
    return {
      valid: false,
      message: bacCheck.message,
      suggestedDecision: FFDDecision.TEMP_UNFIT,
    };
  }
  
  // Any section failed => at least TEMP_UNFIT (unless explicitly UNFIT)
  if (anySectionFailed && decision === FFDDecision.FIT) {
    return {
      valid: false,
      message: 'Cannot mark as FIT when sections have failed',
      suggestedDecision: FFDDecision.TEMP_UNFIT,
    };
  }
  
  // Safety critical role + Section 6 failed => at least TEMP_UNFIT
  if (jobRole?.safetyCritical) {
    const section6 = sections.find(s => s.sectionId === 'section-6-job-specific');
    if (section6 && !section6.passed && decision === FFDDecision.FIT) {
      return {
        valid: false,
        message: 'Safety-critical role requires passing Section 6',
        suggestedDecision: FFDDecision.TEMP_UNFIT,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Compute suggested decision based on assessment data
 */
export function computeSuggestedDecision(
  sections: SectionResult[],
  templateSnapshot: any,
  jobRole: any
): { decision: FFDDecision; warnings: string[] } {
  const warnings: string[] = [];
  
  const redFlags = hasRedFlags(sections, templateSnapshot);
  const bacCheck = validateBAC(sections);
  const fatigueWarning = hasFatigueWarning(sections);
  const anySectionFailed = sections.some(s => !s.passed);
  
  if (fatigueWarning) {
    warnings.push('Fatigue score above threshold (>4)');
  }
  
  if (redFlags) {
    warnings.push('Red flags detected - automatic TEMP_UNFIT or UNFIT required');
    return { decision: FFDDecision.TEMP_UNFIT, warnings };
  }
  
  if (!bacCheck.valid) {
    warnings.push(bacCheck.message || 'BAC test failed');
    return { decision: FFDDecision.TEMP_UNFIT, warnings };
  }
  
  if (jobRole?.safetyCritical) {
    const section6 = sections.find(s => s.sectionId === 'section-6-job-specific');
    if (section6 && !section6.passed) {
      warnings.push('Safety-critical role: Section 6 must pass');
      return { decision: FFDDecision.TEMP_UNFIT, warnings };
    }
  }
  
  if (anySectionFailed) {
    warnings.push('One or more sections failed');
    return { decision: FFDDecision.TEMP_UNFIT, warnings };
  }
  
  return { decision: FFDDecision.FIT, warnings };
}

/**
 * Apply field-level privacy redaction based on user role
 */
export function applyPrivacyRedaction(
  assessment: IAssessment,
  userRole: string,
  requesterId: string
): FFDAssessment | FFDAssessmentPublic {
  const isOwner = assessment.employeeId === requesterId;
  const canViewFull = userRole === UserRole.ADMIN || 
                      userRole === UserRole.ASSESSOR || 
                      isOwner;
  
  if (canViewFull) {
    // Return full assessment
    return {
      id: assessment._id.toString(),
      templateId: assessment.templateId.toString(),
      templateVersionSnapshot: assessment.templateVersionSnapshot,
      employeeName: assessment.employeeName,
      employeeId: assessment.employeeId,
      jobRoleId: assessment.jobRoleId.toString(),
      locationId: assessment.locationId.toString(),
      shift: assessment.shift,
      date: assessment.date,
      assessorUserId: assessment.assessorUserId.toString(),
      sections: assessment.sections,
      vitals: assessment.vitals,
      finalDecision: assessment.finalDecision,
      restrictionsText: assessment.restrictionsText,
      actionsTaken: assessment.actionsTaken,
      notes: assessment.notes,
      signatures: assessment.signatures,
      status: assessment.status,
      voidReason: assessment.voidReason,
      voidedAt: assessment.voidedAt,
      voidedBy: assessment.voidedBy?.toString(),
      createdAt: assessment.createdAt,
      submittedAt: assessment.submittedAt,
      updatedAt: assessment.updatedAt,
    };
  }
  
  // Viewer role: redact sensitive fields
  return {
    id: assessment._id.toString(),
    templateId: assessment.templateId.toString(),
    employeeName: assessment.employeeName,
    employeeId: assessment.employeeId,
    jobRoleId: assessment.jobRoleId.toString(),
    locationId: assessment.locationId.toString(),
    shift: assessment.shift,
    date: assessment.date,
    assessorUserId: assessment.assessorUserId.toString(),
    sections: assessment.sections.map(s => ({
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      passed: s.passed,
      // No item details, vitals, or medication info
    })),
    finalDecision: assessment.finalDecision,
    restrictionsText: assessment.restrictionsText,
    actionsTaken: assessment.actionsTaken,
    status: assessment.status,
    createdAt: assessment.createdAt,
    submittedAt: assessment.submittedAt,
  };
}

/**
 * Get assessment with template snapshot
 */
export async function createAssessmentWithSnapshot(
  data: any,
  assessorUserId: string
): Promise<IAssessment> {
  const template = await Template.findById(data.templateId);
  
  if (!template || !template.isActive) {
    throw new Error('Template not found or inactive');
  }
  
  const assessment = await Assessment.create({
    ...data,
    assessorUserId,
    templateVersionSnapshot: {
      id: template._id.toString(),
      name: template.name,
      version: template.version,
      sections: template.sections,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    },
    status: AssessmentStatus.DRAFT,
  });
  
  return assessment;
}
