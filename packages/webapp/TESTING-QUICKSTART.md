# Testing Quick Start Guide

## 🚀 Get Testing in 5 Minutes

### Step 1: Install Dependencies (1 min)

```bash
cd packages/webapp

pnpm add -D vitest @vitest/ui @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event happy-dom
```

### Step 2: Update package.json (30 sec)

Add these scripts to `packages/webapp/package.json`:

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

### Step 3: Run Your First Test (1 min)

```bash
# Run all tests (currently just the Button example)
pnpm test

# Run tests in watch mode (auto-rerun on file changes)
pnpm test:watch

# Open interactive UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

---

## 📝 Writing Your First Test

### Example: Testing a Component

```tsx
// components/common/__tests__/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../__tests__/test-utils';
import { Card, CardContent } from '../Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <CardContent>
          <p>Card content</p>
        </CardContent>
      </Card>
    );
    
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    const { container } = render(<Card variant="outline">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('outline');
  });
});
```

### Example: Testing a Hook

```tsx
// hooks/__tests__/useCycleEligibility.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCycleEligibility } from '../useCycleEligibility';

// Mock dependencies
vi.mock('../../auth', () => ({
  useAuth: () => ({ user: { id: '1' }, isAuthenticated: true })
}));

vi.mock('../../contexts', () => ({
  useActiveProfile: () => ({
    activePatientProfile: {
      gender: 'female',
      dateOfBirth: '1995-01-01',
    }
  })
}));

describe('useCycleEligibility', () => {
  it('returns eligible for female users aged 18-50', () => {
    const { result } = renderHook(() => useCycleEligibility());
    expect(result.current.isEligible).toBe(true);
  });
});
```

---

## 🎯 Testing Checklist

When testing a component, consider:

- [ ] **Rendering**: Does it render correctly?
- [ ] **Interactions**: Click, type, hover, submit
- [ ] **States**: Loading, error, empty, disabled
- [ ] **Props**: Different prop combinations
- [ ] **Accessibility**: ARIA labels, keyboard navigation
- [ ] **Edge cases**: Null data, long text, empty arrays

---

## 🔧 Common Test Utilities

### Rendering with Context

```tsx
import { render } from '../__tests__/test-utils';

// With default mocks
render(<MyComponent />);

// With custom user
render(<MyComponent />, {
  mockUser: { email: 'custom@test.com' }
});

// With custom profile
render(<MyComponent />, {
  mockProfile: { gender: 'male', age: 25 }
});

// Unauthenticated
render(<MyComponent />, {
  mockUser: null
});
```

### User Interactions

```tsx
import { render, screen, userEvent } from '../__tests__/test-utils';

const user = userEvent.setup();

// Click
await user.click(screen.getByRole('button'));

// Type
await user.type(screen.getByRole('textbox'), 'Hello world');

// Select dropdown
await user.selectOptions(screen.getByRole('combobox'), 'option-value');

// Check checkbox
await user.click(screen.getByRole('checkbox'));
```

### Finding Elements

```tsx
// By role (PREFERRED - most accessible)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('heading', { level: 1 });

// By text
screen.getByText('Hello World');
screen.getByText(/hello/i); // case insensitive

// By label (for form inputs)
screen.getByLabelText('Email address');

// By placeholder
screen.getByPlaceholderText('Enter your email');

// For async elements
await screen.findByText('Loaded data');

// For elements that may not exist
screen.queryByText('Optional text'); // returns null if not found
```

### Assertions

```tsx
// Existence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Text content
expect(element).toHaveTextContent('Hello');
expect(element).toHaveTextContent(/hello/i);

// Attributes
expect(element).toHaveAttribute('href', '/home');
expect(element).toHaveClass('active');

// Form elements
expect(input).toHaveValue('John Doe');
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();

// Function calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
```

---

## 🐛 Debugging Tests

### View rendered output

```tsx
const { debug } = render(<MyComponent />);
debug(); // Prints current DOM to console
```

### Use screen.logTestingPlaygroundURL()

```tsx
render(<MyComponent />);
screen.logTestingPlaygroundURL();
// Opens Testing Playground with your rendered component
```

### Run single test

```bash
# Run specific test file
pnpm test Button.test.tsx

# Run tests matching pattern
pnpm test --grep "Button"

# Run single test by name
pnpm test --grep "renders with text"
```

---

## 📚 Additional Resources

- **Testing Plan**: See `TESTING-PLAN.md` for comprehensive strategy
- **Vitest Docs**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Testing Library Queries**: https://testing-library.com/docs/queries/about

---

## ✅ Next Steps

1. ✅ Run the example Button test
2. 📝 Write tests for Card component
3. 📝 Write tests for useCycleEligibility hook
4. 📝 Write tests for useTranslate hook
5. 📊 Check coverage: `pnpm test:coverage`
6. 🔄 Continue with the full plan in `TESTING-PLAN.md`

---

**Happy Testing! 🎉**

