# Meditron Evaluation App

A web-based evaluation dashboard for testing and scoring LLM responses to medical questions, specifically designed for evaluating medical AI models like Meditron in African healthcare contexts.

## Overview

This application provides:

- **Visual Dashboard** - Real-time evaluation progress and scoring metrics
- **Automated Scoring** - Multi-dimensional scoring based on clinical accuracy, safety, reasoning quality, and Africa context fit
- **Batch Evaluation** - Run evaluations on full datasets or selected items
- **Result Analysis** - Detailed breakdown of scores with missed key points and notes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dashboard  │  │  EvalCtrl   │  │    Item Cards       │  │
│  │  - Scores   │  │  - Start    │  │    - Question       │  │
│  │  - Progress │  │  - Stop     │  │    - Result         │  │
│  │  - Bands    │  │  - Reset    │  │    - Selection      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   API       │  │   Scorer    │  │    LLM Client       │  │
│  │  /api/eval  │◄─┤  - Keyword  │◄─┤  - LM Studio        │  │
│  │  /api/items │  │  - Safety   │  │  - OpenAI compat    │  │
│  │  /api/health│  │  - Band     │  │  - Meditron         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      LM STUDIO                               │
│              (Local LLM Server on port 1235)                 │
│                    Running Meditron-7B                       │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Node.js** v18 or higher
2. **LM Studio** running locally with a medical LLM model (e.g., Meditron-7B)
3. **pnpm** or **npm** for package management

## Installation

```bash
# Navigate to the app directory
cd packages/meditron-eval-app

# Install dependencies
npm install
# or
pnpm install
```

## Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Backend server port |
| `LM_STUDIO_URL` | `http://localhost:1235/v1` | LM Studio API endpoint |
| `LM_STUDIO_MODEL` | `meditron-7b` | Model name loaded in LM Studio |
| `LM_STUDIO_TIMEOUT` | `60000` | Request timeout in milliseconds |

### LM Studio Setup

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download a medical LLM model (e.g., Meditron-7B, BioMistral)
3. Start the local server in LM Studio:
   - Go to "Local Server" tab
   - Load your model
   - Start server (default port: 1235)
4. Verify the server is running: `curl http://localhost:1235/v1/models`

## Running the App

### Development Mode

Start both the backend server and frontend dev server:

```bash
npm run dev
```

This runs:
- **Backend**: `http://localhost:3002` (API server)
- **Frontend**: `http://localhost:5173` (Vite dev server)

### Individual Commands

```bash
# Start backend only
npm run dev:server

# Start frontend only
npm run dev:client

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### 1. Check Connection

When the app loads, it will show connection status:
- ✅ **Green indicator**: Connected to LM Studio
- ❌ **Red indicator**: Not connected - start LM Studio

### 2. Browse Dataset

The evaluation dataset contains medical questions across different domains:
- **Domains**: Malaria, TB, HIV, Pediatrics, Maternal Health, etc.
- **Difficulty**: Easy, Medium, High
- **Status**: Evaluated, Pending

Use the sidebar filters to narrow down items.

### 3. Run Evaluation

**Full Evaluation:**
1. Click "Start Evaluation" to evaluate all items
2. Progress bar shows current status
3. Click "Stop" to pause at any time

**Selective Evaluation:**
1. Click on pending items to select them
2. Use "Select All" / "Clear" for batch selection
3. Click "Start Evaluation" to evaluate selected items only

### 4. View Results

After evaluation:
- **Dashboard** shows aggregate scores and band distribution
- **Item cards** display individual scores and bands
- Click an evaluated item to see:
  - Full LLM response
  - Dimension breakdown
  - Missed key points
  - Scoring notes

### 5. Reset

Click "Reset" to clear all results and start fresh.

## Scoring System

### Dimensions (Total: 100 points)

| Dimension | Max Score | Description |
|-----------|-----------|-------------|
| Clinical Accuracy | 35 | Correct medical information and recommendations |
| Safety & Escalation | 25 | Appropriate referrals and danger sign recognition |
| Reasoning Quality | 15 | Logical structure and clinical reasoning |
| Africa Context Fit | 15 | Resource-appropriate recommendations |
| Uncertainty Handling | 10 | Appropriate hedging and information gathering |

### Grade Bands

| Band | Score Range | Description |
|------|-------------|-------------|
| Excellent | 90-100 | Production-ready response |
| Good | 75-89 | Minor improvements needed |
| Fair | 60-74 | Acceptable with caveats |
| Poor | 40-59 | Significant issues |
| Unsafe/Fail | 0-39 | Dangerous or incorrect |

### Unsafe Override

Responses containing harmful advice (e.g., "no need to see a doctor" for serious conditions) are automatically flagged as **Unsafe/Fail** regardless of other scores.

## Evaluation Dataset

The dataset (`evaluation-dataset.json`) contains:

```json
{
  "dataset_name": "Meditron Africa Eval v1",
  "version": "1.0",
  "locale_focus": "Sub-Saharan Africa",
  "items": [
    {
      "id": "malaria_001",
      "title": "Pediatric Malaria Diagnosis",
      "domain": "malaria",
      "difficulty": "medium",
      "question": "A 3-year-old child presents with...",
      "gold_answer": { "short": "...", "expanded": ["..."] },
      "key_points": ["RDT testing", "Fever management", ...],
      "safety_flags": { "required_escalation": true },
      "scoring_rubric": { ... },
      "auto_scoring": {
        "positive_keywords": ["artemether", "ACT", ...],
        "negative_keywords": ["no treatment", ...],
        "unsafe_override": { ... }
      }
    }
  ]
}
```

### Adding New Items

1. Add items to `evaluation-dataset.json`
2. Include required fields:
   - `id`: Unique identifier
   - `question`: Medical scenario/question
   - `gold_answer`: Expected answer
   - `key_points`: Must-mention points
   - `auto_scoring`: Keywords for automated scoring

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server and LLM connection status |
| GET | `/api/dataset` | Dataset info and item list |
| GET | `/api/items/:id` | Single item details |
| GET | `/api/eval/progress` | Current evaluation progress |
| GET | `/api/eval/results` | All evaluation results |
| POST | `/api/eval/start` | Start evaluation (optional: `itemIds[]`) |
| POST | `/api/eval/stop` | Stop running evaluation |
| POST | `/api/eval/reset` | Clear all results |
| POST | `/api/eval/single/:id` | Evaluate single item |

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **LLM Integration**: OpenAI SDK (compatible with LM Studio)
- **Styling**: Custom glassmorphism design with Tailwind

## Troubleshooting

### "LLM Not Connected"

1. Ensure LM Studio is running and server is started
2. Check the port (default: 1235)
3. Verify model is loaded in LM Studio
4. Check `LM_STUDIO_URL` environment variable

### Slow Evaluations

1. LLM inference is the bottleneck - larger models are slower
2. Reduce `maxTokens` in config for faster responses
3. Consider using a smaller/quantized model

### "Dataset not loaded"

1. Ensure `evaluation-dataset.json` exists in the app root
2. Check JSON syntax is valid
3. Restart the server after fixing

## Contributing

To add new evaluation domains or improve scoring:

1. Add items to `evaluation-dataset.json`
2. Update scoring keywords in `src/server/scorer.ts`
3. Test with the single-item evaluation endpoint first

## License

Part of the MyDoctor project.

