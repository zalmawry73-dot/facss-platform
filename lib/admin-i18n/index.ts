import { useLanguage } from '@/contexts/LanguageContext';
import { ADMIN_EN } from './dictionary';

// Global cache of current locale for non-hook call sites (e.g. getters, module-scope formatters)
let currentAdminLocale: 'ar' | 'en' = 'ar';

export function setGlobalAdminLocale(loc: 'ar' | 'en') {
  currentAdminLocale = loc;
}

export function getActiveAdminLocale(): 'ar' | 'en' {
  if (typeof window !== 'undefined') {
    const docLang = document.documentElement.lang;
    if (docLang === 'en' || docLang === 'ar') return docLang;
    const cookieMatch = document.cookie.match(/(^|;\s*)facss_locale=([^;]*)/);
    if (cookieMatch) {
      const val = decodeURIComponent(cookieMatch[2]);
      if (val === 'en' || val === 'ar') return val;
    }
    try {
      const local = localStorage.getItem('facss_locale');
      if (local === 'en' || local === 'ar') return local;
    } catch {}
  } else {
    // Server-side SSR: read cookie from next/headers if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { cookies } = require('next/headers');
      const cookieStore = cookies();
      const val = cookieStore.get('facss_locale')?.value;
      if (val === 'en' || val === 'ar') return val;
    } catch {}
  }
  return currentAdminLocale;
}

function translateKey(loc: 'ar' | 'en', key: string): string {
  if (loc !== 'en') return key;
  if (ADMIN_EN[key] !== undefined) return ADMIN_EN[key];

  // 1. Try matching key without trailing asterisk or colon
  const trimmedKey = key.replace(/\s*[*:]\s*$/, '').trim();
  if (ADMIN_EN[trimmedKey] !== undefined) {
    if (/\s*\*\s*$/.test(key)) return `${ADMIN_EN[trimmedKey]} *`;
    return ADMIN_EN[trimmedKey];
  }

  // 2. Try matching with trailing asterisk in dictionary
  if (ADMIN_EN[`${trimmedKey} *`] !== undefined) {
    const val = ADMIN_EN[`${trimmedKey} *`].replace(/\s*\*\s*$/, '').trim();
    if (/\s*\*\s*$/.test(key)) return `${val} *`;
    return val;
  }

  return key;
}

export function tx(key: string, ...args: any[]): string {
  const loc = getActiveAdminLocale();
  let text = translateKey(loc, key);
  if (args.length > 0) {
    args.forEach((arg, i) => {
      text = text.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg ?? ''));
    });
  }
  return text;
}

export function txLocale(arCode: string = 'ar-YE'): string {
  const loc = getActiveAdminLocale();
  if (loc === 'en') return 'en-US';
  return arCode;
}

export function useAdminT() {
  let langLocale: 'ar' | 'en' | undefined;
  try {
    // Attempt to read from React LanguageContext first
    const lang = useLanguage();
    if (lang && (lang.locale === 'ar' || lang.locale === 'en')) {
      langLocale = lang.locale;
    }
  } catch {
    // Fallback if rendered outside of LanguageProvider
  }

  const loc = langLocale || getActiveAdminLocale();
  currentAdminLocale = loc;

  const tHook = (key: string, ...args: any[]): string => {
    let text = translateKey(loc, key);
    if (args.length > 0) {
      args.forEach((arg, i) => {
        text = text.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg ?? ''));
      });
    }
    return text;
  };

  const txLocaleHook = (arCode: string = 'ar-YE'): string => {
    if (loc === 'en') return 'en-US';
    return arCode;
  };

  return {
    tx: tHook,
    txLocale: txLocaleHook,
    locale: loc,
    isAr: loc === 'ar',
    isEn: loc === 'en',
  };
}

export { ADMIN_EN };
