# MyDoctor 🩺

An AI-powered health assistant monorepo built with React, TypeScript, pnpm workspaces, and Turborepo.

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| `@mydoctor/app` | 1.0.0 | React frontend application |
| `@mydoctor/state-machine` | 2.0.0 | **NEW** - Enhanced state machine with analytics, screening logic, risk scores, multilingual support |
| `@mydoctor/state-machine-v1` | 1.0.0 | Legacy state machine (maintained for backwards compatibility) |

## 🛠 Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: React 18 + TypeScript
- **Bundler**: Parcel
- **Package Manager**: pnpm

## 📁 Project Structure

```
MyDoctor/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspace definition
├── turbo.json                # Turborepo pipeline config
├── tsconfig.base.json        # Shared TypeScript config
│
└── packages/
    ├── app/                  # @mydoctor/app
    │   └── src/
    │       ├── App.tsx       # Uses @mydoctor/state-machine (v2)
    │       └── ...
    │
    ├── state-machine/        # @mydoctor/state-machine (v2)
    │   └── src/
    │       ├── core/
    │       │   ├── state.enum.ts
    │       │   ├── state-machine.ts
    │       │   ├── orchestrator.ts
    │       │   ├── router.ts
    │       │   └── nodes.ts
    │       └── modules/
    │           ├── analytics/
    │           ├── context-memory/
    │           ├── multilingual/
    │           ├── nlp/
    │           ├── patient-profile/
    │           ├── prompt-engine/
    │           ├── risk-scores/
    │           └── screening-logic/
    │
    └── state-machine-v1/     # @mydoctor/state-machine-v1 (legacy)
        └── src/
            └── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
# App runs at http://localhost:1234
```

### Build

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

## ✨ New in state-machine v2

The new `@mydoctor/state-machine` package includes:

- **Analytics** — Track user interactions and events
- **Screening Logic** — Smart follow-up question suggestions
- **Risk Scores** — BMI calculation, blood pressure classification
- **Multilingual** — Language detection and translation support
- **MVP & Full Flows** — Pre-configured node sets for different use cases

### Usage Example

```typescript
import { 
  Orchestrator, 
  mvpNodes,
  InMemoryProfileStore,
  InMemorySessionMemory,
  DummyNLP,
  PromptEngine,
  Router,
  AnalyticsConsole,
  ScreeningLogicImpl,
  RiskScoresImpl,
  TranslatorStub
} from "@mydoctor/state-machine";

const orchestrator = new Orchestrator({
  profileStore: new InMemoryProfileStore(),
  sessionMemory: new InMemorySessionMemory(),
  nlp: new DummyNLP(),
  promptEngine: new PromptEngine(),
  router: new Router(),
  analytics: new AnalyticsConsole(),
  screening: new ScreeningLogicImpl(),
  risk: new RiskScoresImpl(),
  translator: new TranslatorStub(),
  nodes: mvpNodes  // or standardNodes / extendedNodes for more states
});

const response = await orchestrator.handleInput("yes", { 
  sessionId: "session-1", 
  userId: "user-1" 
});
```

## 📋 Package Dependencies

```
@mydoctor/app
     │
     ├─────────────────────────┐
     ▼                         ▼
@mydoctor/state-machine    @mydoctor/state-machine-v1
     (v2 - active)              (v1 - legacy)
```

## 📚 Documentation

- **[Production Architecture](README-architecture.md)** - How the application works in production (EC2, Nginx, PM2, request flow)
- **[Deployment Guide](README-deployment.md)** - Step-by-step AWS EC2 deployment
- **[Call Feature](README-calls.md)** - WebRTC audio call implementation

## ⚠️ Disclaimer

**MyDoctor is not a substitute for professional medical advice, diagnosis, or treatment.**

## 📄 License

ISC License
