import { State } from "./state.enum";
import { NodeDef } from "./nodes";

// Very simple router that interprets basic conditions encoded as strings.
export class Router {
  async nextState(current: State, node: NodeDef, userInput: string): Promise<State> {
    const input = userInput.trim().toLowerCase();

    for(const t of node.transitions){
      const cond = t.condition;
      if(cond === "always") return t.next;
      if(cond.startsWith("equals(")){
        const match = cond.match(/equals\(input,'(.+)'\)/);
        const target = match?.[1];
        if(target && input === target.toLowerCase()) return t.next;
      }
      if(cond.startsWith("match(")){
        const m = cond.match(/match\(input,(.+)\)/);
        if(m && m[1]){
          const regexBody = m[1].slice(1, -1); // strip leading/ending /
          const lastSlash = regexBody.lastIndexOf("/");
          const pattern = regexBody.slice(0, lastSlash);
          const flags = regexBody.slice(lastSlash+1) || "i";
          const re = new RegExp(pattern, flags);
          if(re.test(userInput)) return t.next;
        }
      }
    }
    // fallback: stay or end
    const lastTransition = node.transitions[node.transitions.length - 1];
    return lastTransition ? lastTransition.next : current;
  }
}
