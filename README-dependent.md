# Family Dependents Feature

This document describes the architecture and implementation of the family dependents feature in Zambe, which allows users to manage health profiles for family members (children, spouses, etc.).

## Overview

The dependents feature enables:
- **Adding family members** under 18 years old as dependents
- **Switching between profiles** to view/manage dependent health data
- **Sharing access** with other managers (e.g., both parents can manage a child)
- **Editing health profiles** for dependents
- **Exporting health data** for any dependent

## Business Rules

| Rule | Description |
|------|-------------|
| Age Requirement | Dependents must be under 18 years old at the time of adding |
| Lifetime Access | Once added, dependents remain even after turning 18 |
| Multiple Managers | Multiple users can manage the same dependent |
| No Limit | No limit on how many dependents a user can add |
| Data Export | Dependent data can be exported separately as JSON |

---

## Architecture

### Data Model

```
┌─────────────────────┐         ┌──────────────────────────┐         ┌─────────────────────┐
│       User          │         │  DependentRelationship   │         │       User          │
│   (Manager)         │◄────────│                          │────────►│   (Dependent)       │
├─────────────────────┤         ├──────────────────────────┤         ├─────────────────────┤
│ _id                 │         │ managerId (ref: User)    │         │ _id                 │
│ email               │         │ dependentId (ref: User)  │         │ name                │
│ name                │         │ relationship             │         │ dateOfBirth         │
│ isDependent: false  │         │ isPrimary                │         │ isDependent: true   │
│ ...                 │         │ addedAt                  │         │ email: null         │
└─────────────────────┘         └──────────────────────────┘         └─────────────────────┘
                                                                              │
                                                                              ▼
                                                                     ┌─────────────────────┐
                                                                     │   PatientProfile    │
                                                                     ├─────────────────────┤
                                                                     │ userId (ref: User)  │
                                                                     │ demographics        │
                                                                     │ medicalHistory      │
                                                                     │ lifestyle           │
                                                                     └─────────────────────┘
```

### Key Design Decisions

1. **Dependents are Users**: Dependents are stored in the same `User` collection with `isDependent: true`. This allows them to have their own `PatientProfile` and `Session` records using existing infrastructure.

2. **Many-to-Many Relationships**: The `DependentRelationship` collection enables multiple managers per dependent and tracks the relationship type.

3. **Primary Manager**: The user who creates the dependent is marked as the primary manager.

---

## Backend Implementation

### Files Structure

```
packages/webapp-backend/src/
├── models/
│   ├── user.model.ts                    # Updated: Added isDependent, dateOfBirth
│   └── dependent-relationship.model.ts  # NEW: Manager-dependent relationships
├── services/
│   └── dependent.service.ts             # NEW: Business logic for dependents
└── api/
    └── dependent.routes.ts              # NEW: REST API endpoints
```

### User Model Changes

```typescript
// packages/webapp-backend/src/models/user.model.ts
interface IUser {
  email?: string;           // Optional for dependents
  name: string;
  isDependent: boolean;     // NEW: true for dependent accounts
  dateOfBirth?: Date;       // NEW: Required for age validation
  // ... other fields
}
```

### DependentRelationship Model

```typescript
// packages/webapp-backend/src/models/dependent-relationship.model.ts
interface IDependentRelationship {
  managerId: ObjectId;      // The user managing the dependent
  dependentId: ObjectId;    // The dependent user
  relationship: 'parent' | 'guardian' | 'spouse' | 'sibling' | 'grandparent' | 'other';
  isPrimary: boolean;       // True if this is the primary manager
  addedAt: Date;
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/dependents` | Create a new dependent |
| `GET` | `/api/dependents` | List all dependents for current user |
| `GET` | `/api/dependents/:id` | Get a specific dependent |
| `PATCH` | `/api/dependents/:id` | Update dependent info |
| `DELETE` | `/api/dependents/:id` | Delete dependent and all data |
| `GET` | `/api/dependents/:id/profile` | Get dependent's health profile |
| `PATCH` | `/api/dependents/:id/profile` | Update dependent's health profile |
| `GET` | `/api/dependents/:id/sessions` | Get dependent's session history |
| `GET` | `/api/dependents/:id/managers` | List all managers of a dependent |
| `POST` | `/api/dependents/:id/managers` | Add a manager (by ID or email) |
| `DELETE` | `/api/dependents/:id/managers/:managerId` | Remove a manager |
| `PATCH` | `/api/dependents/:id/relationship` | Update relationship type |

### Service Layer

The `DependentService` class handles all business logic:

```typescript
// packages/webapp-backend/src/services/dependent.service.ts
class DependentService {
  // CRUD Operations
  createDependent(managerId, input): Promise<DependentWithRelationship>
  getDependents(managerId): Promise<DependentWithRelationship[]>
  getDependent(managerId, dependentId): Promise<DependentWithRelationship>
  updateDependent(managerId, dependentId, updates): Promise<DependentWithRelationship>
  deleteDependent(managerId, dependentId): Promise<{ success: boolean }>
  
  // Manager Operations
  addManager(requesterId, input): Promise<{ success: boolean }>
  addManagerByEmail(requesterId, input): Promise<{ success: boolean }>
  removeManager(requesterId, dependentId, managerId): Promise<{ success: boolean }>
  getManagers(requesterId, dependentId): Promise<ManagerInfo[]>
  
  // Profile & Sessions
  getDependentProfile(managerId, dependentId): Promise<PatientProfile | null>
  updateDependentProfile(managerId, dependentId, data): Promise<PatientProfile>
  getDependentSessions(managerId, dependentId, options): Promise<Session[]>
}
```

---

## Frontend Implementation

### Files Structure

```
packages/webapp/src/
├── contexts/
│   ├── ActiveProfileContext.tsx  # NEW: Manages active profile state
│   └── index.ts
├── components/dependents/
│   ├── ProfileSwitcher.tsx        # NEW: Header dropdown for switching profiles
│   ├── DependentsManager.tsx      # NEW: Settings page component
│   ├── AddDependentModal.tsx      # NEW: Modal for adding dependents
│   ├── ShareDependentModal.tsx    # NEW: Modal for sharing with managers
│   └── index.ts
├── pages/
│   └── DependentProfileSetupPage.tsx  # NEW: Edit dependent profile
└── services/
    └── api.ts                     # Updated: Added dependent API methods
```

### ActiveProfileContext

Central state management for the active profile (self or dependent):

```typescript
// packages/webapp/src/contexts/ActiveProfileContext.tsx
interface ActiveProfileContextType {
  // Current active profile (user or dependent)
  activeProfile: ActiveProfile | null;
  activePatientProfile: PatientProfile | null;
  
  // State flags
  isViewingDependent: boolean;
  isLoadingDependents: boolean;
  
  // Dependents list
  dependents: Dependent[];
  
  // Actions
  switchToSelf(): void;
  switchToDependent(dependentId: string): Promise<void>;
  refreshDependents(): Promise<void>;
  addDependent(input): Promise<Dependent>;
  deleteDependent(dependentId: string): Promise<void>;
}
```

### Component Hierarchy

```
App
├── AuthProvider
│   └── ActiveProfileProvider        # Wraps entire app
│       ├── Header
│       │   └── ProfileSwitcher      # Dropdown in header
│       └── Routes
│           ├── DashboardPage        # Uses activeProfile for data
│           ├── HealthHistoryPage    # Uses activeProfile for sessions
│           ├── ProfilePage          # Shows active profile info
│           ├── SettingsPage
│           │   └── DependentsManager  # Manage family members
│           │       ├── AddDependentModal
│           │       └── ShareDependentModal
│           └── DependentProfileSetupPage  # Edit dependent profile
```

### ProfileSwitcher Component

Dropdown in the header for switching between profiles:

```tsx
// Usage in Header.tsx
<ProfileSwitcher />

// Features:
// - Shows current active profile name
// - Lists all dependents
// - One-click switching
// - Persists selection to localStorage
```

### DependentsManager Component

Settings page component for managing family members:

```tsx
// Features:
// - List all dependents with age and relationship
// - Add new dependent button
// - Per-dependent actions:
//   - ✏️ Edit profile → navigates to /dependent/:id/profile/setup
//   - 🔗 Share → opens ShareDependentModal
//   - 📥 Export → downloads JSON file
//   - 🗑️ Delete → confirmation modal
```

---

## Data Flow

### Adding a Dependent

```
User clicks "Add Family Member"
         │
         ▼
┌─────────────────────────────┐
│     AddDependentModal       │
│  - Name                     │
│  - Date of Birth            │
│  - Relationship             │
│  - Language preference      │
└─────────────────────────────┘
         │
         ▼
POST /api/dependents
         │
         ▼
┌─────────────────────────────┐
│    dependentService         │
│  1. Validate age < 18       │
│  2. Create User (dependent) │
│  3. Create Relationship     │
└─────────────────────────────┘
         │
         ▼
Refresh dependents list
```

### Switching Profiles

```
User selects dependent from ProfileSwitcher
         │
         ▼
┌─────────────────────────────┐
│   ActiveProfileContext      │
│  1. Set activeProfile       │
│  2. Fetch dependent profile │
│  3. Update localStorage     │
└─────────────────────────────┘
         │
         ▼
All components re-render with dependent data
(Dashboard, History, Profile, etc.)
```

### Sharing a Dependent

```
User clicks "Share" on dependent card
         │
         ▼
┌─────────────────────────────┐
│    ShareDependentModal      │
│  - Enter email address      │
│  - Select relationship      │
└─────────────────────────────┘
         │
         ▼
POST /api/dependents/:id/managers
{ email: "...", relationship: "parent" }
         │
         ▼
┌─────────────────────────────┐
│    dependentService         │
│  1. Find user by email      │
│  2. Validate not already    │
│     a manager               │
│  3. Create relationship     │
│     (isPrimary: false)      │
└─────────────────────────────┘
```

---

## Translations

All UI text is translated into 4 languages:

| Key Prefix | Description |
|------------|-------------|
| `dependents_*` | Dependents manager, list, actions |
| `dependent_profile_*` | Dependent profile setup page |
| `share_dependent_*` | Share modal |
| `active_profile_*` | Profile switcher |

Example keys:
- `dependents_title`: "Family Members"
- `dependents_add_button`: "+ Add Family Member"
- `share_dependent_title`: "Share Access"

---

## Security Considerations

1. **Authorization**: All dependent endpoints verify the requesting user is a manager of the dependent.

2. **No Direct Access**: Dependents cannot log in themselves (no email/password).

3. **Manager Validation**: A dependent cannot be added as a manager.

4. **Primary Manager Protection**: The last manager cannot be removed; the dependent must be deleted instead.

5. **Age Validation**: Only children under 18 can be added (validated server-side).

---

## Future Enhancements

- [ ] Email invitations for sharing (instead of requiring existing account)
- [ ] Notifications when another manager makes changes
- [ ] Dependent "graduation" to full account at 18
- [ ] Different permission levels for managers (view-only vs full access)
- [ ] PDF export with formatted health report

