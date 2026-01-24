import { Router, Response } from 'express';
import {
  createAssessmentSchema,
  updateAssessmentSchema,
  submitAssessmentSchema,
  voidAssessmentSchema,
  assessmentQuerySchema,
  AssessmentStatus,
  UserRole,
} from '@ffd/shared';
import { Assessment, JobRole, Template } from '../models/index.js';
import {
  createAssessmentWithSnapshot,
  validateFinalDecision,
  computeSuggestedDecision,
  applyPrivacyRedaction,
} from '../services/assessment.service.js';
import {
  authenticate,
  requireAssessor,
  requireAdmin,
  requireViewer,
  type AuthRequest,
} from '../middleware/auth.middleware.js';
import { createAuditLog } from '../middleware/audit.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * GET /assessments
 */
router.get('/', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const validation = assessmentQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.issues,
      });
      return;
    }
    
    const { page, limit, startDate, endDate, locationId, jobRoleId, decision, assessorUserId, employeeId, status } = validation.data;
    
    const filter: any = {};
    
    if (startDate) filter.date = { $gte: startDate };
    if (endDate) filter.date = { ...filter.date, $lte: endDate };
    if (locationId) filter.locationId = locationId;
    if (jobRoleId) filter.jobRoleId = jobRoleId;
    if (decision) filter.finalDecision = decision;
    if (assessorUserId) filter.assessorUserId = assessorUserId;
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    
    // Employees can only see their own records
    if (req.user!.role === UserRole.EMPLOYEE) {
      filter.employeeId = req.user!.userId;
    }
    
    const skip = (page - 1) * limit;
    
    const [assessments, total] = await Promise.all([
      Assessment.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('locationId', 'name')
        .populate('jobRoleId', 'name safetyCritical')
        .populate('assessorUserId', 'name'),
      Assessment.countDocuments(filter),
    ]);
    
    const data = assessments.map((a) =>
      applyPrivacyRedaction(a, req.user!.role, req.user!.userId)
    );
    
    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Assessments] Get all error:', error);
    res.status(500).json({ error: 'Failed to get assessments' });
  }
});

/**
 * GET /assessments/:id
 */
router.get('/:id', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('locationId', 'name type region')
      .populate('jobRoleId', 'name safetyCritical tags')
      .populate('assessorUserId', 'name email');
    
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    
    // Employees can only see their own records
    if (req.user!.role === UserRole.EMPLOYEE && assessment.employeeId !== req.user!.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const data = applyPrivacyRedaction(assessment, req.user!.role, req.user!.userId);
    
    res.json(data);
  } catch (error) {
    console.error('[Assessments] Get one error:', error);
    res.status(500).json({ error: 'Failed to get assessment' });
  }
});

/**
 * POST /assessments
 */
router.post('/', requireAssessor, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createAssessmentSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const assessment = await createAssessmentWithSnapshot(
      validation.data,
      req.user!.userId
    );
    
    await createAuditLog(
      req.user!.userId,
      'create',
      'Assessment',
      assessment._id.toString(),
      req
    );
    
    res.status(201).json(
      applyPrivacyRedaction(assessment, req.user!.role, req.user!.userId)
    );
  } catch (error) {
    console.error('[Assessments] Create error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

/**
 * PUT /assessments/:id
 * Only draft assessments can be updated
 */
router.put('/:id', requireAssessor, async (req: AuthRequest, res: Response) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    
    // Only drafts can be updated
    if (assessment.status !== AssessmentStatus.DRAFT) {
      res.status(400).json({ error: 'Only draft assessments can be updated' });
      return;
    }
    
    // Only creator or admin can update
    if (assessment.assessorUserId.toString() !== req.user!.userId && req.user!.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Only the creator can update this assessment' });
      return;
    }
    
    const validation = updateAssessmentSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const updated = await Assessment.findByIdAndUpdate(
      req.params.id,
      { $set: validation.data },
      { new: true }
    );
    
    await createAuditLog(
      req.user!.userId,
      'update',
      'Assessment',
      assessment._id.toString(),
      req
    );
    
    res.json(applyPrivacyRedaction(updated!, req.user!.role, req.user!.userId));
  } catch (error) {
    console.error('[Assessments] Update error:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

/**
 * POST /assessments/:id/submit
 */
router.post('/:id/submit', requireAssessor, async (req: AuthRequest, res: Response) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    
    if (assessment.status !== AssessmentStatus.DRAFT) {
      res.status(400).json({ error: 'Assessment is already submitted' });
      return;
    }
    
    // Only creator or admin can submit
    if (assessment.assessorUserId.toString() !== req.user!.userId && req.user!.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Only the creator can submit this assessment' });
      return;
    }
    
    const validation = submitAssessmentSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    // Get job role for validation
    const jobRole = await JobRole.findById(assessment.jobRoleId);
    
    // Validate final decision
    const decisionValidation = validateFinalDecision(
      validation.data.finalDecision,
      validation.data.sections,
      assessment.templateVersionSnapshot,
      jobRole
    );
    
    if (!decisionValidation.valid) {
      res.status(400).json({
        error: decisionValidation.message,
        suggestedDecision: decisionValidation.suggestedDecision,
      });
      return;
    }
    
    const updated = await Assessment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...validation.data,
          status: AssessmentStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      },
      { new: true }
    );
    
    await createAuditLog(
      req.user!.userId,
      'submit',
      'Assessment',
      assessment._id.toString(),
      req
    );
    
    res.json(applyPrivacyRedaction(updated!, req.user!.role, req.user!.userId));
  } catch (error) {
    console.error('[Assessments] Submit error:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

/**
 * POST /assessments/:id/void
 * Admin only
 */
router.post('/:id/void', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = voidAssessmentSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    
    if (assessment.status === AssessmentStatus.VOIDED) {
      res.status(400).json({ error: 'Assessment is already voided' });
      return;
    }
    
    const updated = await Assessment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: AssessmentStatus.VOIDED,
          voidReason: validation.data.reason,
          voidedAt: new Date(),
          voidedBy: req.user!.userId,
        },
      },
      { new: true }
    );
    
    await createAuditLog(
      req.user!.userId,
      'void',
      'Assessment',
      assessment._id.toString(),
      req,
      { reason: validation.data.reason }
    );
    
    res.json(applyPrivacyRedaction(updated!, req.user!.role, req.user!.userId));
  } catch (error) {
    console.error('[Assessments] Void error:', error);
    res.status(500).json({ error: 'Failed to void assessment' });
  }
});

/**
 * POST /assessments/preview-decision
 * Get suggested decision based on current data
 */
router.post('/preview-decision', requireAssessor, async (req: AuthRequest, res: Response) => {
  try {
    const { sections, templateId, jobRoleId } = req.body;
    
    if (!sections || !templateId) {
      res.status(400).json({ error: 'sections and templateId are required' });
      return;
    }
    
    const template = await Template.findById(templateId);
    const jobRole = jobRoleId ? await JobRole.findById(jobRoleId) : null;
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    const result = computeSuggestedDecision(sections, template, jobRole);
    
    res.json(result);
  } catch (error) {
    console.error('[Assessments] Preview decision error:', error);
    res.status(500).json({ error: 'Failed to compute decision' });
  }
});

export default router;
