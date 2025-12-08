import { StateMachineNode } from "../state/types";

/**
 * Router Service
 * 
 * Determines the next state based on current node's transition rules
 * and user input.
 */
export class RouterService {
  /**
   * Determine the next state based on transition rules
   */
  async nextState(
    currentState: string,
    node: StateMachineNode,
    input: string,
    context?: Record<string, unknown>
  ): Promise<string> {
    // If no transitions defined, stay in current state
    if (!node.transitions || node.transitions.length === 0) {
      return currentState;
    }

    // Evaluate each transition in order
    for (const transition of node.transitions) {
      const matches = this.evaluateCondition(
        transition.condition,
        input,
        context
      );

      if (matches) {
        return transition.next;
      }
    }

    // Default: return first transition's next state (fallback)
    return node.transitions[0].next;
  }

  /**
   * Evaluate a transition condition
   */
  private evaluateCondition(
    condition: string,
    input: string,
    context?: Record<string, unknown>
  ): boolean {
    const normalizedInput = input.toLowerCase().trim();
    const normalizedCondition = condition.toLowerCase();

    // "always" condition - always matches
    if (normalizedCondition === "always" || normalizedCondition === "default") {
      return true;
    }

    // "choice:" prefix - exact choice match
    if (normalizedCondition.startsWith("choice:")) {
      const expectedChoice = normalizedCondition.replace("choice:", "").trim();
      return normalizedInput === expectedChoice || normalizedInput.includes(expectedChoice);
    }

    // "contains:" prefix - substring match
    if (normalizedCondition.startsWith("contains:")) {
      const searchTerm = normalizedCondition.replace("contains:", "").trim();
      return normalizedInput.includes(searchTerm);
    }

    // "regex:" prefix - regex match
    if (normalizedCondition.startsWith("regex:")) {
      const pattern = condition.replace(/^regex:/i, "").trim();
      try {
        const regex = new RegExp(pattern, "i");
        return regex.test(input);
      } catch {
        console.warn(`[Router] Invalid regex pattern: ${pattern}`);
        return false;
      }
    }

    // "is_missing:" prefix - check if context value is missing
    if (normalizedCondition.startsWith("is_missing(")) {
      const match = condition.match(/is_missing\(([^)]+)\)/i);
      if (match) {
        const path = match[1].replace("input.", "");
        return !context || context[path] === undefined || context[path] === null || context[path] === "";
      }
    }

    // "has:" prefix - check if context has value
    if (normalizedCondition.startsWith("has(")) {
      const match = condition.match(/has\(([^)]+)\)/i);
      if (match) {
        const path = match[1].replace("input.", "");
        return context !== undefined && context[path] !== undefined && context[path] !== null;
      }
    }

    // "yes/no" style conditions
    if (normalizedCondition === "yes" || normalizedCondition === "affirmative") {
      return /^(yes|yeah|yep|yup|sure|ok|okay|correct|right|true|1)$/i.test(normalizedInput);
    }
    if (normalizedCondition === "no" || normalizedCondition === "negative") {
      return /^(no|nope|nah|not|false|0)$/i.test(normalizedInput);
    }

    // Direct string comparison (case-insensitive)
    return normalizedInput === normalizedCondition || normalizedInput.includes(normalizedCondition);
  }

  /**
   * Get all possible next states from a node
   */
  getPossibleNextStates(node: StateMachineNode): string[] {
    if (!node.transitions) return [];
    return [...new Set(node.transitions.map(t => t.next))];
  }

  /**
   * Check if a state is terminal (no outgoing transitions)
   */
  isTerminalState(node: StateMachineNode): boolean {
    return !node.transitions || node.transitions.length === 0;
  }

  /**
   * Validate transition rules for a node
   */
  validateTransitions(node: StateMachineNode, allStates: string[]): string[] {
    const errors: string[] = [];

    if (!node.transitions) return errors;

    for (const transition of node.transitions) {
      // Check if target state exists
      if (!allStates.includes(transition.next)) {
        errors.push(`Node ${node.id}: transition target '${transition.next}' does not exist`);
      }

      // Check for empty condition
      if (!transition.condition || transition.condition.trim() === "") {
        errors.push(`Node ${node.id}: transition to '${transition.next}' has empty condition`);
      }
    }

    // Check if there's a fallback/always condition
    const hasAlways = node.transitions.some(
      t => t.condition.toLowerCase() === "always" || t.condition.toLowerCase() === "default"
    );
    if (!hasAlways && node.transitions.length > 0) {
      // Warning, not error - might be intentional
      console.warn(`[Router] Node ${node.id} has no 'always' fallback transition`);
    }

    return errors;
  }
}

