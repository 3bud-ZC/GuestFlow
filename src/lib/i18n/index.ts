import { en } from './dictionaries/en';
import { ar } from './dictionaries/ar';
import { Locale } from './types';

const dictionaries = {
  en,
  ar,
};

export const getDictionary = (locale: Locale) => dictionaries[locale] ?? dictionaries.en;
