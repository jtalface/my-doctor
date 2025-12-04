# Monorepo Explained 📦

## What is a Monorepo?

A **monorepo** (monolithic repository) is a single Git repository that contains multiple distinct projects/packages that can depend on each other. Instead of having separate repos for each package, everything lives together.

```
Traditional Multi-Repo:          Monorepo:
┌─────────────────┐              ┌─────────────────────────────┐
│ repo: app       │              │ repo: mydoctor              │
│ └── src/        │              │ └── packages/               │
└─────────────────┘              │     ├── app/                │
┌─────────────────┐              │     └── state-machine-v1/   │
│ repo: state-machine            └─────────────────────────────┘
│ └── src/        │              
└─────────────────┘
```

---

## Tools Used

### 1. pnpm Workspaces — Package Linking

pnpm is a fast, disk-efficient package manager. Its **workspaces** feature lets packages within the monorepo depend on each other without publishing to npm.

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - "packages/*"
```

This tells pnpm: "Every folder under `packages/` is a workspace package."

**How it works:**
- When `@mydoctor/app` declares `"@mydoctor/state-machine-v1": "workspace:*"` as a dependency
- pnpm creates a symlink instead of downloading from npm
- Changes in one package are instantly available to dependent packages

---

### 2. Turborepo — Build Orchestration

Turborepo is a build system that understands your package dependency graph and:
- Runs tasks in the correct order
- Parallelizes independent tasks
- Caches results to skip redundant work

**`turbo.json`**:
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "outputs": ["dist/**"]    // Cache these outputs
    },
    "dev": {
      "cache": false,           // Don't cache dev server
      "persistent": true        // Keep running
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

**The `^` prefix means**: "Run this task on dependencies first"

Example: When you run `pnpm build`:
```
1. @mydoctor/state-machine-v1:build  (no deps, runs first)
2. @mydoctor/app:build               (depends on state-machine-v1)
```

---

## Package Structure

```
MyDoctor/
├── package.json          # Root: defines workspaces & scripts
├── pnpm-workspace.yaml   # Tells pnpm which folders are packages
├── turbo.json            # Defines build pipelines
├── tsconfig.base.json    # Shared TypeScript config
│
└── packages/
    ├── state-machine-v1/ # @mydoctor/state-machine-v1 (core package)
    │   └── package.json  # Contains state machine + all modules
    │
    └── app/              # @mydoctor/app
        └── package.json  # Depends on state-machine-v1
```

---

## Dependency Graph

```
@mydoctor/app
     │
     ▼
@mydoctor/state-machine-v1
     │
     └── modules/
         ├── ContextMemory/
         ├── NLP/
         ├── PatientProfile/
         └── PromptEngine/
```

---

## How Dependencies Work

**`packages/app/package.json`**:
```json
{
  "dependencies": {
    "@mydoctor/state-machine-v1": "workspace:*"
  }
}
```

The `workspace:*` protocol tells pnpm:
- "Link to the local package, don't download from npm"
- The `*` means "accept any version"

**In your code, you import like this:**
```typescript
// packages/app/src/App.tsx
import { 
  StateMachine, 
  Orchestrator, 
  Router,
  DummyNLP, 
  PromptEngine,
  InMemoryProfileStore,
  InMemorySessionMemory
} from "@mydoctor/state-machine-v1";
```

Everything is exported from a single package now.

---

## Key Commands

| Command | What Happens |
|---------|--------------|
| `pnpm install` | Installs all deps + creates symlinks between packages |
| `pnpm dev` | Turborepo runs `dev` task in `@mydoctor/app` |
| `pnpm build` | Turborepo builds all packages in dependency order |
| `pnpm typecheck` | Type checks all packages in parallel |
| `pnpm add lodash --filter @mydoctor/app` | Add dep to specific package |

---

## Benefits of This Setup

1. **Atomic Changes** — Update multiple packages in one commit
2. **Shared Code** — Packages import from each other easily
3. **Consistent Tooling** — One tsconfig, one linter config
4. **Fast Builds** — Turborepo caches unchanged packages
5. **Simple CI/CD** — One repo to clone, test, deploy

---

## Quick Reference

| Tool | Purpose | Config File |
|------|---------|-------------|
| **pnpm** | Package manager + workspace linking | `pnpm-workspace.yaml` |
| **Turborepo** | Task orchestration + caching | `turbo.json` |
| **TypeScript** | Shared base config | `tsconfig.base.json` |
| **Parcel** | Bundler (in app package only) | — |

---

## Adding a New Package

1. Create a new directory: `packages/my-new-package/`

2. Add a `package.json`:
```json
{
  "name": "@mydoctor/my-new-package",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

3. Add a `tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

4. Create `src/index.ts` with your exports

5. Run `pnpm install` to link the new package

6. Other packages can now depend on it:
```json
{
  "dependencies": {
    "@mydoctor/my-new-package": "workspace:*"
  }
}
```

---

## Common Operations

### Add a dependency to a specific package
```bash
pnpm add axios --filter @mydoctor/app
```

### Add a dev dependency to root
```bash
pnpm add -D eslint -w
```

### Run a command in a specific package
```bash
pnpm --filter @mydoctor/state-machine-v1 typecheck
```

### Run a command in all packages
```bash
pnpm -r typecheck
```

---

## Turborepo Caching

Turborepo caches task outputs. If nothing changed, it skips the task:

```
$ pnpm build

@mydoctor/state-machine-v1:build: cache hit, replaying logs
@mydoctor/app:build: cache hit, replaying logs

Tasks:    2 successful, 2 total
Cached:   2 cached, 2 total
Time:     89ms >>> FULL TURBO
```

To clear the cache:
```bash
rm -rf .turbo
```

---

## Further Reading

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
