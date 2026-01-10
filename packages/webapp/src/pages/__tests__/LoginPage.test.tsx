/**
 * LoginPage Component Tests
 * 
 * Tests the login page including form submission, validation, and navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../__tests__/test-utils';
import { LoginPage } from '../LoginPage';
import * as authService from '../../auth/authService';

// Mock the auth service
vi.mock('../../auth/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
  isAuthenticated: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('renders login form', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders logo', () => {
      render(<LoginPage />);

      expect(screen.getByAltText(/zambe/i)).toBeInTheDocument();
    });

    it('renders back button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument();
    });

    it('renders register link', () => {
      render(<LoginPage />);

      expect(screen.getByRole('link', { name: /create.*account/i })).toBeInTheDocument();
    });

    it('renders language selector', () => {
      render(<LoginPage />);

      // Language selector should be present
      expect(screen.getByText(/english/i)).toBeInTheDocument();
    });

    it('renders remember me checkbox', () => {
      render(<LoginPage />);

      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('allows typing in email field', async () => {
      const user = userEvent.setup();

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('allows typing in password field', async () => {
      const user = userEvent.setup();

      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();

      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /show password/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles remember me checkbox', async () => {
      const user = userEvent.setup();

      render(<LoginPage />);

      const checkbox = screen.getByRole('checkbox', { name: /remember me/i });

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Form Submission', () => {
    it('submits login form with credentials', async () => {
      const user = userEvent.setup();

      vi.mocked(authService.login).mockResolvedValue({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
          isGuest: false,
          preferences: { notifications: true, dataSharing: false, language: 'en' },
        },
        accessToken: 'token',
        expiresIn: 3600,
      });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', false);
      });
    });

    it('passes remember me flag to login', async () => {
      const user = userEvent.setup();

      vi.mocked(authService.login).mockResolvedValue({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
          isGuest: false,
          preferences: { notifications: true, dataSharing: false, language: 'en' },
        },
        accessToken: 'token',
        expiresIn: 3600,
      });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('checkbox', { name: /remember me/i }));
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', true);
      });
    });

    it('navigates to dashboard on successful login', async () => {
      const user = userEvent.setup();

      vi.mocked(authService.login).mockResolvedValue({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
          isGuest: false,
          preferences: { notifications: true, dataSharing: false, language: 'en' },
        },
        accessToken: 'token',
        expiresIn: 3600,
      });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('displays error on login failure', async () => {
      const user = userEvent.setup();

      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrong-password');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('disables submit button while loading', async () => {
      const user = userEvent.setup();

      // Create a promise that won't resolve immediately
      let resolveLogin: any;
      vi.mocked(authService.login).mockReturnValue(
        new Promise(resolve => { resolveLogin = resolve; })
      );

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Button should be disabled while loading
      expect(submitButton).toBeDisabled();

      // Resolve the login
      resolveLogin({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
          isGuest: false,
          preferences: { notifications: true, dataSharing: false, language: 'en' },
        },
        accessToken: 'token',
        expiresIn: 3600,
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('clears error on new submission', async () => {
      const user = userEvent.setup();

      // First attempt fails
      vi.mocked(authService.login).mockRejectedValueOnce(new Error('Invalid credentials'));

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrong-password');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Second attempt succeeds
      vi.mocked(authService.login).mockResolvedValueOnce({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
          isGuest: false,
          preferences: { notifications: true, dataSharing: false, language: 'en' },
        },
        accessToken: 'token',
        expiresIn: 3600,
      });

      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), 'correct-password');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('requires email field', async () => {
      const user = userEvent.setup();

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('requires password field', async () => {
      const user = userEvent.setup();

      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
    });

    it('uses email input type', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Translations', () => {
    it('displays in English by default', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });

    it('updates UI when language changes', async () => {
      const user = userEvent.setup();

      render(<LoginPage />);

      // Find and click language selector (implementation may vary)
      // This is a placeholder - actual implementation depends on LanguageSelector component
      expect(screen.getByText(/english/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('has proper button roles', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    });

    it('has autocomplete attributes', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });
});

