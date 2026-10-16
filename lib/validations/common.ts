export type ValidationLocale = 'ar' | 'en';

/**
 * Resolves the active validation locale based on explicit parameter,
 * request body metadata, or fallback to Arabic ('ar').
 */
export function resolveLocale(locale?: string, body?: any): ValidationLocale {
  if (locale === 'en' || locale === 'ar') return locale;
  if (body && typeof body === 'object') {
    if (body.locale === 'en' || body.locale === 'ar') return body.locale;
    if (body._locale === 'en' || body._locale === 'ar') return body._locale;
  }
  return 'ar';
}

/**
 * Bilingual validation message helper.
 * Returns English text if resolved locale is 'en', otherwise Arabic text.
 */
export function vMsg(ar: string, en: string, locale?: string, body?: any): string {
  const loc = resolveLocale(locale, body);
  return loc === 'en' ? en : ar;
}

/**
 * Extracts request locale from Request headers (cookies, accept-language)
 * or request body. Safe for Server Components, Route Handlers, and CLI tests.
 */
export function getRequestLocale(request?: Request, body?: any): ValidationLocale {
  if (body && typeof body === 'object') {
    if (body.locale === 'en' || body.locale === 'ar') return body.locale;
    if (body._locale === 'en' || body._locale === 'ar') return body._locale;
  }

  if (request) {
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      if (cookieHeader.includes('facss_locale=en')) return 'en';
      if (cookieHeader.includes('facss_locale=ar')) return 'ar';

      const acceptLang = request.headers.get('accept-language') || '';
      if (acceptLang.toLowerCase().startsWith('en')) return 'en';
    } catch {
      // Ignore header parsing errors
    }
  }

  return 'ar';
}
