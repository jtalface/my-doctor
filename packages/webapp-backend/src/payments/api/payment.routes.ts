/**
 * Payment Routes
 * 
 * REST API endpoints for payment operations.
 * Endpoints:
 * - POST /api/payments/initiate - Initiate a new payment
 * - GET /api/payments/:paymentId - Get payment status
 * - POST /api/payments/:paymentId/resend - Resend payment prompt
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { paymentOrchestrator } from '../paymentOrchestrator.js';
import { getSupportedCountries } from '../providers/index.js';

const router = Router();

/**
 * Validation schema for payment initiation
 */
const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required').max(255),
  country: z.enum(['MZ', 'AO'], { errorMap: () => ({ message: 'Country must be MZ or AO' }) }),
  amount: z.number().int().positive('Amount must be a positive integer (minor units)'),
  currency: z.enum(['MZN', 'AOA'], { errorMap: () => ({ message: 'Currency must be MZN or AOA' }) }),
  method: z.enum(['MOBILE_MONEY', 'LOCAL_RAIL'], { errorMap: () => ({ message: 'Method must be MOBILE_MONEY or LOCAL_RAIL' }) }),
  msisdn: z.string().optional(),
  customer: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
});

/**
 * POST /api/payments/initiate
 * 
 * Initiate a new payment. Implements idempotency - same request within 10 minutes
 * returns the same payment record.
 */
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = initiatePaymentSchema.safeParse(req.body);
    
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Invalid request body',
        details: validation.error.issues,
      });
    }
    
    const data = validation.data;
    
    // Validate currency matches country
    const currencyByCountry: Record<string, string> = { MZ: 'MZN', AO: 'AOA' };
    if (data.currency !== currencyByCountry[data.country]) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: `Currency ${data.currency} is not valid for country ${data.country}`,
      });
    }
    
    // Validate MSISDN for MZ (eMola requires it)
    if (data.country === 'MZ' && data.method === 'MOBILE_MONEY' && !data.msisdn) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Phone number (msisdn) is required for eMola payments in Mozambique',
      });
    }
    
    // Initiate payment
    const result = await paymentOrchestrator.initiatePayment(data);
    
    // Return 201 for new payment, 200 for existing (idempotent)
    const statusCode = result.status === 'PENDING' ? 201 : 200;
    
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('[Payment Routes] Initiate error:', error);
    
    res.status(500).json({
      error: 'PAYMENT_ERROR',
      message: error instanceof Error ? error.message : 'Failed to initiate payment',
    });
  }
});

/**
 * GET /api/payments/:paymentId
 * 
 * Get payment status and details (safe fields only).
 */
router.get('/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Payment ID is required',
      });
    }
    
    const payment = await paymentOrchestrator.getPayment(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Payment not found',
      });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('[Payment Routes] Get payment error:', error);
    
    res.status(500).json({
      error: 'PAYMENT_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get payment',
    });
  }
});

/**
 * POST /api/payments/:paymentId/resend
 * 
 * Resend payment prompt (for mobile money providers that support it).
 * Throttled to prevent abuse (30 seconds between resends).
 */
router.post('/:paymentId/resend', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Payment ID is required',
      });
    }
    
    const result = await paymentOrchestrator.resendPayment(paymentId);
    
    res.json(result);
  } catch (error) {
    console.error('[Payment Routes] Resend error:', error);
    
    // Return specific error codes for known errors
    const message = error instanceof Error ? error.message : 'Failed to resend payment';
    
    if (message.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message,
      });
    }
    
    if (message.includes('Cannot resend') || message.includes('does not support')) {
      return res.status(400).json({
        error: 'RESEND_NOT_ALLOWED',
        message,
      });
    }
    
    if (message.includes('wait')) {
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message,
      });
    }
    
    res.status(500).json({
      error: 'PAYMENT_ERROR',
      message,
    });
  }
});

/**
 * GET /api/payments/countries/supported
 * 
 * Get list of supported countries for payments.
 */
router.get('/countries/supported', (_req: Request, res: Response) => {
  res.json({
    countries: getSupportedCountries(),
    currencies: {
      MZ: 'MZN',
      AO: 'AOA',
    },
    providers: {
      MZ: 'EMOLA',
      AO: 'MULTICAIXA',
    },
  });
});

export default router;
