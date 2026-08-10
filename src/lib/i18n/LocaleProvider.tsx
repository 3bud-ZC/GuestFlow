'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Locale, Dictionary } from './types';
import { getDictionary } from './index';

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [t, setT] = useState<Dictionary>(getDictionary(initialLocale));

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setT(getDictionary(newLocale));
    document.cookie = `gf-locale=${newLocale}; path=/; max-age=31536000`;
    // We need to reload to apply server-side changes like layout direction
    window.location.reload();
  };

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

export function useTranslation() {
  const { t } = useLocale();
  return t;
}
