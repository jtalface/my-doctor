import { Router, Response } from 'express';
import { FFDDecision, AssessmentStatus } from '@ffd/shared';
import { Assessment, Location } from '../models/index.js';
import {
  authenticate,
  requireViewer,
  type AuthRequest,
} from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireViewer);

/**
 * GET /reports/summary
 */
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, locationId } = req.query;
    
    const matchFilter: any = {
      status: { $ne: AssessmentStatus.VOIDED },
    };
    
    if (startDate) matchFilter.date = { $gte: startDate as string };
    if (endDate) matchFilter.date = { ...matchFilter.date, $lte: endDate as string };
    if (locationId) matchFilter.locationId = locationId;
    
    // Total count
    const totalAssessments = await Assessment.countDocuments(matchFilter);
    
    // By decision
    const byDecisionAgg = await Assessment.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$finalDecision', count: { $sum: 1 } } },
    ]);
    
    const byDecision: Record<string, number> = {
      [FFDDecision.FIT]: 0,
      [FFDDecision.FIT_WITH_RESTRICTIONS]: 0,
      [FFDDecision.TEMP_UNFIT]: 0,
      [FFDDecision.UNFIT]: 0,
    };
    
    for (const item of byDecisionAgg) {
      byDecision[item._id] = item.count;
    }
    
    // By location
    const byLocationAgg = await Assessment.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$locationId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'location',
        },
      },
      { $unwind: '$location' },
      {
        $project: {
          locationId: '$_id',
          locationName: '$location.name',
          count: 1,
        },
      },
    ]);
    
    const byLocation = byLocationAgg.map((item) => ({
      locationId: item.locationId.toString(),
      locationName: item.locationName,
      count: item.count,
    }));
    
    // By date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const byDateAgg = await Assessment.aggregate([
      {
        $match: {
          ...matchFilter,
          date: { $gte: thirtyDaysAgoStr },
        },
      },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    
    const byDate = byDateAgg.map((item) => ({
      date: item._id,
      count: item.count,
    }));
    
    res.json({
      totalAssessments,
      byDecision,
      byLocation,
      byDate,
    });
  } catch (error) {
    console.error('[Reports] Summary error:', error);
    res.status(500).json({ error: 'Failed to get report summary' });
  }
});

export default router;
