import { create } from 'zustand';

export type AppLocale = 'en' | 'zh-CN';

type LanguageState = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  hydrate: () => void;
};

const STORAGE_KEY = 'rag-hub-locale';
const DEFAULT_LOCALE: AppLocale = 'en';

function loadStoredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === 'zh-CN' || raw === 'en' ? raw : DEFAULT_LOCALE;
}

function persist(locale: AppLocale) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, locale);
}

const initialLocale = loadStoredLocale();

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: initialLocale,
  setLocale: (locale) => {
    persist(locale);
    set({ locale });
  },
  hydrate: () => set({ locale: loadStoredLocale() }),
}));
