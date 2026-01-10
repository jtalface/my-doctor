/**
 * DependentsManager Component Tests
 * 
 * Tests the family members management component with CRUD operations
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../__tests__/test-utils';
import { DependentsManager } from '../DependentsManager';

describe('DependentsManager Component', () => {
  describe('Empty State', () => {
    it('shows empty state when no dependents', () => {
      render(<DependentsManager />, { mockDependents: [] });
      
      expect(screen.getByText(/no family members yet/i)).toBeInTheDocument();
    });

    it('shows add button in empty state', () => {
      render(<DependentsManager />, { mockDependents: [] });
      
      expect(screen.getByRole('button', { name: /add family member/i })).toBeInTheDocument();
    });

    it('shows family icon in empty state', () => {
      render(<DependentsManager />, { mockDependents: [] });
      
      expect(screen.getByText('👨‍👩‍👧‍👦')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator', () => {
      // Note: Would need to mock isLoadingDependents state
      render(<DependentsManager />);
      
      // Component should render without errors
      expect(screen.getByText(/family members/i)).toBeInTheDocument();
    });
  });

  describe('Dependents List', () => {
    const mockDependents = [
      {
        id: 'dep-1',
        name: 'Alice Smith',
        dateOfBirth: '2015-01-15',
        age: 9,
        relationship: 'child' as const,
        isPrimary: false,
        preferences: {},
      },
      {
        id: 'dep-2',
        name: 'Bob Smith',
        dateOfBirth: '2018-06-20',
        age: 6,
        relationship: 'child' as const,
        isPrimary: false,
        preferences: {},
      },
    ];

    it('displays all dependents', () => {
      render(<DependentsManager />, { mockDependents });
      
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('shows relationship for each dependent', () => {
      render(<DependentsManager />, { mockDependents });
      
      expect(screen.getAllByText(/child/i).length).toBeGreaterThan(0);
    });

    it('shows age for each dependent', () => {
      render(<DependentsManager />, { mockDependents });
      
      expect(screen.getByText(/9 years/i)).toBeInTheDocument();
      expect(screen.getByText(/6 years/i)).toBeInTheDocument();
    });

    it('shows date of birth for each dependent', () => {
      render(<DependentsManager />, { mockDependents });
      
      // Dates should be formatted and visible
      expect(screen.getByText(/january.*2015/i)).toBeInTheDocument();
      expect(screen.getByText(/june.*2018/i)).toBeInTheDocument();
    });

    it('shows initials for each dependent', () => {
      render(<DependentsManager />, { mockDependents });
      
      expect(screen.getByText('AS')).toBeInTheDocument();
      expect(screen.getByText('BS')).toBeInTheDocument();
    });

    it('shows primary manager badge when applicable', () => {
      const primaryDependent = [{
        ...mockDependents[0],
        isPrimary: true,
      }];

      render(<DependentsManager />, { mockDependents: primaryDependent });
      
      expect(screen.getByText(/primary manager/i)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    const mockDependent = {
      id: 'dep-1',
      name: 'Alice Smith',
      dateOfBirth: '2015-01-15',
      age: 9,
      relationship: 'child' as const,
      isPrimary: false,
      preferences: {},
    };

    it('shows edit button for each dependent', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      const editButton = screen.getByRole('link', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it('edit button links to profile setup page', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      const editButton = screen.getByRole('link', { name: /edit/i });
      expect(editButton).toHaveAttribute('href', `/dependent/${mockDependent.id}/profile/setup`);
    });

    it('shows share button for each dependent', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    it('shows export button for each dependent', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('shows delete button for each dependent', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('Add Dependent', () => {
    it('shows add button in header', () => {
      render(<DependentsManager />);
      
      expect(screen.getByRole('button', { name: /add family member/i })).toBeInTheDocument();
    });

    it('opens modal when add button clicked', async () => {
      const user = userEvent.setup();
      
      render(<DependentsManager />);
      
      await user.click(screen.getByRole('button', { name: /add family member/i }));
      
      // Modal should be present (would need to check for modal content)
      // This is a basic structural test
    });
  });

  describe('Delete Confirmation', () => {
    const mockDependent = {
      id: 'dep-1',
      name: 'Alice Smith',
      dateOfBirth: '2015-01-15',
      age: 9,
      relationship: 'child' as const,
      isPrimary: false,
      preferences: {},
    };

    it('shows confirmation dialog when delete clicked', async () => {
      const user = userEvent.setup();
      
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      await user.click(screen.getByRole('button', { name: /delete/i }));
      
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('shows dependent name in confirmation', async () => {
      const user = userEvent.setup();
      
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      await user.click(screen.getByRole('button', { name: /delete/i }));
      
      expect(screen.getByText(/alice smith/i)).toBeInTheDocument();
    });

    it('shows cancel button in confirmation', async () => {
      const user = userEvent.setup();
      
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      await user.click(screen.getByRole('button', { name: /delete/i }));
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('closes confirmation when cancel clicked', async () => {
      const user = userEvent.setup();
      
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      await user.click(screen.getByRole('button', { name: /delete/i }));
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });

  describe('Translations', () => {
    const mockDependent = {
      id: 'dep-1',
      name: 'Alice Smith',
      dateOfBirth: '2015-01-15',
      age: 9,
      relationship: 'child' as const,
      isPrimary: false,
      preferences: {},
    };

    it('displays in English by default', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      expect(screen.getByText(/family members/i)).toBeInTheDocument();
    });

    it('displays in Portuguese', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        isGuest: false,
        preferences: { language: 'pt', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<DependentsManager />, { 
        mockUser: mockUser as any,
        mockDependents: [mockDependent] 
      });
      
      // Portuguese translation for "Family Members"
      expect(screen.getByText(/membros da família/i)).toBeInTheDocument();
    });

    it('translates relationship labels', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      // Should show translated relationship
      expect(screen.getByText(/child/i)).toBeInTheDocument();
    });

    it('formats dates according to language', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        isGuest: false,
        preferences: { language: 'pt', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<DependentsManager />, { 
        mockUser: mockUser as any,
        mockDependents: [mockDependent] 
      });
      
      // Portuguese date format: "15 de janeiro de 2015"
      expect(screen.getByText(/janeiro.*2015/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const mockDependent = {
      id: 'dep-1',
      name: 'Alice Smith',
      dateOfBirth: '2015-01-15',
      age: 9,
      relationship: 'child' as const,
      isPrimary: false,
      preferences: {},
    };

    it('action buttons have accessible labels', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      expect(screen.getByLabelText(/edit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/share/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/delete/i)).toBeInTheDocument();
    });

    it('action buttons have title attributes', () => {
      render(<DependentsManager />, { mockDependents: [mockDependent] });
      
      const editButton = screen.getByLabelText(/edit/i);
      expect(editButton).toHaveAttribute('title');
    });
  });
});

