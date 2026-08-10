'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      className="text-sm font-medium hover:text-slate-600 transition-colors"
      aria-label="Toggle language"
    >
      {locale === 'en' ? 'العربية' : 'EN'}
    </button>
  );
}
