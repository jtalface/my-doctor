/**
 * Utility functions for node definitions
 */

export interface FlowMeta {
  flow_name: string;
  version: string;
  description: string;
}

/**
 * Creates flow metadata with the current date as version
 */
export function createFlowMeta(
  flowName: string = "annual_checkup_v1",
  description: string = "Educational/advisory annual primary-care visit. Consent-first, structured intake, systems review, preventive screening check, summary. Not a substitute for in-person care. Persist data only with consent."
): FlowMeta {
  return {
    flow_name: flowName,
    version: getCurrentDateVersion(),
    description
  };
}

/**
 * Gets the current date in YYYY-MM-DD format
 */
export function getCurrentDateVersion(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

