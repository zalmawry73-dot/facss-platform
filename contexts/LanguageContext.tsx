'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translations['ar'];
  dir: 'rtl' | 'ltr';
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

export function LanguageProvider({ 
  children, 
  initialLocale = 'ar' 
}: { 
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Check cookie first, then localStorage
    const cookieLocale = getCookie('facss_locale') as Locale | null;
    const localLocale = (typeof localStorage !== 'undefined' ? localStorage.getItem('facss_locale') : null) as Locale | null;
    const resolvedLocale = cookieLocale || localLocale || initialLocale;

    if (resolvedLocale === 'ar' || resolvedLocale === 'en') {
      setLocaleState(resolvedLocale);
      document.documentElement.dir = resolvedLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = resolvedLocale;
      setCookie('facss_locale', resolvedLocale);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('facss_locale', resolvedLocale);
      }
    }
  }, [initialLocale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setCookie('facss_locale', newLocale);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('facss_locale', newLocale);
    }
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };

  const toggleLocale = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = translations[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir, toggleLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
