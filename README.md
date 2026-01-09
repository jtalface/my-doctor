# MyDoctor 🩺

An AI-powered health assistant monorepo built with React, TypeScript, pnpm workspaces, and Turborepo.

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| `@mydoctor/app` | 1.0.0 | React frontend application |
| `@mydoctor/webapp` | 1.0.0 | Main web application with health features |
| `@mydoctor/webapp-backend` | 1.0.0 | Backend API server |
| `@mydoctor/state-machine` | 2.0.0 | **NEW** - Enhanced state machine with analytics, screening logic, risk scores, multilingual support |
| `@mydoctor/state-machine-v1` | 1.0.0 | Legacy state machine (maintained for backwards compatibility) |

## 🌟 Features

### Core Health Features
- **AI-Powered Health Checkups** — Interactive symptom assessment and health analysis
- **Health History** — Track and review past checkup sessions
- **Secure Messaging** — Communicate with healthcare providers
- **Dependent Management** — Track health for family members

### Specialized Health Trackers

#### 🌸 Cycle Tracker
Period tracking with predictions, symptom logging, and insights. Available for female users age 10+.
- Period predictions and ovulation tracking
- Symptom and mood logging
- Calendar view and history
- Data export for healthcare providers

#### 🩸 GlucoGuide - Diabetes Management Tracker ⚠️
**IMPORTANT: For educational purposes only. Not a substitute for medical advice.**

A comprehensive glucose tracking system for diabetes management with safety-first design:
- Glucose reading logging with context (fasting, post-meal, etc.)
- Transparent, rule-based educational suggestions
- Pattern detection and analytics
- A1C estimation and time-in-range tracking
- Data export for healthcare team
- Full audit trail for safety compliance

#### ❤️ PressurePal (Blood Pressure Tracker)
Home blood pressure monitoring with comprehensive safety features. Opt-in for all users.
- Multi-reading session logging with automatic averaging
- 8-point measurement quality checklist
- BP classification and target tracking
- Emergency recognition (hypertensive crisis detection)
- Transparent, safety-first rule-based suggestions
- Pattern detection (persistent elevation, variability, adherence)
- AM/PM comparison and scheduling
- Data export for healthcare providers
- Full audit trail and clinical safety documentation

**Safety Features:**
- All suggestions are educational only (NO medical advice)
- Never recommends medication or insulin dose changes
- Clear disclaimers on every suggestion
- Emergency guidance for critical situations
- Comprehensive unit tests for all safety rules

📄 **See `CLINICAL-SAFETY-NOTES-GLUCOSE.md` for complete safety documentation.**

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
