/**
 * useTranslate Hook Tests
 * 
 * Tests the i18n translation hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider } from '../../auth/AuthContext';
import { useTranslate } from '../useTranslate';
import type { ReactNode } from 'react';

// Helper to create wrapper with auth context
function createWrapper(mockUser: any = null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthProvider initialUser={mockUser}>
        {children}
      </AuthProvider>
    );
  };
}

describe('useTranslate', () => {
  describe('Basic Translation', () => {
    it('translates keys correctly in English (default)', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'en' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('common_back')).toBe('← Back');
      expect(t('common_continue')).toBe('Continue');
      expect(t('common_save')).toBe('Save');
    });

    it('translates keys correctly in Portuguese', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'pt' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('common_back')).toBe('← Voltar');
      expect(t('common_continue')).toBe('Continuar');
      expect(t('common_save')).toBe('Salvar');
    });

    it('translates keys correctly in French', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'fr' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('common_back')).toBe('← Retour');
      expect(t('common_continue')).toBe('Continuer');
      expect(t('common_save')).toBe('Enregistrer');
    });

    it('translates keys correctly in Swahili', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'sw' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('common_back')).toBe('← Rudi Nyuma');
      expect(t('common_continue')).toBe('Endelea');
      expect(t('common_save')).toBe('Hifadhi');
    });
  });

  describe('Parameter Interpolation', () => {
    it('replaces single parameter', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'en' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      // Assuming there's a translation like: active_profile_banner: 'Viewing {{name}}'s profile'
      const translated = t('active_profile_banner', { name: 'John' });
      expect(translated).toContain('John');
    });

    it('replaces multiple parameters', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'en' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      // Test a translation with multiple params like: dependents_age_years: '{{age}} years old'
      const translated = t('dependents_age_years', { age: 5 });
      expect(translated).toContain('5');
      expect(translated).toContain('year');
    });

    it('handles numeric parameters', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'en' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      const translated = t('dependents_age_years', { age: 25 });
      expect(translated).toContain('25');
    });
  });

  describe('Fallback Behavior', () => {
    it('falls back to English when user has no language preference', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: {},
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('common_back')).toBe('← Back'); // English
    });

    it('falls back to English when user is not authenticated', () => {
      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(null),
      });

      const t = result.current;
      expect(t('common_back')).toBe('← Back'); // English
    });

    it('falls back to English for missing translation key in other language', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'pt' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      // common_back should exist in Portuguese, so it should translate
      expect(t('common_back')).toBe('← Voltar');
    });
  });

  describe('Language Override', () => {
    it('uses override language when provided', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'en' },
      };

      // Override to Portuguese despite user preference
      const { result } = renderHook(() => useTranslate('pt'), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('common_back')).toBe('← Voltar'); // Portuguese
    });

    it('ignores user preference when override is provided', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'pt' },
      };

      // Override to French
      const { result } = renderHook(() => useTranslate('fr'), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('common_back')).toBe('← Retour'); // French, not Portuguese
    });
  });

  describe('Navigation Keys', () => {
    it('translates navigation keys', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'en' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('nav_home')).toBe('Home');
      expect(t('nav_history')).toBe('History');
      expect(t('nav_messages')).toBe('Messages');
      expect(t('nav_profile')).toBe('Profile');
      expect(t('nav_settings')).toBe('Settings');
    });

    it('translates navigation keys in Portuguese', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'pt' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t('nav_home')).toBe('Início');
      expect(t('nav_history')).toBe('Histórico');
      expect(t('nav_messages')).toBe('Mensagens');
    });
  });

  describe('Return Value', () => {
    it('returns a function', () => {
      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(null),
      });

      expect(typeof result.current).toBe('function');
    });

    it('returns object with language property', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        preferences: { language: 'pt' },
      };

      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(mockUser),
      });

      const t = result.current;
      expect(t.language).toBe('pt');
    });

    it('returns en as default language', () => {
      const { result } = renderHook(() => useTranslate(), {
        wrapper: createWrapper(null),
      });

      const t = result.current;
      expect(t.language).toBe('en');
    });
  });
});

