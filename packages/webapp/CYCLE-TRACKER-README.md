# Cycle Tracker Feature

## Overview

The Cycle Tracker is a comprehensive menstrual cycle tracking feature integrated into the Zemba.ai MyDoctor application. It provides period tracking, predictions, symptom logging, and insights - all while maintaining user privacy with local and secure server storage.

## Features

### ✅ Completed

1. **Period Tracking**
   - Mark period days with start/end dates
   - Track flow level (none, light, medium, heavy)
   - View historical cycles

2. **Predictions**
   - Next period start and end dates
   - Fertile window calculation
   - Ovulation day prediction
   - Support for regular and irregular cycles (with date ranges)

3. **Symptom & Mood Logging**
   - Track symptoms: cramps, headache, bloating, acne, breast tenderness, fatigue, nausea, back pain
   - Log moods: happy, anxious, irritable, sad, energetic, calm
   - Add custom notes (up to 500 characters)

4. **Insights & Analytics**
   - Average cycle length
   - Average period length
   - Cycle regularity assessment
   - Historical cycle list
   - Interactive charts (Recharts) showing:
     - Cycle length over time
     - Period length over time

5. **Privacy & Data Control**
   - All data encrypted in transit (HTTPS)
   - Backend stored securely in MongoDB
   - Export data as JSON
   - Import data from JSON
   - Delete all data option

6. **Multi-User Support**
   - Track for self or dependents
   - Gender-based eligibility (female only)
   - Age restriction for dependents (10+ years)
   - Managers can view/manage dependent cycle data

7. **Responsive Design**
   - Mobile-first calendar interface
   - Touch-friendly daily log form
   - Adaptive charts and insights
   - Bottom nav (mobile) / Top nav (desktop)

### 🚧 Future Enhancements (Not in MVP)

- In-app reminders/notifications
- i18n translations
- Export to PDF
- Advanced analytics (cycle phase tracking)
- Integration with health records

## Architecture

### Backend (`packages/webapp-backend`)

**Models:**
- `CycleSettings` - User preferences and cycle configuration
- `DailyLog` - Daily symptom/mood/flow logging
- `Cycle` - Computed cycle records from period days

**API Endpoints:**
```
GET    /api/cycle/settings              # Get settings
POST   /api/cycle/settings              # Create settings (onboarding)
PATCH  /api/cycle/settings              # Update settings
POST   /api/cycle/logs                  # Create/update daily log
GET    /api/cycle/logs?startDate&endDate # Get logs for date range
DELETE /api/cycle/logs/:date            # Delete a log
GET    /api/cycle/cycles                # Get historical cycles
GET    /api/cycle/predictions           # Get next period/fertile predictions
GET    /api/cycle/export                # Export all data as JSON
POST   /api/cycle/import                # Import data from JSON
DELETE /api/cycle/all                   # Delete all cycle data
```

**Permissions:**
- Users can access their own cycle data
- Managers can access cycle data for their dependents
- Eligibility checked server-side (female, age 10+)

### Frontend (`packages/webapp`)

**Code Splitting:**
All cycle tracker code is lazy-loaded to avoid bloating the main bundle for users who don't need it (male users).

**Pages:**
- `/cycle` - Main calendar view with predictions
- `/cycle/onboarding` - First-time setup wizard
- `/cycle/log/:date` - Daily symptom/mood logging
- `/cycle/insights` - Stats, charts, and history

**Components:**
- `Calendar` - Custom month calendar with period/fertile indicators
- `PredictionBanner` - Next period and fertile window display
- `MonthNavigation` - Navigate between months
- Charts using Recharts library

**Hooks:**
- `useCycleData` - Main data management hook
- `useCycleCalendar` - Generate calendar with period data
- `useCycleStats` - Calculate statistics
- `useCycleEligibility` - Check if user can access feature

**State Management:**
- React hooks for local state
- API calls through `cycleApi` service
- No global state needed

## Setup Instructions

### 1. Install Dependencies

```bash
# From workspace root
pnpm install

# Recharts will be installed in webapp package
```

### 2. Database Migration

No migration needed - MongoDB models will auto-create collections on first use.

### 3. Backend Configuration

No additional configuration required. The cycle routes are already registered in `server.ts`.

### 4. Frontend Configuration

Routes are already added to `App.tsx` with lazy loading.

Navigation is conditionally shown based on user gender/age.

### 5. Start Development

```bash
# Terminal 1: Backend
cd packages/webapp-backend
pnpm dev

# Terminal 2: Frontend
cd packages/webapp
pnpm dev
```

## How Predictions Work

### Regular Cycles

For users with regular cycles:

1. **Next Period Start** = Last Period Start + Average Cycle Length
2. **Period Window** = Next Period Start to (Next Period Start + Average Period Length - 1)
3. **Ovulation Day** = Next Period Start - 14 days
4. **Fertile Window** = Ovulation Day - 5 to Ovulation Day

### Irregular Cycles

For users with irregular cycles, we show date ranges:

1. **Period Start Range** = Predicted Start ± 2 days
2. **Period End Range** = Predicted End ± 2 days
3. **Ovulation Range** = Predicted Ovulation ± 2 days
4. **Fertile Window** = Extended window to account for variability

**Note:** These are estimates based on typical menstrual cycle patterns. They are not medical advice and should not be used for contraception or fertility planning without consulting a healthcare provider.

## Data Privacy

### What We Store

- Cycle settings (last period start, averages, preferences)
- Daily logs (period days, symptoms, mood, notes)
- Computed cycles (derived from period days)

### What We Don't Store

- No personally identifiable information beyond user ID
- No external sharing or analytics
- No third-party integrations

### User Control

- **Export**: Download all data as JSON anytime
- **Import**: Restore data from JSON backup
- **Delete**: Permanently remove all cycle data with confirmation

## Testing

### Manual Testing Checklist

- [ ] Onboarding flow completes successfully
- [ ] Calendar displays current month
- [ ] Can navigate between months
- [ ] Clicking a day opens daily log
- [ ] Can mark period days
- [ ] Can log symptoms and moods
- [ ] Flow level selector works
- [ ] Notes save correctly
- [ ] Predictions banner appears after setup
- [ ] Insights page shows stats and charts
- [ ] Export downloads JSON file
- [ ] Import restores data correctly
- [ ] Delete all data works with confirmation
- [ ] Navigation shows/hides based on gender
- [ ] Works for dependents (age 10+)
- [ ] Mobile responsive at all breakpoints

### Test Users

Create test users with different profiles:

1. **Adult female** - Full access
2. **Adult male** - No cycle tracker in nav
3. **Female dependent (age 12)** - Full access via parent
4. **Female dependent (age 8)** - No access (under 10)

## Troubleshooting

### Cycle tracker not showing in navigation

- Check user profile has `sexAtBirth` = 'female'
- For dependents, verify age is 10+
- Clear browser cache and reload

### Predictions not accurate

- Ensure user has logged at least one complete cycle
- Check settings for correct averages
- For irregular cycles, toggle the irregular option

### Export/Import not working

- Verify JSON file format matches schema
- Check browser console for errors
- Ensure valid date formats (YYYY-MM-DD)

## API Examples

### Create Settings (Onboarding)

```typescript
POST /api/cycle/settings
{
  "lastPeriodStart": "2026-01-01",
  "averageCycleLength": 28,
  "averagePeriodLength": 5,
  "irregularCycle": false
}
```

### Log a Period Day

```typescript
POST /api/cycle/logs
{
  "date": "2026-01-09",
  "isPeriodDay": true,
  "flowLevel": "medium",
  "symptoms": ["cramps", "fatigue"],
  "mood": ["irritable"],
  "notes": "Feeling tired today"
}
```

### Get Predictions

```typescript
GET /api/cycle/predictions

Response:
{
  "nextPeriod": {
    "start": "2026-01-29",
    "end": "2026-02-02"
  },
  "ovulation": {
    "date": "2026-01-15"
  },
  "fertileWindow": {
    "start": "2026-01-10",
    "end": "2026-01-15"
  }
}
```

## Code Organization

```
packages/
├── webapp-backend/
│   └── src/
│       ├── models/
│       │   ├── cycle-settings.model.ts
│       │   ├── daily-log.model.ts
│       │   └── cycle.model.ts
│       ├── services/
│       │   └── cycle.service.ts
│       └── api/
│           └── cycle.routes.ts
│
└── webapp/
    └── src/
        ├── types/
        │   └── cycle.ts
        ├── services/
        │   └── cycleApi.ts
        ├── hooks/
        │   ├── useCycleData.ts
        │   ├── useCycleCalendar.ts
        │   ├── useCycleStats.ts
        │   └── useCycleEligibility.ts
        ├── components/
        │   └── cycle/
        │       ├── Calendar.tsx
        │       ├── PredictionBanner.tsx
        │       └── MonthNavigation.tsx
        └── pages/
            ├── CycleTrackerPage.tsx
            ├── CycleDailyLogPage.tsx
            ├── CycleInsightsPage.tsx
            └── CycleOnboardingPage.tsx
```

## Performance

- **Code Splitting**: Cycle tracker code is lazy-loaded (~100KB gzipped)
- **Calendar Rendering**: Only renders visible month + 1 week buffer
- **API Caching**: Cycle data cached in React state
- **Chart Performance**: Recharts renders efficiently for typical dataset sizes (<100 cycles)

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Sufficient color contrast (WCAG AA)
- Screen reader friendly
- Touch targets ≥44px for mobile

## Contributing

When adding features to cycle tracker:

1. Maintain code splitting (lazy load new pages)
2. Add types to `cycle.ts`
3. Update API service in `cycleApi.ts`
4. Write tests for new functionality
5. Update this README

## License

Part of the Zemba.ai MyDoctor application.

## Support

For questions or issues, contact the development team or create an issue in the repository.

