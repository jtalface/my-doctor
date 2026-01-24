/**
 * Payment Reconciliation Job
 * 
 * Periodic job that checks stuck PENDING payments and queries provider status.
 * Runs every 15 minutes by default.
 * 
 * For Phase 1, queryStatus is stubbed - real implementation will be added
 * when provider APIs are integrated.
 */

import { paymentOrchestrator } from '../paymentOrchestrator.js';
import { isTerminalStatus } from '../mapping/statusMapping.js';

/**
 * Default reconciliation interval (15 minutes)
 */
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Payments older than this (in minutes) are eligible for reconciliation
 */
const PENDING_AGE_THRESHOLD_MINUTES = 10;

/**
 * Maximum payments to reconcile per batch
 */
const MAX_BATCH_SIZE = 50;

/**
 * Reconciliation job state
 */
let intervalId: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Run reconciliation for a single payment
 */
async function reconcilePayment(paymentId: string): Promise<{ success: boolean; newStatus?: string; error?: string }> {
  try {
    const status = await paymentOrchestrator.queryProviderStatus(paymentId);
    return { success: true, newStatus: status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run a single reconciliation batch
 */
export async function runReconciliation(): Promise<{
  processed: number;
  updated: number;
  errors: number;
}> {
  if (isRunning) {
    console.log('[Reconcile] Job already running, skipping');
    return { processed: 0, updated: 0, errors: 0 };
  }
  
  isRunning = true;
  const startTime = Date.now();
  
  console.log('[Reconcile] Starting reconciliation job');
  
  let processed = 0;
  let updated = 0;
  let errors = 0;
  
  try {
    // Get pending payments older than threshold
    const pendingPayments = await paymentOrchestrator.getPendingPaymentsForReconciliation(
      PENDING_AGE_THRESHOLD_MINUTES
    );
    
    console.log(`[Reconcile] Found ${pendingPayments.length} payments to reconcile`);
    
    // Process payments in batches
    const batch = pendingPayments.slice(0, MAX_BATCH_SIZE);
    
    for (const payment of batch) {
      processed++;
      
      const result = await reconcilePayment(payment._id.toString());
      
      if (result.success) {
        if (result.newStatus && isTerminalStatus(result.newStatus as any)) {
          updated++;
          console.log(`[Reconcile] Payment ${payment._id} updated to ${result.newStatus}`);
        }
      } else {
        errors++;
        console.error(`[Reconcile] Payment ${payment._id} failed: ${result.error}`);
      }
      
      // Small delay between queries to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Reconcile] Completed: processed=${processed}, updated=${updated}, errors=${errors}, duration=${duration}ms`);
    
  } catch (error) {
    console.error('[Reconcile] Job failed:', error);
    errors++;
  } finally {
    isRunning = false;
  }
  
  return { processed, updated, errors };
}

/**
 * Start the reconciliation scheduler
 */
export function startReconciliationScheduler(intervalMs: number = DEFAULT_INTERVAL_MS): void {
  if (intervalId) {
    console.log('[Reconcile] Scheduler already running');
    return;
  }
  
  console.log(`[Reconcile] Starting scheduler (interval: ${intervalMs / 1000}s)`);
  
  // Run immediately on start
  runReconciliation().catch(console.error);
  
  // Schedule periodic runs
  intervalId = setInterval(() => {
    runReconciliation().catch(console.error);
  }, intervalMs);
}

/**
 * Stop the reconciliation scheduler
 */
export function stopReconciliationScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Reconcile] Scheduler stopped');
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return intervalId !== null;
}

/**
 * Parse cron-style interval from environment
 * Simplified: only supports "* /N * * * *" format (every N minutes)
 */
export function parseCronInterval(cronExpression: string): number {
  // Default to 15 minutes
  if (!cronExpression) {
    return DEFAULT_INTERVAL_MS;
  }
  
  // Match patterns like "*/15 * * * *" (every 15 minutes)
  const match = cronExpression.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (match && match[1]) {
    const minutes = parseInt(match[1], 10);
    if (minutes > 0 && minutes <= 60) {
      return minutes * 60 * 1000;
    }
  }
  
  console.warn(`[Reconcile] Invalid cron expression: ${cronExpression}, using default 15 minutes`);
  return DEFAULT_INTERVAL_MS;
}
