# Vaccination Tracking Feature

This document describes the vaccination tracking feature for dependents (children) in the Zambe health application.

## Overview

The vaccination tracking feature allows parents/guardians to track their children's vaccination records according to the official Mozambique childhood vaccination calendar ("Calendário de Vacinação Infantil"). The system:

- Shows vaccination alerts when a dependent's records are missing or incomplete
- Tracks each vaccine dose independently
- Highlights overdue vaccines based on the child's age
- Supports status tracking: ✅ Administered, ❌ Not administered, ❓ Unknown

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  medical-protocols/moz/vaccinations/                            │
│  ├── calendar.ts          (Raw calendar text in Portuguese)    │
│  └── vaccination-form.ts  (Structured schema + helper funcs)   │
│                                                                  │
│  models/                                                         │
│  └── patient-profile.model.ts  (vaccinationRecords field)      │
│                                                                  │
│  api/                                                            │
│  └── vaccination.routes.ts     (REST API endpoints)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  components/vaccinations/                                        │
│  ├── VaccinationAlert.tsx   (Notification banner)               │
│  ├── VaccinationModal.tsx   (Full form modal)                   │
│  └── index.ts                                                   │
│                                                                  │
│  services/                                                       │
│  └── api.ts                 (API client methods)                │
│                                                                  │
│  pages/                                                          │
│  ├── DashboardPage.tsx      (Shows alert for dependents)        │
│  └── ProfilePage.tsx        (Shows alert for dependents)        │
└─────────────────────────────────────────────────────────────────┘
```

## Mozambique Vaccination Calendar

The vaccination schedule is based on the official Mozambique childhood vaccination calendar and includes:

| Age | Vaccines |
|-----|----------|
| At birth | BCG, Polio (VAP) |
| 2 months | Polio, DTP/HepB/Hib (1st), PCV (1st), Rotavirus (1st) |
| 3 months | Polio, DTP/HepB/Hib (2nd), PCV (2nd), Rotavirus (2nd) |
| 4 months | Polio + IPV, DTP/HepB/Hib (3rd), PCV (3rd) |
| 6 months | Vitamin A |
| 9 months | Measles (1st) |
| 12 months | Vitamin A, Deworming |
| 18 months | Measles (2nd), Vitamin A, Deworming |
| 24-59 months | Vitamin A, Deworming (every 6 months) |

## Data Model

### VaccineDose (Schema Definition)

```typescript
interface VaccineDose {
  id: string;                    // Unique identifier (e.g., 'bcg-1', 'vap-1')
  vaccineId: string;             // Groups doses (e.g., 'polio')
  vaccineName: string;           // Full name in Portuguese
  vaccineAbbrev: string;         // Abbreviation (e.g., 'BCG', 'VAP')
  doseNumber: number;            // 1, 2, 3 for multi-dose vaccines
  totalDoses: number;            // Total required doses
  ageMonths: number;             // Expected age in months (0 = birth)
  ageLabel: string;              // Human-readable (e.g., 'Aos 2 meses')
  description?: string;          // Additional info
  isVitaminOrSupplement: boolean;
}
```

### VaccinationRecord (User Data)

```typescript
interface VaccinationRecord {
  doseId: string;                // References VaccineDose.id
  status: 'yes' | 'no' | 'unknown';
  dateAdministered?: string;     // ISO date string
  notes?: string;                // Optional notes
}
```

### PatientProfile (MongoDB)

```typescript
interface IPatientProfile {
  // ... existing fields ...
  vaccinationRecords?: IVaccinationRecord[];
  vaccinationCountry?: string;   // Default: 'moz'
}
```

## API Endpoints

All endpoints require authentication.

### Get Vaccination Schema

```http
GET /api/vaccination/schema
GET /api/vaccination/schema/:country
```

Returns the vaccination form schema for a country. Currently only `moz` (Mozambique) is supported.

### Get Dependent Vaccination Status

```http
GET /api/vaccination/dependent/:dependentId
```

Returns:
- `applicable`: Whether vaccination tracking applies (child under 12)
- `ageMonths`, `ageYears`: Child's current age
- `records`: Current vaccination records
- `relevantDoses`: Vaccines expected for the child's age
- `overdueDoses`: Vaccines that are overdue
- `progress`: Completion percentage (0-100)
- `hasRecords`: Whether any records exist
- `needsAttention`: Whether alert should be shown
- `schema`: Full vaccination schema

### Update Vaccination Records (Batch)

```http
PUT /api/vaccination/dependent/:dependentId

Body: {
  "records": [
    { "doseId": "bcg-1", "status": "yes", "dateAdministered": "2024-01-15" },
    { "doseId": "vap-0", "status": "yes" },
    { "doseId": "vap-1", "status": "unknown" }
  ]
}
```

### Update Single Dose

```http
PATCH /api/vaccination/dependent/:dependentId/dose/:doseId

Body: {
  "status": "yes",
  "dateAdministered": "2024-03-20",
  "notes": "Hospital Central de Maputo"
}
```

## Frontend Components

### VaccinationAlert

A notification banner that appears on the Dashboard and Profile pages when viewing a dependent who:
- Has no vaccination records, or
- Has overdue vaccines

Features:
- Shows progress bar if partial records exist
- Lists up to 3 overdue vaccines
- Can be dismissed (persists until page reload)
- Links to VaccinationModal

### VaccinationModal

A full-screen modal with the vaccination form:
- Groups vaccines by age milestone
- Shows vaccine name, abbreviation, and dose number
- Dropdown status selector per dose
- Date picker for administered vaccines
- Highlights overdue vaccines in yellow
- Shows overall progress percentage
- Saves changes in batch

## Helper Functions

Located in `vaccination-form.ts`:

```typescript
// Get vaccines relevant for a child's age
getVaccinesForAge(ageMonths: number): VaccineDose[]

// Get overdue vaccines based on records
getOverdueVaccines(ageMonths: number, records: VaccinationRecord[]): VaccineDose[]

// Get upcoming vaccines (next 3 months)
getPendingVaccines(ageMonths: number, lookAheadMonths?: number): VaccineDose[]

// Calculate completion percentage
getVaccinationProgress(ageMonths: number, records: VaccinationRecord[]): number
```

## Multi-Country Support

The architecture supports multiple countries, each with their own vaccination calendar:

```
medical-protocols/
├── moz/                    # Mozambique
│   └── vaccinations/
│       ├── calendar.ts
│       └── vaccination-form.ts
├── zaf/                    # South Africa (future)
│   └── vaccinations/
└── ken/                    # Kenya (future)
    └── vaccinations/
```

To add a new country:
1. Create the country directory under `medical-protocols/`
2. Add the vaccination schema in `vaccination-form.ts`
3. Update the API to support the new country code
4. The frontend will automatically use the schema from the API

## Localization

The vaccination feature uses Portuguese for vaccine names since it's Mozambique-specific. Key labels:

| Portuguese | English |
|------------|---------|
| Registo de Vacinação | Vaccination Record |
| Vacinas Pendentes | Pending Vaccines |
| Em atraso | Overdue |
| Administrada | Administered |
| Não administrada | Not administered |
| Não sei | I don't know |

## Usage Flow

1. Parent logs in and switches to a dependent's profile
2. If vaccination records are missing or incomplete:
   - Alert appears on Dashboard and Profile pages
3. Parent clicks "Adicionar Registos" or "Ver Vacinas"
4. VaccinationModal opens showing:
   - Vaccines from birth up to child's current age
   - Current status of each dose
   - Overdue vaccines highlighted
5. Parent updates status for each dose
6. Saves changes
7. Alert updates or disappears based on new progress

## Database Indexes

The `PatientProfile` collection uses existing indexes. The `vaccinationRecords` array is embedded, so no additional indexes are needed.

## Security

- All vaccination endpoints require authentication
- Parent must have manager relationship with the dependent
- Rate limiting applied (same as other protected routes)

## Testing

To test the feature:

1. Create a dependent under 12 years old
2. Navigate to Dashboard or Profile while viewing the dependent
3. The vaccination alert should appear
4. Click to open the modal
5. Update some vaccines and save
6. Verify progress updates correctly

## Future Enhancements

- [ ] Vaccination reminders/notifications
- [ ] PDF export of vaccination card
- [ ] QR code for healthcare providers to scan
- [ ] Integration with national health systems
- [ ] Support for additional countries
- [ ] Vaccine batch/lot number tracking
- [ ] Healthcare facility tracking

