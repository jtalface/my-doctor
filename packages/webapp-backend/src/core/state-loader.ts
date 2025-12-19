import * as fs from 'fs';
import * as path from 'path';

export interface StateNode {
  id: string;
  prompt: string;
  helpText?: string;
  inputType: 'choice' | 'text' | 'none';
  choices?: string[];
  transitions: Record<string, string>;
  isTerminal?: boolean;
  isRedFlag?: boolean;
  isRedFlagNode?: boolean;
}

export interface StateMachine {
  metadata: {
    name: string;
    version: string;
    description: string;
  };
  initialState: string;
  nodes: Record<string, StateNode>;
}

class StateLoader {
  private machine: StateMachine | null = null;

  load(): StateMachine {
    if (this.machine) {
      return this.machine;
    }

    // Try multiple paths for the machine.json file
    const possiblePaths = [
      path.resolve(process.cwd(), 'src/state/machine.json'),
      path.resolve(process.cwd(), 'dist/state/machine.json'),
      path.resolve(__dirname, '../state/machine.json'),
      path.resolve(__dirname, '../../state/machine.json'),
    ];

    let machineData: string | null = null;
    let loadedPath: string | null = null;

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        machineData = fs.readFileSync(p, 'utf-8');
        loadedPath = p;
        break;
      }
    }

    if (!machineData) {
      throw new Error(`State machine file not found. Tried: ${possiblePaths.join(', ')}`);
    }

    console.log(`[StateLoader] Loaded state machine from: ${loadedPath}`);
    
    this.machine = JSON.parse(machineData) as StateMachine;
    this.validate();
    
    return this.machine;
  }

  private validate(): void {
    if (!this.machine) {
      throw new Error('No machine loaded');
    }

    const { initialState, nodes } = this.machine;

    // Check initial state exists
    if (!nodes[initialState]) {
      throw new Error(`Initial state "${initialState}" not found in nodes`);
    }

    // Validate all transitions point to existing nodes
    for (const [nodeId, node] of Object.entries(nodes)) {
      for (const [_trigger, targetState] of Object.entries(node.transitions)) {
        if (!nodes[targetState]) {
          throw new Error(`Node "${nodeId}" has invalid transition to "${targetState}"`);
        }
      }
    }

    console.log(`[StateLoader] Validated ${Object.keys(nodes).length} nodes`);
  }

  getNode(nodeId: string): StateNode | null {
    if (!this.machine) {
      this.load();
    }
    return this.machine?.nodes[nodeId] || null;
  }

  getInitialState(): string {
    if (!this.machine) {
      this.load();
    }
    return this.machine!.initialState;
  }

  getNextState(currentNodeId: string, input: string): string {
    const node = this.getNode(currentNodeId);
    if (!node) {
      throw new Error(`Node "${currentNodeId}" not found`);
    }

    // Check for specific transition
    if (node.transitions[input]) {
      return node.transitions[input];
    }

    // Check for default transition
    if (node.transitions['default']) {
      return node.transitions['default'];
    }

    // If terminal, return same state
    if (node.isTerminal) {
      return currentNodeId;
    }

    throw new Error(`No transition found for input "${input}" in node "${currentNodeId}"`);
  }

  getAllNodes(): StateNode[] {
    if (!this.machine) {
      this.load();
    }
    return Object.values(this.machine!.nodes);
  }

  getNodeCount(): number {
    if (!this.machine) {
      this.load();
    }
    return Object.keys(this.machine!.nodes).length;
  }
}

export const stateLoader = new StateLoader();

