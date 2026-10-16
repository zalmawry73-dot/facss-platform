'use client';

import React, { createContext, useContext, useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Locale, translations } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translations['ar'];
  dir: 'rtl' | 'ltr';
  toggleLocale: () => void;
  isPending?: boolean;
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Check cookie first, then localStorage
    const cookieLocale = getCookie('facss_locale') as Locale | null;
    const localLocale = (typeof localStorage !== 'undefined' ? localStorage.getItem('facss_locale') : null) as Locale | null;
    const resolvedLocale = cookieLocale || localLocale || initialLocale;

    if (resolvedLocale === 'ar' || resolvedLocale === 'en') {
      if (resolvedLocale !== locale) {
        setLocaleState(resolvedLocale);
      }
      document.documentElement.dir = resolvedLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = resolvedLocale;
      setCookie('facss_locale', resolvedLocale);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('facss_locale', resolvedLocale);
        } catch {}
      }
      // If the client-resolved locale differs from what the server rendered on initial pass,
      // refresh server components seamlessly
      if (resolvedLocale !== initialLocale) {
        startTransition(() => {
          try {
            router.refresh();
          } catch (err) {
            console.error('Failed to sync server components with resolved locale:', err);
          }
        });
      }
    }
  }, [initialLocale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale !== 'ar' && newLocale !== 'en') return;

    // 1. Immediately update client React state
    setLocaleState(newLocale);

    // 2. Synchronously write cookie so any subsequent server requests carry the new locale
    setCookie('facss_locale', newLocale);

    // 3. Write localStorage for client persistence
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('facss_locale', newLocale);
      } catch {}
    }

    // 4. Update DOM html attributes immediately
    if (typeof document !== 'undefined') {
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
    }

    // 5. Trigger Next.js App Router server component re-render with the new cookie
    startTransition(() => {
      try {
        router.refresh();
      } catch (err) {
        console.error('Failed to refresh router on locale switch:', err);
      }
    });
  };

  const toggleLocale = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = translations[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir, toggleLocale, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      locale: 'ar' as Locale,
      setLocale: () => {},
      t: translations['ar'],
      dir: 'rtl' as const,
      toggleLocale: () => {},
      isPending: false,
    };
  }
  return context;
}
