import * as fs from "fs";
import * as path from "path";
import { StateMachineDefinition, StateMachineNode, NodeController } from "./types";

// Import controllers
import {
  DemographicsController,
  MedicalHistoryController,
  MedicationsController,
  SystemsReviewController,
  CardioSymptomsController,
  RespiratoryController,
  PreventiveScreeningController,
  SummaryController
} from "../controllers";

/**
 * Controller Registry
 * Maps controller names to implementations
 */
const CONTROLLER_REGISTRY: Record<string, NodeController> = {
  DemographicsController: new DemographicsController(),
  MedicalHistoryController: new MedicalHistoryController(),
  MedicationsController: new MedicationsController(),
  SystemsReviewController: new SystemsReviewController(),
  CardioSymptomsController: new CardioSymptomsController(),
  RespiratoryController: new RespiratoryController(),
  PreventiveScreeningController: new PreventiveScreeningController(),
  SummaryController: new SummaryController()
};

/**
 * State Machine Loader
 * 
 * Loads state machine definition from JSON and attaches controllers.
 */
export class StateMachineLoader {
  private definition: StateMachineDefinition | null = null;
  private controllers: Map<string, NodeController> = new Map();

  /**
   * Load state machine from JSON file
   */
  load(filePath?: string): StateMachineDefinition {
    const jsonPath = filePath || path.join(__dirname, "machine.json");
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`State machine file not found: ${jsonPath}`);
    }

    const content = fs.readFileSync(jsonPath, "utf-8");
    const definition: StateMachineDefinition = JSON.parse(content);

    // Validate structure
    this.validate(definition);

    // Attach controllers to nodes
    this.attachControllers(definition);

    this.definition = definition;
    return definition;
  }

  /**
   * Validate state machine definition
   */
  private validate(definition: StateMachineDefinition): void {
    const errors: string[] = [];

    // Check required fields
    if (!definition.id) errors.push("Missing 'id' field");
    if (!definition.name) errors.push("Missing 'name' field");
    if (!definition.initialState) errors.push("Missing 'initialState' field");
    if (!definition.nodes || Object.keys(definition.nodes).length === 0) {
      errors.push("Missing or empty 'nodes' field");
    }

    // Check initial state exists
    if (definition.nodes && !definition.nodes[definition.initialState]) {
      errors.push(`Initial state '${definition.initialState}' not found in nodes`);
    }

    // Validate each node
    const allStates = Object.keys(definition.nodes || {});
    for (const [nodeId, node] of Object.entries(definition.nodes || {})) {
      // Check node ID matches key
      if (node.id !== nodeId) {
        errors.push(`Node '${nodeId}' has mismatched id: '${node.id}'`);
      }

      // Check required fields
      if (!node.prompt) {
        errors.push(`Node '${nodeId}' missing 'prompt' field`);
      }
      if (!node.inputType) {
        errors.push(`Node '${nodeId}' missing 'inputType' field`);
      }

      // Validate choices for choice type
      if (node.inputType === "choice" && (!node.choices || node.choices.length === 0)) {
        errors.push(`Node '${nodeId}' is type 'choice' but has no choices`);
      }

      // Validate transitions reference existing states
      if (node.transitions) {
        for (const transition of node.transitions) {
          if (!allStates.includes(transition.next)) {
            errors.push(`Node '${nodeId}' has transition to unknown state '${transition.next}'`);
          }
        }
      }

      // Validate controller reference
      if (node.controller && !CONTROLLER_REGISTRY[node.controller]) {
        console.warn(`Warning: Node '${nodeId}' references unknown controller '${node.controller}'`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`State machine validation errors:\n${errors.join("\n")}`);
    }
  }

  /**
   * Attach controller instances to nodes
   */
  private attachControllers(definition: StateMachineDefinition): void {
    for (const node of Object.values(definition.nodes)) {
      if (node.controller) {
        const controller = CONTROLLER_REGISTRY[node.controller];
        if (controller) {
          this.controllers.set(node.id, controller);
        }
      }
    }
  }

  /**
   * Get the loaded definition
   */
  getDefinition(): StateMachineDefinition {
    if (!this.definition) {
      throw new Error("State machine not loaded. Call load() first.");
    }
    return this.definition;
  }

  /**
   * Get a specific node
   */
  getNode(nodeId: string): StateMachineNode | undefined {
    if (!this.definition) {
      throw new Error("State machine not loaded. Call load() first.");
    }
    return this.definition.nodes[nodeId];
  }

  /**
   * Get the initial state
   */
  getInitialState(): string {
    if (!this.definition) {
      throw new Error("State machine not loaded. Call load() first.");
    }
    return this.definition.initialState;
  }

  /**
   * Get controller for a node
   */
  getController(nodeId: string): NodeController | undefined {
    return this.controllers.get(nodeId);
  }

  /**
   * Get all node IDs
   */
  getAllNodeIds(): string[] {
    if (!this.definition) {
      throw new Error("State machine not loaded. Call load() first.");
    }
    return Object.keys(this.definition.nodes);
  }

  /**
   * Check if a state is terminal (no outgoing transitions)
   */
  isTerminalState(nodeId: string): boolean {
    const node = this.getNode(nodeId);
    return !node || !node.transitions || node.transitions.length === 0;
  }
}

// Export singleton instance
export const stateMachineLoader = new StateMachineLoader();

