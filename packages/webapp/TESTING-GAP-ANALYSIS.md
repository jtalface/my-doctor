# Test Coverage Gap Analysis

## 📊 Current Coverage Status

**Tested**: 11 components/hooks  
**Untested**: 60+ pages, 6 hooks, 5 API services, 3 contexts  
**Overall Coverage**: ~15% of codebase

---

## 🔴 CRITICAL GAPS (High Priority)

### 1. API Services (0% coverage) ⚠️
**Impact**: Very High - All features depend on these

- **`api.ts`** - Core API client with 40+ endpoints
  - User authentication (login, register, logout)
  - Profile management (CRUD)
  - Dependents management
  - Session management
  - Health records
  
- **`cycleApi.ts`** - Cycle tracker API
  - Settings CRUD
  - Daily logs
  - Cycle history
  
- **`glucoseApi.ts`** - GlucoGuide API
  - Settings, readings, metrics
  - Suggestions and patterns
  - Reports generation
  
- **`bpApi.ts`** - PressurePal API
  - Settings, sessions, suggestions
  - Analytics and patterns
  
- **`authFetch`** utility - JWT token handling

**Why Critical**: If APIs break, everything breaks. No tests = no safety net.

---

### 2. Authentication Flow (0% coverage) ⚠️
**Impact**: Very High - Blocks all features

- **LoginPage** - Email/password, guest mode
- **RegisterPage** - Account creation
- **AuthContext** - Login, logout, token management
- Auth guards and redirects

**Why Critical**: Can't use app if auth is broken.

---

### 3. Core Contexts (0% coverage) ⚠️
**Impact**: High - Used throughout app

- **AuthContext** - User state, profile, auth methods
- **ActiveProfileContext** - Profile switching, dependents
- **CallProvider** - WebRTC call functionality

**Why Critical**: Many components rely on these. Bugs affect entire app.

---

## 🟠 MAJOR FEATURE GAPS (Medium-High Priority)

### 4. GlucoGuide - Complete Feature (0% coverage)
**Impact**: High - Major feature for diabetic patients

**Pages** (6):
- ❌ GlucoseOnboardingPage - Setup wizard
- ❌ GlucoseDashboardPage - Summary & quick actions
- ❌ GlucoseLogPage - Log readings
- ❌ GlucoseInsightsPage - Patterns & suggestions
- ❌ GlucoseReportsPage - Export & reports
- ❌ GlucoseSettingsPage - Targets & preferences

**Hooks** (3):
- ❌ useGlucoseData - Main data hook
- ❌ useGlucoseSuggestions - Rule engine
- ❌ useGlucosePatterns - Pattern detection

**Complexity**: High - Rule-based suggestions, unit conversion, pattern detection

---

### 5. PressurePal - Complete Feature (0% coverage)
**Impact**: High - Major feature for hypertension patients

**Pages** (6):
- ❌ BPOnboardingPage - Setup wizard
- ❌ BPDashboardPage - Summary & quick actions
- ❌ BPSessionLogPage - Multi-reading sessions
- ❌ BPInsightsPage - Patterns & classification
- ❌ BPReportsPage - Export & reports
- ❌ BPSettingsPage - Targets & preferences

**Hooks** (1):
- ❌ useBPData - Main data hook with analytics

**Complexity**: High - Session-based logging, classification, hypertensive crisis detection

---

### 6. Cycle Tracker - Partially Tested (40% coverage)
**Impact**: Medium - Feature for female users

**Components** (Tested):
- ✅ Calendar (18 tests)
- ✅ PredictionBanner (14 tests)

**Pages** (Not Tested):
- ❌ CycleOnboardingPage - Setup wizard
- ❌ CycleTrackerPage - Main overview
- ❌ CycleDailyLogPage - Log symptoms/mood
- ❌ CycleInsightsPage - Patterns & predictions
- ❌ CycleSettingsPage - Cycle preferences

**Hooks** (Not Tested):
- ❌ useCycleData - Fetches all cycle data
- ❌ useCycleCalendar - Calendar generation logic
- ❌ useCycleStats - Statistics calculations

**Gap**: Have basic components, but missing pages and data logic.

---

### 7. Core User Pages (0% coverage)
**Impact**: Medium-High - Core app navigation

- ❌ **DashboardPage** (HomePage) - Main landing page
  - Quick actions
  - Recent activity
  - Health snapshot
  
- ❌ **ProfilePage** - View/edit profile
  - Demographics
  - Medical history
  - Lifestyle info
  
- ❌ **ProfileSetupPage** - Onboarding wizard
  - Multi-step form
  - Validation
  - Complex state
  
- ❌ **SettingsPage** - App settings
  - Language selection
  - Notifications
  - Dependents management
  - Data export

---

### 8. Health Records (0% coverage)
**Impact**: Medium - Core feature

- ❌ **HealthHistoryPage** - View all sessions
- ❌ **CheckupStartPage** - Start new checkup
- ❌ **CheckupConsentPage** - AI consent
- ❌ **CheckupSessionPage** - Active checkup
- ❌ **VisitSummaryPage** - Session results
- ❌ **RedFlagAlertPage** - Critical alerts

---

### 9. Communication (0% coverage)
**Impact**: Medium - Core feature

- ❌ **MessagesPage** - Doctor chat
- ❌ **CallProvider** - WebRTC calls
- ❌ **webrtc.ts** service - Call logic

---

## 🟡 MINOR GAPS (Lower Priority)

### 10. Utility Pages (0% coverage)
**Impact**: Low

- ❌ SplashPage - Loading screen
- ❌ NotFoundPage - 404 page
- ❌ DependentProfileSetupPage - Dependent setup

---

## 📈 Coverage Summary by Category

| Category | Total Items | Tested | % Coverage | Priority |
|----------|-------------|--------|------------|----------|
| **API Services** | 5 | 0 | 0% | 🔴 Critical |
| **Auth** | 3 pages + context | 0 | 0% | 🔴 Critical |
| **Contexts** | 3 | 0 | 0% | 🔴 Critical |
| **GlucoGuide** | 6 pages + 3 hooks | 0 | 0% | 🟠 High |
| **PressurePal** | 6 pages + 1 hook | 0 | 0% | 🟠 High |
| **Cycle Tracker** | 5 pages + 3 hooks + 2 components | 2 | 25% | 🟠 Medium |
| **Core Pages** | 4 pages | 0 | 0% | 🟠 High |
| **Health Records** | 6 pages | 0 | 0% | 🟡 Medium |
| **Communication** | 1 page + services | 0 | 0% | 🟡 Medium |
| **Common Components** | 3 | 3 | 100% | ✅ Done |
| **Layout Components** | 2 | 2 | 100% | ✅ Done |
| **i18n System** | 1 hook | 1 | 100% | ✅ Done |

---

## 🎯 Recommended Testing Priority

### Phase 3: Services & API (Most Critical) 🔴
**Effort**: 3-4 days  
**Impact**: Very High  
**Tests**: ~50-60

**Why First**: Everything depends on APIs. If these work, features work.

Setup MSW (Mock Service Worker) and test:
1. api.ts - Core endpoints
2. authFetch - Token handling
3. cycleApi.ts - Cycle endpoints
4. glucoseApi.ts - Glucose endpoints
5. bpApi.ts - BP endpoints

---

### Phase 4: Auth & Contexts 🔴
**Effort**: 2-3 days  
**Impact**: Very High  
**Tests**: ~30-40

**Why Second**: Fundamental to app functionality.

Test:
1. AuthContext - Login/logout flows
2. ActiveProfileContext - Profile switching
3. LoginPage - Auth UI
4. RegisterPage - Registration flow

---

### Phase 5: Core Pages 🟠
**Effort**: 3-4 days  
**Impact**: High  
**Tests**: ~40-50

**Why Third**: Most-used pages.

Test:
1. DashboardPage - Main landing
2. ProfilePage - Profile viewing
3. ProfileSetupPage - Onboarding
4. SettingsPage - App settings

---

### Phase 6: Feature-Specific (GlucoGuide) 🟠
**Effort**: 4-5 days  
**Impact**: High (for diabetic users)  
**Tests**: ~60-70

Test all GlucoGuide pages and hooks.

---

### Phase 7: Feature-Specific (PressurePal) 🟠
**Effort**: 4-5 days  
**Impact**: High (for hypertension users)  
**Tests**: ~60-70

Test all PressurePal pages and hooks.

---

### Phase 8: Complete Cycle Tracker 🟡
**Effort**: 2-3 days  
**Impact**: Medium  
**Tests**: ~40-50

Finish cycle tracker pages and hooks.

---

### Phase 9: Health Records & Communication 🟡
**Effort**: 3-4 days  
**Impact**: Medium  
**Tests**: ~50-60

Test checkup flow and messaging.

---

## 💰 ROI Analysis

### Highest ROI (Do First)
1. **API Services** - Small effort, huge impact
2. **Auth Context** - Critical, used everywhere
3. **Core Hooks** - Reused across features

### Medium ROI
4. **Core Pages** - High visibility
5. **GlucoGuide/PressurePal** - Complex but isolated

### Lower ROI
6. **Individual page components** - Time-consuming, lower coverage value
7. **Utility pages** - Rarely break, low complexity

---

## 🚀 Quick Wins (Low Effort, High Value)

1. **authFetch utility** (1 hour, 8-10 tests)
   - Token injection
   - Error handling
   - Refresh token logic

2. **useCycleData hook** (2 hours, 12-15 tests)
   - Already have component tests
   - Data fetching logic

3. **Profile switching** (2 hours, 15-20 tests)
   - Already partially tested
   - Complete the coverage

4. **Date/utility functions** (1 hour, 10-15 tests)
   - Pure functions
   - Easy to test

---

## 📊 Time Estimates

### To 50% Coverage (~500 tests)
**Phases 3-5**: ~8-10 days  
**Focus**: Critical infrastructure + core pages

### To 70% Coverage (~700 tests)
**Phases 3-7**: ~18-22 days  
**Focus**: Add major features

### To 90% Coverage (~900 tests)
**All Phases**: ~30-35 days  
**Focus**: Complete coverage

---

## 🎓 Recommendations

### For Production Readiness
**Minimum**: Complete Phases 3-4 (Critical infrastructure)  
**Recommended**: Complete Phases 3-5 (Add core pages)  
**Ideal**: Complete Phases 3-7 (Add major features)

### For Maintenance Mode
Current coverage (190+ tests) is actually **decent** for:
- Regression testing common components
- Validating navigation
- Ensuring i18n works

But **risky** for:
- API changes
- Auth bugs
- Feature-specific bugs

### Pragmatic Approach
**Don't test everything at once.**

Instead:
1. ✅ Test what you change (add tests when fixing bugs)
2. ✅ Test new features before merging
3. ✅ Prioritize high-traffic paths
4. ✅ Add integration tests for critical flows

---

## 🔍 Critical Flows to Test First

### 1. User Journey: New User
```
Register → Login → Profile Setup → Dashboard
```
**Risk**: High (broken = no new users)  
**Effort**: 2-3 days

### 2. User Journey: GlucoGuide Setup
```
Dashboard → Glucose Entry → Onboarding → Setup → Log Reading
```
**Risk**: High (major feature)  
**Effort**: 3-4 days

### 3. User Journey: Profile Switching
```
Settings → Add Dependent → Switch Profile → Log Data
```
**Risk**: Medium (already partially tested)  
**Effort**: 1-2 days

---

## ✅ Bottom Line

**What's Missing**: Almost everything except common components and navigation.

**Most Critical Gaps**:
1. 🔴 API services (no tests = no safety net)
2. 🔴 Authentication (broken auth = broken app)
3. 🔴 Contexts (used everywhere)

**Quick Wins**:
- authFetch utility
- useCycleData hook
- Date utilities

**Best Next Step**: Phase 3 (Services & API) - Highest ROI, blocks everything else.

**Current State**: Good foundation, but missing critical infrastructure tests.

