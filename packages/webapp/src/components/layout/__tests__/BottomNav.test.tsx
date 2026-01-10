/**
 * BottomNav Component Tests
 * 
 * Tests the mobile bottom navigation bar
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../__tests__/test-utils';
import { BottomNav } from '../BottomNav';

describe('BottomNav Component', () => {
  describe('Rendering', () => {
    it('renders all base navigation items', () => {
      render(<BottomNav />);
      
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });

    it('has navigation landmark', () => {
      render(<BottomNav />);
      
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    });
  });

  describe('Navigation Structure', () => {
    it('renders 5 items for non-eligible users', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'male' as const,
          dateOfBirth: '1995-01-01',
        },
      };

      render(<BottomNav />, { mockProfile });
      
      const navItems = screen.getAllByRole('link');
      expect(navItems).toHaveLength(5); // Home, History, Messages, Profile, Settings
    });

    it('renders 5 items for eligible users (includes Cycle)', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'female' as const,
          dateOfBirth: '1995-01-01',
        },
      };

      render(<BottomNav />, { mockProfile });
      
      const navItems = screen.getAllByRole('link');
      expect(navItems).toHaveLength(5); // Home, History, Cycle, Messages, Profile
    });
  });

  describe('Cycle Link Visibility', () => {
    it('shows cycle link for eligible female users', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'female' as const,
          dateOfBirth: '1995-01-01',
        },
      };

      render(<BottomNav />, { mockProfile });
      
      expect(screen.getByRole('link', { name: /cycle/i })).toBeInTheDocument();
    });

    it('hides cycle link for male users', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'male' as const,
          dateOfBirth: '1995-01-01',
        },
      };

      render(<BottomNav />, { mockProfile });
      
      expect(screen.queryByRole('link', { name: /cycle/i })).not.toBeInTheDocument();
    });

    it('shows Settings for non-eligible users', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'male' as const,
          dateOfBirth: '1995-01-01',
        },
      };

      render(<BottomNav />, { mockProfile });
      
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });

    it('replaces Settings with Cycle for eligible users', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'female' as const,
          dateOfBirth: '1995-01-01',
        },
      };

      render(<BottomNav />, { mockProfile });
      
      expect(screen.getByRole('link', { name: /cycle/i })).toBeInTheDocument();
      // Settings should not be in bottom nav for eligible users (space constraint)
      expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('marks Home as active when on dashboard', () => {
      render(<BottomNav />, { initialRoute: '/dashboard' });
      
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink.className).toContain('active');
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    it('marks History as active when on history page', () => {
      render(<BottomNav />, { initialRoute: '/history' });
      
      const historyLink = screen.getByRole('link', { name: /history/i });
      expect(historyLink.className).toContain('active');
      expect(historyLink).toHaveAttribute('aria-current', 'page');
    });

    it('marks History as active on sub-pages', () => {
      render(<BottomNav />, { initialRoute: '/history/some-session' });
      
      const historyLink = screen.getByRole('link', { name: /history/i });
      expect(historyLink.className).toContain('active');
    });

    it('marks Cycle as active when on cycle tracker page', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'female' as const,
          dateOfBirth: '1995-01-01',
        },
      };

      render(<BottomNav />, { mockProfile, initialRoute: '/cycle' });
      
      const cycleLink = screen.getByRole('link', { name: /cycle/i });
      expect(cycleLink.className).toContain('active');
      expect(cycleLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Icons', () => {
    it('renders icons for all navigation items', () => {
      render(<BottomNav />);
      
      const navItems = screen.getAllByRole('link');
      navItems.forEach(item => {
        // Each nav item should have an icon (aria-hidden span)
        const icon = item.querySelector('[aria-hidden="true"]');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Translations', () => {
    it('displays navigation in English by default', () => {
      render(<BottomNav />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('displays navigation in Portuguese', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        preferences: { language: 'pt' },
      };

      render(<BottomNav />, { mockUser: mockUser as any });
      
      expect(screen.getByText('Início')).toBeInTheDocument();
      expect(screen.getByText('Histórico')).toBeInTheDocument();
      expect(screen.getByText('Mensagens')).toBeInTheDocument();
      expect(screen.getByText('Perfil')).toBeInTheDocument();
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('links to correct routes', () => {
      render(<BottomNav />);
      
      expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute('href', '/history');
      expect(screen.getByRole('link', { name: /messages/i })).toHaveAttribute('href', '/messages');
      expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile');
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/settings');
    });

    it('cycle link points to /cycle route', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'female' as const,
          dateOfBirth: '1995-01-01',
        },
      };

      render(<BottomNav />, { mockProfile });
      
      expect(screen.getByRole('link', { name: /cycle/i })).toHaveAttribute('href', '/cycle');
    });
  });

  describe('Accessibility', () => {
    it('uses aria-current for active page', () => {
      render(<BottomNav />, { initialRoute: '/dashboard' });
      
      const activeLink = screen.getByRole('link', { name: /home/i });
      expect(activeLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not use aria-current for inactive pages', () => {
      render(<BottomNav />, { initialRoute: '/dashboard' });
      
      const historyLink = screen.getByRole('link', { name: /history/i });
      expect(historyLink).not.toHaveAttribute('aria-current');
    });
  });
});

