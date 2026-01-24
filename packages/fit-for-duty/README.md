# Fit for Duty (FFD) Checklist Application

A safety-critical web application for oil & gas companies to perform pre-shift Fit for Duty checks, record vitals, capture pass/fail for each section, determine final duty status, and maintain an auditable record.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT with role-based access control
- **Monorepo**: pnpm workspaces

## Project Structure

```
fit-for-duty/
├── apps/
│   ├── api/          # Express backend
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Shared types and schemas
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB running locally (or connection string)

### Installation

```bash
# Navigate to the fit-for-duty directory
cd packages/fit-for-duty

# Install dependencies
pnpm install

# Build shared package first
cd packages/shared && pnpm build && cd ../..
```

### Environment Setup

Create `.env` file in `apps/api/`:

```env
PORT=3006
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fit-for-duty
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=admin@ffd.local
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=System Administrator
```

### Seed Database

```bash
pnpm seed
```

This creates:
- Admin user
- Sample locations (Temane, Coral Sul, etc.)
- Job roles with safety-critical tags
- Default FFD checklist template

### Run Development Servers

```bash
# Run both frontend and backend
pnpm dev
```

Or separately:

```bash
# Backend (port 3006)
cd apps/api && pnpm dev

# Frontend (port 3007)
cd apps/web && pnpm dev
```

### Access

- **Frontend**: http://localhost:3007
- **Backend API**: http://localhost:3006

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ffd.local | Admin123! |
| Assessor | assessor@ffd.local | Assessor123! |
| Viewer | viewer@ffd.local | Viewer123! |

## Features

### Roles

- **Admin**: Full access - manage users, locations, job roles, templates, view all records, void assessments
- **Assessor**: Create and submit FFD assessments, view their records
- **Viewer**: Read-only access to records and dashboards
- **Employee**: View their own submitted records only

### FFD Checklist Sections

1. **Physical Condition** - Includes vitals (BP, heart rate, SpO2)
2. **Fatigue & Rest** - Sleep hours, fatigue score (1-10)
3. **Substance & Medication** - BAC test, medication review
4. **Cognitive & Mental Alertness** - Orientation, task understanding
5. **Psychological & Behavioral** - Red flags (auto-fail triggers)
6. **Job-Specific Readiness** - PPE, permits, emergency procedures

### Business Rules

- **Red Flags**: If any red flag is checked, final decision cannot be FIT
- **BAC Test**: Must be exactly 0.00% if provided
- **Fatigue Score**: Warning shown if > 4
- **Safety-Critical Roles**: Section 6 must pass for FIT decision
- **Draft/Submit**: Drafts can be edited; submitted assessments are immutable
- **Void**: Only Admin can void with required reason

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Authenticate |
| GET | /auth/me | Get current user |
| CRUD | /users | User management (Admin) |
| CRUD | /locations | Location management |
| CRUD | /jobroles | Job role management |
| CRUD | /templates | Checklist templates |
| GET/POST | /assessments | List/Create assessments |
| PUT | /assessments/:id | Update draft |
| POST | /assessments/:id/submit | Submit assessment |
| POST | /assessments/:id/void | Void assessment (Admin) |
| GET | /reports/summary | Dashboard statistics |

## Security

- JWT authentication
- Role-based access control (RBAC)
- Rate limiting on auth endpoints
- Field-level privacy (Viewers cannot see vitals/medication details)
- Audit logging for all actions
- Input validation with Zod

## Development

### Build

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

## Future Enhancements

- [ ] PDF export of assessments
- [ ] Email notifications
- [ ] Offline mode with sync
- [ ] Biometric signature capture
- [ ] Integration with access control systems
- [ ] Mobile app (React Native)
