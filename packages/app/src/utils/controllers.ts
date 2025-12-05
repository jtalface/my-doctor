/**
 * Controller Placeholders
 * 
 * These controllers handle special logic for nodes that require additional processing
 * beyond the standard input/output flow. Each controller receives the user input and
 * can perform validation, transformation, or trigger side effects.
 * 
 * TODO: Implement actual controller logic as requirements are defined.
 */

export interface ControllerContext {
  /** History of states traversed in this session */
  history: string[];
  /** Current state */
  currentState: string;
  /** Session ID */
  sessionId?: string;
  /** User ID */
  userId?: string;
}

export interface ControllerResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export type ControllerFn = (input: string, context?: ControllerContext) => Promise<ControllerResult>;

/**
 * Handles agenda/focus area selection
 * Normalizes and validates user's choice of what to focus on
 */
export const agendaController: ControllerFn = async (input) => {
  // TODO: Implement agenda parsing logic
  console.log('[agendaController] Processing:', input);
  return { success: true, data: { agenda: input } };
};

/**
 * Handles demographic information parsing
 * Extracts age, sex, and other demographic data from user input
 */
export const demographicsController: ControllerFn = async (input) => {
  // TODO: Implement demographics parsing logic
  console.log('[demographicsController] Processing:', input);
  return { success: true, data: { demographics: input } };
};

/**
 * Handles medical history input
 * Parses and structures past medical conditions, surgeries, etc.
 */
export const medicalHistoryController: ControllerFn = async (input) => {
  // TODO: Implement medical history parsing logic
  console.log('[medicalHistoryController] Processing:', input);
  return { success: true, data: { medicalHistory: input } };
};

/**
 * Handles medication list input
 * Parses and validates medication names, dosages, frequencies
 */
export const medicationsController: ControllerFn = async (input) => {
  // TODO: Implement medications parsing logic
  console.log('[medicationsController] Processing:', input);
  return { success: true, data: { medications: input } };
};

/**
 * Handles vitals input
 * Parses blood pressure, weight, height, etc.
 */
export const vitalsController: ControllerFn = async (input) => {
  // TODO: Implement vitals parsing logic
  console.log('[vitalsController] Processing:', input);
  return { success: true, data: { vitals: input } };
};

/**
 * Handles symptom description and analysis
 */
export const symptomsController: ControllerFn = async (input) => {
  // TODO: Implement symptoms analysis logic
  console.log('[symptomsController] Processing:', input);
  return { success: true, data: { symptoms: input } };
};

/**
 * Handles session summary at end states
 * Logs all steps traversed during the session
 */
export const summaryController: ControllerFn = async (_input, context) => {
  console.log('\n========================================');
  console.log('📋 SESSION SUMMARY');
  console.log('========================================');
  
  if (context) {
    console.log(`\n🔹 Current State: ${context.currentState}`);
    console.log(`🔹 Session ID: ${context.sessionId || 'N/A'}`);
    console.log(`🔹 User ID: ${context.userId || 'N/A'}`);
    
    console.log('\n📍 States Traversed:');
    console.log('----------------------------------------');
    
    if (context.history.length > 0) {
      context.history.forEach((state, index) => {
        const arrow = index < context.history.length - 1 ? '  ↓' : '';
        console.log(`  ${index + 1}. ${state}${arrow}`);
      });
      console.log(`  ${context.history.length + 1}. ${context.currentState} (current)`);
    } else {
      console.log(`  1. ${context.currentState} (start & end)`);
    }
    
    console.log('\n📊 Session Statistics:');
    console.log(`  • Total states visited: ${context.history.length + 1}`);
    console.log(`  • Unique states: ${new Set([...context.history, context.currentState]).size}`);
  } else {
    console.log('⚠️  No context provided - unable to display session history');
  }
  
  console.log('========================================\n');
  
  return { 
    success: true, 
    data: { 
      summary: {
        history: context?.history || [],
        currentState: context?.currentState,
        totalSteps: (context?.history.length || 0) + 1
      }
    } 
  };
};

/**
 * Registry of all available controllers
 */
export const controllers: Record<string, ControllerFn> = {
  agendaController,
  demographicsController,
  medicalHistoryController,
  medicationsController,
  vitalsController,
  symptomsController,
  summaryController
};

/**
 * Get a controller by name
 */
export const getController = (name: string): ControllerFn | undefined => {
  return controllers[name];
};

