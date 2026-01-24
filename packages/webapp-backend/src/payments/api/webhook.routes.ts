/**
 * Webhook Routes
 * 
 * Endpoints for receiving payment provider webhooks.
 * Each provider has its own endpoint for proper routing and verification.
 * 
 * Endpoints:
 * - POST /api/webhooks/emola - eMola payment notifications
 * - POST /api/webhooks/multicaixa - Multicaixa payment notifications
 * - POST /api/webhooks/mock/:provider - Dev endpoint to simulate webhooks
 */

import { Router, Request, Response, raw } from 'express';
import { paymentOrchestrator } from '../paymentOrchestrator.js';
import { PaymentProvider } from '../models/payment.model.js';

const router = Router();

/**
 * Middleware to capture raw body for signature verification
 * Must be used before express.json() for webhook routes
 */
router.use((req, res, next) => {
  // Store raw body if not already stored
  if (req.body && typeof req.body === 'object' && !req.rawBody) {
    req.rawBody = JSON.stringify(req.body);
  }
  next();
});

// Extend Express Request to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

/**
 * Generic webhook handler
 */
async function handleWebhook(
  providerName: PaymentProvider,
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log(`[Webhook] Received ${providerName} webhook`);
    
    // Get headers as plain object
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value[0];
      }
    }
    
    // Get raw body for signature verification
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    // Process webhook
    const result = await paymentOrchestrator.processWebhook(
      providerName,
      headers,
      rawBody,
      req.body
    );
    
    if (result.success) {
      console.log(`[Webhook] ${providerName} webhook processed: payment=${result.paymentId}, status=${result.status}`);
      res.status(200).json({
        success: true,
        paymentId: result.paymentId,
        status: result.status,
      });
    } else {
      console.warn(`[Webhook] ${providerName} webhook: payment not found`);
      // Return 200 to acknowledge receipt even if payment not found
      // This prevents provider from retrying unnecessarily
      res.status(200).json({
        success: false,
        message: 'Payment not found for reference',
      });
    }
  } catch (error) {
    console.error(`[Webhook] ${providerName} webhook error:`, error);
    
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    
    // Return 400 for verification failures (provider should not retry)
    if (message.includes('verification failed')) {
      res.status(400).json({
        error: 'VERIFICATION_FAILED',
        message,
      });
      return;
    }
    
    // Return 500 for other errors (provider may retry)
    res.status(500).json({
      error: 'WEBHOOK_ERROR',
      message,
    });
  }
}

/**
 * POST /api/webhooks/emola
 * 
 * eMola payment webhook endpoint.
 * Verifies signature and processes payment status updates.
 */
router.post('/emola', async (req: Request, res: Response) => {
  await handleWebhook('EMOLA', req, res);
});

/**
 * POST /api/webhooks/multicaixa
 * 
 * Multicaixa Express payment webhook endpoint.
 * Verifies signature and processes payment status updates.
 */
router.post('/multicaixa', async (req: Request, res: Response) => {
  await handleWebhook('MULTICAIXA', req, res);
});

/**
 * POST /api/webhooks/mock/:provider
 * 
 * DEV ONLY: Simulate a webhook for testing.
 * Only available when NODE_ENV !== 'production'
 * 
 * Request body:
 * {
 *   "reference": "provider-reference",
 *   "status": "SUCCESS" | "FAILED" | "EXPIRED"
 * }
 */
router.post('/mock/:provider', async (req: Request, res: Response) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const { provider } = req.params;
  const { reference, status, amount, reason } = req.body;
  
  if (!reference || !status) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'reference and status are required',
    });
  }
  
  // Map provider param to provider name
  const providerName = provider.toUpperCase() as PaymentProvider;
  if (providerName !== 'EMOLA' && providerName !== 'MULTICAIXA') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid provider. Use emola or multicaixa',
    });
  }
  
  // Create mock webhook payload
  const mockPayload = {
    reference,
    status,
    amount,
    reason,
    timestamp: new Date().toISOString(),
    mock: true,
  };
  
  // Add mock headers that will pass verification in dev mode
  const mockHeaders: Record<string, string> = {
    'content-type': 'application/json',
  };
  
  try {
    const result = await paymentOrchestrator.processWebhook(
      providerName,
      mockHeaders,
      JSON.stringify(mockPayload),
      mockPayload
    );
    
    res.json({
      success: true,
      message: 'Mock webhook processed',
      paymentId: result.paymentId,
      status: result.status,
    });
  } catch (error) {
    res.status(500).json({
      error: 'WEBHOOK_ERROR',
      message: error instanceof Error ? error.message : 'Mock webhook failed',
    });
  }
});

export default router;
