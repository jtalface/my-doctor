# Unit Testing Plan - MyDoctor WebApp

## 📋 Table of Contents
- [Test Organization Strategy](#test-organization-strategy)
- [Folder Structure Decision](#folder-structure-decision)
- [Testing Stack](#testing-stack)
- [Implementation Phases](#implementation-phases)
- [Test Coverage Goals](#test-coverage-goals)
- [Examples & Patterns](#examples--patterns)

---

## 🎯 Test Organization Strategy

### Industry Standard Analysis

**Option 1: Co-located tests (RECOMMENDED ✅)**
```
components/
  common/
    Button.tsx
    Button.module.css
    __tests__/
      Button.test.tsx
```

**Pros:**
- ✅ Industry standard for React (used by Meta, Vercel, Airbnb)
- ✅ Easy to find and maintain tests alongside code
- ✅ Better for component-driven development
- ✅ Tests are naturally scoped to their modules
- ✅ Easier to ensure tests stay in sync with code changes
- ✅ Recommended by Jest, Vitest, and React Testing Library docs
- ✅ Aligns with your preference

**Cons:**
- ⚠️ Slightly more files in component directories

**Option 2: Centralized test directory**
```
src/
  components/
    common/
      Button.tsx
  __tests__/
    components/
      common/
        Button.test.tsx
```

**Pros:**
- ✅ Cleaner source directory structure
- ✅ All tests in one place

**Cons:**
- ❌ Harder to navigate between test and implementation
- ❌ Tests can get out of sync more easily
- ❌ Not the modern React standard
- ❌ Requires more folder nesting to mirror structure

### **DECISION: Co-located `__tests__/` folders ✅**

This aligns with:
- Your preference
- Industry best practices (React Testing Library, Jest, Vitest)
- Modern React projects (Next.js, Create React App, Remix)
- Open-source standards (React, Material-UI, Chakra UI)

---

## 📁 Folder Structure Decision

### Recommended Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── __tests__/
│   │       └── Button.test.tsx
│   ├── cycle/
│   │   ├── Calendar.tsx
│   │   ├── Calendar.module.css
│   │   └── __tests__/
│   │       └── Calendar.test.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Header.module.css
│       └── __tests__/
│           └── Header.test.tsx
├── hooks/
│   ├── useCycleData.ts
│   └── __tests__/
│       └── useCycleData.test.ts
├── services/
│   ├── api.ts
│   └── __tests__/
│       └── api.test.ts
├── utils/
│   ├── dateHelpers.ts
│   └── __tests__/
│       └── dateHelpers.test.ts
├── i18n/
│   ├── useTranslate.ts
│   └── __tests__/
│       └── useTranslate.test.ts
└── pages/
    ├── DashboardPage.tsx
    └── __tests__/
        └── DashboardPage.test.tsx
```

### Naming Conventions

- Test files: `*.test.tsx` or `*.test.ts`
- Test folders: `__tests__/`
- Test file naming: Match the component/module name exactly
- Setup files: `setup.ts` or `test-utils.tsx` in `src/__tests__/` (root level)

---

## 🛠 Testing Stack

### Core Testing Tools

```json
{
  "devDependencies": {
    // Testing Framework
    "vitest": "^1.0.0",                          // Fast, Vite-native test runner
    "@vitest/ui": "^1.0.0",                      // UI for test results
    
    // React Testing
    "@testing-library/react": "^14.0.0",         // React component testing
    "@testing-library/jest-dom": "^6.0.0",       // Custom matchers
    "@testing-library/user-event": "^14.0.0",    // User interactions
    "@testing-library/react-hooks": "^8.0.1",    // Hook testing
    
    // Mocking & Test Utilities
    "msw": "^2.0.0",                             // API mocking (Mock Service Worker)
    "happy-dom": "^12.0.0",                      // Fast DOM implementation for Vitest
    
    // Type Support
    "@vitest/coverage-v8": "^1.0.0"              // Coverage reporting
  }
}
```

### Why Vitest?
- ✅ Built for Vite (you're already using it)
- ✅ ~10x faster than Jest for Vite projects
- ✅ Compatible with Jest API (easy migration if needed)
- ✅ Built-in TypeScript support
- ✅ Native ESM support
- ✅ Watch mode with HMR

---

## 📊 Implementation Phases

### Phase 1: Foundation & High-Value Tests (Week 1)
**Priority: Critical business logic and reusable components**

#### 1.1 Common Components (5-7 tests)
```
components/common/__tests__/
├── Button.test.tsx           ⭐ High priority - used everywhere
├── Card.test.tsx             ⭐ High priority - used everywhere
└── Logo.test.tsx             ⭐ Medium priority
```

**Why start here?**
- Used across the entire app
- Simple to test (good for establishing patterns)
- High ROI on test coverage

#### 1.2 Custom Hooks (6 tests)
```
hooks/__tests__/
├── useCycleEligibility.test.ts    ⭐ Critical - controls feature visibility
├── useCycleData.test.ts           ⭐ High - complex data logic
├── useGlucoseData.test.ts         ⭐ High - complex data logic
├── useBPData.test.ts              ⭐ High - complex data logic
├── useCycleCalendar.test.ts       🔸 Medium
└── useCycleStats.test.ts          🔸 Medium
```

**Why test hooks?**
- Core business logic lives here
- Easy to test in isolation
- High complexity = high bug risk

#### 1.3 i18n System (2 tests)
```
i18n/__tests__/
├── useTranslate.test.ts           ⭐ Critical - used everywhere
└── translations.test.ts           🔸 Medium - validate keys exist
```

**Why test i18n?**
- Used in every component
- Easy to break with missing keys
- Simple to test

#### 1.4 Test Setup & Utilities
```
src/__tests__/
├── setup.ts                       ⭐ Test configuration
└── test-utils.tsx                 ⭐ Custom render functions
```

**Estimated Time:** 3-5 days
**Estimated Coverage:** ~40% of critical paths

---

### Phase 2: Feature Components (Week 2)

#### 2.1 Cycle Tracker Components (3 tests)
```
components/cycle/__tests__/
├── Calendar.test.tsx              ⭐ High - complex UI logic
├── PredictionBanner.test.tsx      🔸 Medium
└── MonthNavigation.test.tsx       🔸 Medium
```

#### 2.2 Dependents Components (4 tests)
```
components/dependents/__tests__/
├── DependentsManager.test.tsx     ⭐ High - complex CRUD
├── ProfileSwitcher.test.tsx       ⭐ High - critical for UX
├── AddDependentModal.test.tsx     🔸 Medium
└── ShareDependentModal.test.tsx   🔸 Low
```

#### 2.3 Layout Components (3 tests)
```
components/layout/__tests__/
├── Header.test.tsx                ⭐ High - navigation logic
├── BottomNav.test.tsx             ⭐ High - navigation logic
└── Layout.test.tsx                🔸 Medium
```

**Estimated Time:** 3-4 days
**Estimated Coverage:** ~60% of components

---

### Phase 3: Services & API Layer (Week 3)

#### 3.1 API Services (5 tests)
```
services/__tests__/
├── api.test.ts                    ⭐ Critical - auth & core API
├── cycleApi.test.ts               ⭐ High
├── glucoseApi.test.ts             ⭐ High
├── bpApi.test.ts                  ⭐ High
└── webrtc.test.ts                 🔸 Low (complex, can defer)
```

**Testing approach:**
- Use MSW (Mock Service Worker) for API mocking
- Test request/response handling
- Test error scenarios
- Test authentication token handling

**Estimated Time:** 4-5 days
**Estimated Coverage:** ~75% of critical services

---

### Phase 4: Context & State Management (Week 4)

#### 4.1 Contexts (3 tests)
```
contexts/__tests__/
├── ActiveProfileContext.test.tsx  ⭐ Critical - profile switching
├── CallContext.test.tsx           🔸 Medium
└── index.test.ts                  🔸 Low - exports only
```

#### 4.2 Auth System (3 tests)
```
auth/__tests__/
├── AuthContext.test.tsx           ⭐ Critical
├── authService.test.ts            ⭐ Critical
└── ProtectedRoute.test.tsx        ⭐ High
```

**Estimated Time:** 3-4 days
**Estimated Coverage:** ~85% of state management

---

### Phase 5: Complex Pages (Week 5-6)

#### 5.1 Health Feature Pages (Priority order)
```
pages/__tests__/
├── DashboardPage.test.tsx         ⭐ Critical - main landing
├── CycleTrackerPage.test.tsx      🔸 Medium
├── GlucoseDashboardPage.test.tsx  🔸 Medium
├── BPDashboardPage.test.tsx       🔸 Medium
├── MessagesPage.test.tsx          🔸 Medium
├── ProfilePage.test.tsx           🔸 Medium
└── SettingsPage.test.tsx          🔸 Low
```

**Note:** Pages are lower priority for unit tests because:
- They're mostly composition (integration tests better suited)
- Complex user flows better tested with E2E
- Focus unit tests on logic-heavy pages

**Estimated Time:** 5-7 days
**Estimated Coverage:** ~90% overall

---

### Phase 6: Utilities & Edge Cases (Week 7)

#### 6.1 Utility Functions
```
utils/__tests__/
└── (any utility files).test.ts
```

#### 6.2 Type Guards & Validators
```
types/__tests__/
└── (validation functions).test.ts
```

**Estimated Time:** 2-3 days
**Estimated Coverage:** ~95%

---

## 🎯 Test Coverage Goals

### Coverage Targets by Category

| Category | Target | Priority | Rationale |
|----------|--------|----------|-----------|
| **Hooks** | 90%+ | Critical | Core business logic |
| **Services/API** | 85%+ | Critical | External dependencies |
| **Common Components** | 85%+ | High | Reused everywhere |
| **Feature Components** | 70%+ | High | Complex UI logic |
| **Contexts** | 90%+ | High | State management |
| **Auth** | 95%+ | Critical | Security-critical |
| **i18n** | 80%+ | Medium | User experience |
| **Pages** | 40-60% | Low | Better for E2E |
| **Utils** | 90%+ | Medium | Pure functions, easy to test |

### Overall Goal
- **Phase 1-3:** 70% coverage of critical paths
- **Phase 4-6:** 80-85% overall coverage
- **Focus:** Quality > quantity (test behavior, not implementation)

---

## 📖 Examples & Patterns

### Example 1: Testing a Common Component

**File:** `components/common/__tests__/Button.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('primary');
    
    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('outline');
  });
});
```

### Example 2: Testing a Custom Hook

**File:** `hooks/__tests__/useCycleEligibility.test.ts`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCycleEligibility } from '../useCycleEligibility';
import { useAuth } from '../../auth';
import { useActiveProfile } from '../../contexts';

// Mock dependencies
vi.mock('../../auth');
vi.mock('../../contexts');

describe('useCycleEligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns eligible for female users aged 18-50', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', preferences: {} },
      isAuthenticated: true,
    } as any);
    
    vi.mocked(useActiveProfile).mockReturnValue({
      activePatientProfile: {
        gender: 'female',
        dateOfBirth: new Date('1995-01-01').toISOString(),
      },
      isViewingDependent: false,
    } as any);

    const { result } = renderHook(() => useCycleEligibility());
    
    expect(result.current.isEligible).toBe(true);
  });

  it('returns not eligible for male users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', preferences: {} },
      isAuthenticated: true,
    } as any);
    
    vi.mocked(useActiveProfile).mockReturnValue({
      activePatientProfile: {
        gender: 'male',
        dateOfBirth: new Date('1995-01-01').toISOString(),
      },
      isViewingDependent: false,
    } as any);

    const { result } = renderHook(() => useCycleEligibility());
    
    expect(result.current.isEligible).toBe(false);
  });

  it('returns not eligible for users under 18', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', preferences: {} },
      isAuthenticated: true,
    } as any);
    
    vi.mocked(useActiveProfile).mockReturnValue({
      activePatientProfile: {
        gender: 'female',
        dateOfBirth: new Date('2015-01-01').toISOString(), // 9 years old
      },
      isViewingDependent: false,
    } as any);

    const { result } = renderHook(() => useCycleEligibility());
    
    expect(result.current.isEligible).toBe(false);
  });
});
```

### Example 3: Testing with i18n

**File:** `components/layout/__tests__/Header.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../__tests__/test-utils'; // Custom render with providers
import { Header } from '../Header';

describe('Header', () => {
  it('renders navigation links with translations', () => {
    render(<Header />);
    
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument();
  });

  it('shows cycle link for eligible users', () => {
    render(<Header />, {
      mockUser: { gender: 'female', dateOfBirth: '1995-01-01' }
    });
    
    expect(screen.getByRole('link', { name: /cycle/i })).toBeInTheDocument();
  });

  it('hides cycle link for non-eligible users', () => {
    render(<Header />, {
      mockUser: { gender: 'male', dateOfBirth: '1995-01-01' }
    });
    
    expect(screen.queryByRole('link', { name: /cycle/i })).not.toBeInTheDocument();
  });
});
```

### Example 4: Testing API with MSW

**File:** `services/__tests__/cycleApi.test.ts`

```tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { cycleApi } from '../cycleApi';

// Setup MSW mock server
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('cycleApi', () => {
  it('fetches settings successfully', async () => {
    const mockSettings = { targetCycleLength: 28, trackedSymptoms: ['cramps'] };
    
    server.use(
      http.get('/api/cycle/settings', () => {
        return HttpResponse.json(mockSettings);
      })
    );

    const settings = await cycleApi.getSettings();
    expect(settings).toEqual(mockSettings);
  });

  it('handles network errors gracefully', async () => {
    server.use(
      http.get('/api/cycle/settings', () => {
        return HttpResponse.error();
      })
    );

    await expect(cycleApi.getSettings()).rejects.toThrow();
  });

  it('includes auth token in requests', async () => {
    let requestHeaders: Headers;
    
    server.use(
      http.get('/api/cycle/settings', ({ request }) => {
        requestHeaders = request.headers;
        return HttpResponse.json({});
      })
    );

    localStorage.setItem('authToken', 'test-token');
    await cycleApi.getSettings();
    
    expect(requestHeaders.get('Authorization')).toBe('Bearer test-token');
  });
});
```

### Example 5: Test Utilities Setup

**File:** `src/__tests__/test-utils.tsx`

```tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { ActiveProfileProvider } from '../contexts';

// Custom render function with all providers
interface CustomRenderOptions extends RenderOptions {
  mockUser?: any;
  mockProfile?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    mockUser = { id: '1', email: 'test@example.com', preferences: { language: 'en' } },
    mockProfile = { gender: 'female', dateOfBirth: '1995-01-01' },
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <AuthProvider initialUser={mockUser}>
          <ActiveProfileProvider initialProfile={mockProfile}>
            {children}
          </ActiveProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };
```

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
cd packages/webapp
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @testing-library/react-hooks \
  msw happy-dom
```

### Step 2: Configure Vitest

Create `vitest.config.ts` (see separate config file)

### Step 3: Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Step 4: Create Test Setup File

Create `src/__tests__/setup.ts` and `src/__tests__/test-utils.tsx`

### Step 5: Write Your First Test

Start with `components/common/__tests__/Button.test.tsx`

---

## 📊 Tracking Progress

### Coverage Command

```bash
pnpm test:coverage
```

This generates an HTML report in `coverage/` showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

### CI Integration (Future)

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:coverage
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

## ✅ Best Practices

1. **Test Behavior, Not Implementation**
   - ❌ Don't test internal state
   - ✅ Test what the user sees and does

2. **Use Testing Library Queries**
   - Prefer `getByRole` over `getByTestId`
   - Use semantic HTML and ARIA

3. **Avoid Test Fragility**
   - Don't rely on CSS classes
   - Don't snapshot entire components (too brittle)

4. **Mock Wisely**
   - Mock external dependencies (APIs, localStorage)
   - Don't mock what you're testing
   - Keep mocks simple

5. **Test Edge Cases**
   - Empty states
   - Error states
   - Loading states
   - Permission boundaries

6. **Keep Tests Fast**
   - Unit tests should run in < 5 seconds total
   - Use `vi.mock()` for expensive operations
   - Avoid real network calls

---

## 📝 Next Steps

1. **Review this plan** - Discuss priorities and timeline
2. **Setup tooling** - Install dependencies and configure Vitest
3. **Start Phase 1** - Begin with common components and hooks
4. **Establish patterns** - First few tests set the standard
5. **Iterate and improve** - Refine approach based on learnings

---

## 🤔 Questions to Decide

1. **Timeline**: Is 7 weeks reasonable, or should we prioritize differently?
2. **Coverage Goals**: Are the targets (70-95%) appropriate?
3. **Tooling**: Any preference for test runners or tools?
4. **CI/CD**: Should we setup automated testing in CI?
5. **Code Review**: Should tests be required for all new features?

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-10  
**Author:** AI Assistant  
**Status:** Draft - Awaiting Review

