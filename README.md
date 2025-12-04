# MyDoctor 🩺

An AI-powered health assistant monorepo built with React, TypeScript, pnpm workspaces, and Turborepo.

## 📦 Packages

| Package | Description |
|---------|-------------|
| `@mydoctor/app` | React frontend application |
| `@mydoctor/state-machine-v1` | Core state machine, router, orchestrator, and modules |

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
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── index.html
    │   └── src/
    │       ├── index.tsx
    │       ├── App.tsx
    │       └── App.module.css
    │
    └── state-machine-v1/     # @mydoctor/state-machine-v1
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── Machine.ts
            ├── StateMachine.ts
            ├── Router.ts
            ├── Orchestrator.ts
            ├── types/
            └── modules/
                ├── ContextMemory/
                ├── NLP/
                ├── PatientProfile/
                └── PromptEngine/
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install pnpm if you haven't
npm install -g pnpm

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev

# The app will be available at http://localhost:1234
```

### Build

```bash
# Build all packages
pnpm build
```

### Type Checking

```bash
# Type check all packages
pnpm typecheck
```

### Clean

```bash
# Clean all build artifacts
pnpm clean
```

## 📋 Package Dependencies

```
@mydoctor/app
     │
     ▼
@mydoctor/state-machine-v1
```

## ✨ Features

- **38+ Health Check-in States** — Comprehensive wellness assessment flow
- **Modular Architecture** — Easily swap NLP providers, storage backends
- **Symptom Escalation** — Automatic detection of urgent symptoms
- **Session Memory** — Context-aware conversations
- **Patient Profiles** — Persistent patient data

## 🔧 Adding a New Package

1. Create a new directory under `packages/`
2. Add a `package.json` with name `@mydoctor/your-package`
3. Add a `tsconfig.json` extending the base config
4. Run `pnpm install` to link the workspace

## ⚠️ Disclaimer

**MyDoctor is not a substitute for professional medical advice, diagnosis, or treatment.**

## 📄 License

ISC License
