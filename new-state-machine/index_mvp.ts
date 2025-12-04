import { Orchestrator } from "./core/orchestrator";
import { InMemoryProfileStore } from "./modules/patient-profile/inmemory";
import { InMemorySessionMemory } from "./modules/context-memory/inmemory";
import { DummyNLP } from "./modules/nlp/dummy";
import { PromptEngine } from "./modules/prompt-engine/prompt-engine";
import { Router } from "./core/router";
import { AnalyticsConsole } from "./modules/analytics/console";
import { ScreeningLogicImpl } from "./modules/screening-logic/screening";
import { RiskScoresImpl } from "./modules/risk-scores/risk-scores";
import { TranslatorStub } from "./modules/multilingual/translator";
import { mvpNodes } from "./core/nodes";

async function main(){
  const orch = new Orchestrator({
    profileStore: new InMemoryProfileStore(),
    sessionMemory: new InMemorySessionMemory(),
    nlp: new DummyNLP(),
    promptEngine: new PromptEngine(),
    router: new Router(),
    analytics: new AnalyticsConsole(),
    screening: new ScreeningLogicImpl(),
    risk: new RiskScoresImpl(),
    translator: new TranslatorStub(),
    nodes: mvpNodes
  });

  const sessionId = "mvp-demo-session";
  const userId = "user-456";

  console.log("=== MVP FLOW DEMO ===");
  console.log(await orch.handleInput("yes", { sessionId, userId }));
  console.log(await orch.handleInput("routine checkup", { sessionId, userId }));
  console.log(await orch.handleInput("30 male", { sessionId, userId }));
  console.log(await orch.handleInput("no chronic issues", { sessionId, userId }));
  console.log(await orch.handleInput("none", { sessionId, userId }));
  console.log("=== END MVP FLOW DEMO ===");
}

main().catch(err => { console.error(err); process.exit(1); });
