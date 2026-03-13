import { useMemo } from 'react';
import { messages } from './messages';
import { useLanguageStore } from '../stores/languageStore';
import type { AppLocale } from '../stores/languageStore';

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) {
    return template;
  }
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\{${key}\}`, 'g'), String(value)),
    template,
  );
}

export function resolveMessage(locale: AppLocale, key: string, vars?: Record<string, string | number>) {
  const current = messages[locale][key];
  const isCorrupted =
    typeof current === 'string' &&
    (/^[?]+$/.test(current) || /\?{2,}/.test(current) || current.includes('\ufffd'));
  const resolved = !current || isCorrupted ? messages.en[key] ?? key : current;
  return interpolate(resolved, vars);
}

export function useI18n() {
  const locale = useLanguageStore((state) => state.locale);
  const setLocale = useLanguageStore((state) => state.setLocale);

  return useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string, vars?: Record<string, string | number>) => resolveMessage(locale, key, vars),
    }),
    [locale, setLocale],
  );
}
