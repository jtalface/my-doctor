# MyDoctor 🩺

An AI-powered health assistant application built with React, TypeScript, and Parcel. MyDoctor conducts structured wellness check-ins using a state machine architecture, guiding patients through comprehensive health assessments.

## ✨ Features

- **Conversational Health Check-ins** — Guided wellness assessments with natural flow
- **State Machine Architecture** — Predictable, testable conversation management
- **Symptom Escalation** — Automatic detection of urgent symptoms requiring immediate care
- **Patient Profile Management** — Store and retrieve patient medical history
- **Session Memory** — Context-aware conversations that remember previous exchanges
- **Modular Design** — Easily swap NLP providers, storage backends, and routing logic
- **PHQ-2 Screening** — Built-in mental health screening questionnaire
- **Preventive Care Tracking** — Vaccination and screening reminders

## 🛠 Tech Stack

- **React 18** — UI framework with hooks
- **TypeScript** — Type-safe development
- **Parcel** — Zero-config bundler with HMR
- **CSS Modules** — Scoped styling

## 📁 Project Structure

```
src/
├── App.tsx                          # Main application component
├── App.module.css                   # Application styles
├── index.tsx                        # React entry point
│
└── components/
    ├── StateMachine/                # Core state machine
    │   ├── index.ts                 # Barrel exports
    │   ├── Machine.ts               # State definitions & prompts
    │   ├── StateMachine.ts          # State machine class
    │   ├── Router.ts                # Input-based state routing
    │   ├── Orchestrator.ts          # Coordinates all modules
    │   └── types/
    │       ├── states.ts            # State enum (38+ states)
    │       └── state-machine.ts     # TypeScript interfaces
    │
    └── modules/                     # Pluggable modules
        ├── ContextMemory/           # Session context storage
        │   ├── types.ts
        │   └── InMemorySessionMemory.ts
        ├── NLP/                     # Language model interface
        │   ├── types.ts
        │   └── DummyNLP.ts
        ├── PatientProfile/          # Patient data management
        │   ├── types.ts
        │   └── InMemoryProfileStore.ts
        └── PromptEngine/            # Contextual prompt builder
            └── PromptEngine.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/MyDoctor.git
cd MyDoctor

# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at **http://localhost:1234**

### Build for Production

```bash
npm run build
```

Output will be in the `/dist` folder.

## 🏗 Architecture

### State Machine Flow

```
START → PRIVACY_SUMMARY → AGENDA → DEMOGRAPHICS → MEDICAL_HISTORY
                              ↓
                        MEDICATIONS → ALLERGIES → SOCIAL_HISTORY
                              ↓
                    SYSTEMS_REVIEW (Cardio, Resp, GI, Neuro, MSK, Psych)
                              ↓
                    PREVENTIVE_SCREENINGS → VACCINATIONS
                              ↓
                        SUMMARY_PLAN → END
                              
        ⚠️ Urgent symptoms → ESCALATE → END_ESCALATED
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `StateMachine` | Manages current state and valid transitions |
| `Router` | Determines next state based on user input patterns |
| `Orchestrator` | Coordinates NLP, memory, profile, and routing |
| `PromptEngine` | Builds context-rich prompts for the LLM |
| `SessionMemory` | Stores conversation context within a session |
| `PatientProfile` | Persists patient medical data across sessions |

### Extending the NLP Module

Replace `DummyNLP` with your preferred LLM provider:

```typescript
import { NLP } from "./components/modules/NLP";

class OpenAINLP implements NLP {
  async complete(prompt: string): Promise<string> {
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content;
  }
}
```

## 📋 Available States

The state machine includes 38+ states covering:

- **Consent & Privacy** — START, PRIVACY_SUMMARY, EPHEMERAL_CONSENT
- **Demographics** — DEMOGRAPHICS, DEMOGRAPHICS_ASKAGE
- **Medical History** — MEDICAL_HISTORY, MED_HISTORY_FOLLOWUP, MEDICATIONS, ALLERGIES
- **Systems Review** — SYSTEMS_CARDIO, SYSTEMS_RESP, SYSTEMS_GI, SYSTEMS_NEURO, SYSTEMS_MSK, SYSTEMS_PSYCH
- **Mental Health** — PHQ2, PHQ2_Q2
- **Preventive Care** — PREVENTIVE_SCREENINGS, PREVENTIVE_CHECKLIST, VACCINATIONS
- **Wrap-up** — SUMMARY_PLAN, SAVING_AND_REMINDERS
- **Escalation** — ESCALATE, ESCALATE_SUMMARY
- **End States** — END_OK, END_ESCALATED, END_EPHEMERAL, END_NOSESSION

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server with HMR |
| `npm run build` | Production build to `/dist` |
| `npm run clean` | Remove build artifacts |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

**MyDoctor is not a substitute for professional medical advice, diagnosis, or treatment.** Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. If you think you may have a medical emergency, call your doctor or emergency services immediately.

## 📄 License

ISC License — see [LICENSE](LICENSE) for details.

