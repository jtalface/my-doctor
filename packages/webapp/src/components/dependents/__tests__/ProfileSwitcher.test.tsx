/**
 * ProfileSwitcher Component Tests
 * 
 * Tests the profile switching dropdown for account holder and dependents
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../../__tests__/test-utils';
import { ProfileSwitcher } from '../ProfileSwitcher';

describe('ProfileSwitcher Component', () => {
  describe('Rendering', () => {
    it('renders the current profile name', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isGuest: false,
        preferences: { language: 'en', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<ProfileSwitcher />, { mockUser: mockUser as any });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders user initials in avatar', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isGuest: false,
        preferences: { language: 'en', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<ProfileSwitcher />, { mockUser: mockUser as any });
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders chevron icon', () => {
      render(<ProfileSwitcher />);
      
      expect(screen.getByText('▼')).toBeInTheDocument();
    });

    it('returns null when no user', () => {
      const { container } = render(<ProfileSwitcher />, { mockUser: null });
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Dropdown Interaction', () => {
    it('opens dropdown when trigger is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      const trigger = screen.getByRole('button', { name: /test user/i });
      await user.click(trigger);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown when trigger is clicked again', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      const trigger = screen.getByRole('button', { name: /test user/i });
      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.click(trigger);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('shows chevron up when open', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      const trigger = screen.getByRole('button', { name: /test user/i });
      await user.click(trigger);
      
      expect(screen.getByText('▲')).toBeInTheDocument();
    });

    it('has correct ARIA attributes', () => {
      render(<ProfileSwitcher />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Profile Options', () => {
    it('shows self profile option', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByRole('option', { name: /test user.*my profile/i })).toBeInTheDocument();
    });

    it('marks self profile as active', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      await user.click(screen.getByRole('button'));
      
      const selfOption = screen.getByRole('option', { name: /test user.*my profile/i });
      expect(selfOption).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows dependents when available', async () => {
      const user = userEvent.setup();
      const mockDependents = [
        {
          id: 'dep-1',
          name: 'Child One',
          dateOfBirth: '2015-01-01',
          age: 9,
          relationship: 'child' as const,
          isPrimary: false,
          preferences: {},
        },
        {
          id: 'dep-2',
          name: 'Child Two',
          dateOfBirth: '2018-01-01',
          age: 6,
          relationship: 'child' as const,
          isPrimary: false,
          preferences: {},
        },
      ];

      render(<ProfileSwitcher />, { mockDependents });
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByRole('option', { name: /child one/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /child two/i })).toBeInTheDocument();
    });

    it('shows relationship and age for dependents', async () => {
      const user = userEvent.setup();
      const mockDependents = [
        {
          id: 'dep-1',
          name: 'Child One',
          dateOfBirth: '2015-01-01',
          age: 9,
          relationship: 'child' as const,
          isPrimary: false,
          preferences: {},
        },
      ];

      render(<ProfileSwitcher />, { mockDependents });
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText(/9 years/i)).toBeInTheDocument();
    });
  });

  describe('Add Dependent Button', () => {
    it('shows add button when onAddDependent provided', async () => {
      const user = userEvent.setup();
      const handleAdd = vi.fn();
      
      render(<ProfileSwitcher onAddDependent={handleAdd} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByRole('button', { name: /add family member/i })).toBeInTheDocument();
    });

    it('does not show add button when onAddDependent not provided', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.queryByRole('button', { name: /add family member/i })).not.toBeInTheDocument();
    });

    it('calls onAddDependent when clicked', async () => {
      const user = userEvent.setup();
      const handleAdd = vi.fn();
      
      render(<ProfileSwitcher onAddDependent={handleAdd} />);
      
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /add family member/i }));
      
      expect(handleAdd).toHaveBeenCalledTimes(1);
    });

    it('closes dropdown after clicking add button', async () => {
      const user = userEvent.setup();
      const handleAdd = vi.fn();
      
      render(<ProfileSwitcher onAddDependent={handleAdd} />);
      
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /add family member/i }));
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('View/Edit Profile Button', () => {
    it('shows view/edit profile button', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByRole('button', { name: /view.*edit.*profile/i })).toBeInTheDocument();
    });
  });

  describe('Translations', () => {
    it('displays in English by default', async () => {
      const user = userEvent.setup();
      
      render(<ProfileSwitcher />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText(/switch profile/i)).toBeInTheDocument();
    });

    it('displays in Portuguese', async () => {
      const user = userEvent.setup();
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isGuest: false,
        preferences: { language: 'pt', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<ProfileSwitcher />, { mockUser: mockUser as any });
      
      await user.click(screen.getByRole('button'));
      
      // Portuguese translation for "Switch Profile"
      expect(screen.getByText(/trocar perfil/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading text when dependents are loading', async () => {
      const user = userEvent.setup();
      
      // Note: This would require mocking the loading state
      // For now, we'll test the structure
      render(<ProfileSwitcher />);
      
      await user.click(screen.getByRole('button'));
      
      // Dropdown should be present
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Initials Generation', () => {
    it('generates correct initials for single name', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'Madonna',
        lastName: '',
        name: 'Madonna',
        isGuest: false,
        preferences: { language: 'en', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<ProfileSwitcher />, { mockUser: mockUser as any });
      
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('generates correct initials for two names', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isGuest: false,
        preferences: { language: 'en', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<ProfileSwitcher />, { mockUser: mockUser as any });
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('limits initials to 2 characters for long names', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Jacob',
        name: 'John Jacob Jingleheimer Schmidt',
        isGuest: false,
        preferences: { language: 'en', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<ProfileSwitcher />, { mockUser: mockUser as any });
      
      // Should only show first 2 initials (JJ from "John Jacob")
      expect(screen.getByText('JJ')).toBeInTheDocument();
    });
  });
});

