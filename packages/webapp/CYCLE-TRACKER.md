# 🌸 Cycle Tracker Feature

A comprehensive menstrual cycle tracking feature integrated into the MyDoctor application. Designed to help users track periods, predict fertile windows, log symptoms, and gain insights into their cycle patterns.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup](#setup)
- [Usage](#usage)
- [How Predictions Work](#how-predictions-work)
- [Privacy & Security](#privacy--security)
- [Data Export/Import](#data-exportimport)
- [Technical Details](#technical-details)

## Overview

The Cycle Tracker is a gender-specific feature that provides:
- Period tracking and predictions
- Ovulation and fertile window estimates
- Daily symptom and mood logging
- Cycle history and statistics
- Data export/import capabilities

**Visibility Rules:**
- ✅ Visible for female users (sexAtBirth: 'female')
- ✅ Visible for female dependents age 10+
- ❌ Hidden for male users and dependents under 10

## Features

### 🗓️ Calendar View
- Interactive month calendar
- Color-coded days:
  - **Red**: Period days (logged)
  - **Pink**: Predicted period
  - **Blue**: Predicted fertile window
  - **Green**: Predicted ovulation day

### 📊 Predictions
- Next period start date
- Period window (start + duration)
- Fertile window (5 days before ovulation + ovulation day)
- Ovulation day estimate
- Irregular cycle support (±2 day ranges)

### 📝 Daily Logging
- Log period days and flow level (none/light/medium/heavy)
- Track symptoms: cramps, headache, bloating, acne, breast tenderness, fatigue
- Record mood: happy, anxious, irritable, sad
- Add personal notes (max 500 characters)

### 📈 Insights & Statistics
- Cycle history timeline
- Average cycle length
- Average period length
- Cycle regularity indicator
- Visual charts (using Recharts)

### ⚙️ Settings
- Edit cycle information (last period, cycle length, period length)
- Toggle irregular cycle mode
- Manage reminders (period expected, fertile window)
- Export data as JSON backup
- Import previously exported data
- Delete all data (with confirmation)

## Architecture

### Backend (Node.js + Express + MongoDB)

**Models:**
- `CycleSettings` - User-specific cycle configuration
- `DailyLog` - Daily symptoms, mood, and flow records
- `Cycle` - Computed cycle records (derived from logs)

**API Endpoints:**
```
GET    /api/cycle/settings       - Get user settings
POST   /api/cycle/settings       - Create initial settings
PATCH  /api/cycle/settings       - Update settings

POST   /api/cycle/logs           - Create/update daily log
GET    /api/cycle/logs           - Get logs (date range)
DELETE /api/cycle/logs/:date     - Delete specific log

GET    /api/cycle/cycles         - Get cycle history
GET    /api/cycle/predictions    - Get predictions

GET    /api/cycle/export         - Export all data
POST   /api/cycle/import         - Import data
DELETE /api/cycle/all            - Delete all data
```

**Authorization:**
- All endpoints require JWT authentication
- Users can manage their own cycle data
- Guardians can manage dependent's cycle data via `?userId=<dependentId>`

### Frontend (React + TypeScript)

**Code Splitting:**
- All cycle tracker components are lazy-loaded
- Only loaded when accessed by eligible users
- Reduces bundle size for male users

**Pages:**
- `CycleTrackerPage` - Main calendar view
- `CycleDailyLogPage` - Daily symptom/mood logging
- `CycleInsightsPage` - History and statistics
- `CycleSettingsPage` - Settings and data management
- `CycleOnboardingPage` - Initial setup flow

**Hooks:**
- `useCycleData` - Data fetching and management
- `useCycleCalendar` - Calendar generation logic
- `useCycleStats` - Statistics calculations
- `useCycleEligibility` - Gender/age-based visibility

**Components:**
- `Calendar` - Interactive month calendar
- `PredictionBanner` - Shows next period/fertile window
- `MonthNavigation` - Month selector with today button

## Setup

### Prerequisites
- Backend server running on port 3003
- Frontend running on port 3000
- MongoDB database connected
- User authenticated with valid JWT

### Installation

The feature is already integrated. No additional setup required!

### First Time Use

1. Navigate to the app with a female user profile
2. Click the "🌸 Cycle" tab in the navigation
3. Complete the onboarding:
   - Last period start date
   - Average cycle length (default: 28 days)
   - Average period length (default: 5 days)
   - Mark if cycle is irregular (optional)
4. Start tracking!

## Usage

### Tracking Your Period

1. On the calendar, click any day
2. Mark as "Period Day"
3. Select flow level: light, medium, or heavy
4. Add symptoms and mood (optional)
5. Save

### Viewing Predictions

- **Prediction banner** at the top shows:
  - Next period: "Expected in X days" or "Today - Day Y"
  - Fertile window: "Starts in X days" or "Ends in X days"
  
- **Calendar colors**:
  - Pink background = predicted period days
  - Blue background = predicted fertile window
  - Green highlight = predicted ovulation

### Checking Insights

1. Click "View Insights" or the 📊 button
2. View:
   - Cycle history (past cycles)
   - Average cycle/period length
   - Regularity indicator
   - Cycle length chart over time

### Editing Settings

1. Click the ⚙️ settings button
2. Update:
   - Last period start date
   - Cycle/period length
   - Irregular cycle toggle
   - Reminders
3. Click "Save Settings"

## How Predictions Work

### Simple & Transparent Algorithm

**Next Period Prediction:**
```
next_period_start = last_period_start + average_cycle_length
```

**Ovulation Day:**
```
ovulation_day = next_period_start - 14
```
(Based on standard 14-day luteal phase)

**Fertile Window:**
```
fertile_start = ovulation_day - 5
fertile_end = ovulation_day
```
(Sperm can survive up to 5 days)

**Irregular Cycles:**
If irregular mode is enabled:
- Period: ±2 days range
- Ovulation: ±2 days range

### Auto-Updates
Predictions automatically recalculate when:
- You log a new period start
- You update settings
- A new cycle is detected

### Important Notes
⚠️ **These are estimates only** - Not medical advice
- Cycle tracking apps should not be relied upon for birth control
- Consult a healthcare provider for medical concerns
- Predictions become more accurate with more logged cycles

## Privacy & Security

### Data Storage
- All cycle data stored in MongoDB
- Encrypted in transit (HTTPS)
- Access controlled via JWT authentication
- Not encrypted at rest in MongoDB (future enhancement)

### Data Access
- Users can only access their own data
- Guardians can access dependent's data (age 10+)
- No data sharing with third parties
- No analytics or tracking

### Data Portability
- Export all data as JSON
- Import to restore or transfer data
- Delete all data option available

## Data Export/Import

### Export Data

1. Go to Settings (⚙️)
2. Click "📥 Export Data"
3. JSON file downloads automatically
4. Filename: `cycle-data-{timestamp}.json`

**Export includes:**
- Cycle settings
- All daily logs
- Computed cycles

### Import Data

1. Go to Settings (⚙️)
2. Click "📤 Import Data"
3. Select previously exported JSON file
4. Confirm replacement
5. Data restored

**Import behavior:**
- Mode: Replace (overwrites existing data)
- Validates JSON structure
- Safe merge coming in future update

### Backup Recommendations

- Export data monthly
- Keep backups in secure location
- Test restore occasionally

## Technical Details

### Dependencies

**Frontend:**
- `recharts` - Charts and graphs
- React Router - Navigation
- Native `fetch` - API calls

**Backend:**
- `mongoose` - MongoDB ODM
- `express` - API routes
- JWT - Authentication

### File Structure

```
packages/webapp/
├── src/
│   ├── components/cycle/
│   │   ├── Calendar.tsx
│   │   ├── PredictionBanner.tsx
│   │   └── MonthNavigation.tsx
│   ├── hooks/
│   │   ├── useCycleData.ts
│   │   ├── useCycleCalendar.ts
│   │   ├── useCycleStats.ts
│   │   └── useCycleEligibility.ts
│   ├── pages/
│   │   ├── CycleTrackerPage.tsx
│   │   ├── CycleDailyLogPage.tsx
│   │   ├── CycleInsightsPage.tsx
│   │   ├── CycleSettingsPage.tsx
│   │   └── CycleOnboardingPage.tsx
│   ├── services/
│   │   └── cycleApi.ts
│   └── types/
│       └── cycle.ts

packages/webapp-backend/
├── src/
│   ├── models/
│   │   ├── cycle-settings.model.ts
│   │   ├── daily-log.model.ts
│   │   └── cycle.model.ts
│   ├── services/
│   │   └── cycle.service.ts
│   └── api/
│       └── cycle.routes.ts
```

### Performance Optimizations

- **Code splitting**: Lazy loading for female-only feature
- **Efficient queries**: Date range queries with indexes
- **Memoization**: Calendar and stats calculations cached
- **Debouncing**: Form inputs debounced

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## Future Enhancements

Potential improvements (not currently implemented):

- [ ] Push notifications for reminders
- [ ] Pregnancy mode
- [ ] Symptom correlations and insights
- [ ] PDF export for doctor visits
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Encryption at rest
- [ ] API for third-party apps
- [ ] Machine learning for irregular cycles

## Support

For issues, questions, or feature requests:
1. Check the main MyDoctor README
2. Review the codebase documentation
3. Contact the development team

## License

Part of the MyDoctor application. See main LICENSE file.

---

**Last Updated:** January 2026
**Version:** 1.0.0
**Status:** Production Ready ✅

