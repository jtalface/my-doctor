import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth';
import * as api from '../services/api';
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type LanguageCode,
} from '../config/languages';

const STORAGE_KEY = 'doctor-ui-language';

function readStoredLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeLanguage(raw || undefined);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { doctor, isAuthenticated, refreshDoctor } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language === 'pt' ? 'pt' : 'en';
  }, [language]);

  useEffect(() => {
    if (!doctor?.preferences?.language) return;
    const fromServer = normalizeLanguage(doctor.preferences.language);
    setLanguageState(fromServer);
    try {
      localStorage.setItem(STORAGE_KEY, fromServer);
    } catch {
      /* ignore */
    }
  }, [doctor?.id, doctor?.preferences?.language]);

  const setLanguage = useCallback(
    async (lang: LanguageCode) => {
      const next = normalizeLanguage(lang);
      setLanguageState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }

      if (!isAuthenticated || !doctor) return;

      try {
        await api.updateProfile({
          preferences: {
            notifications: doctor.preferences?.notifications ?? true,
            emailAlerts: doctor.preferences?.emailAlerts ?? true,
            language: next,
          },
        });
        await refreshDoctor();
      } catch (e) {
        console.error('[Language] Failed to sync preference to server', e);
      }
    },
    [isAuthenticated, doctor, refreshDoctor],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
