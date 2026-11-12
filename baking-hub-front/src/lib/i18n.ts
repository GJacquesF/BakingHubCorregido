import { getRelativeLocaleUrl } from 'astro:i18n';
import { hasEnglishText, localizedText, type AppLocale } from '../i18n/messages';

export type { AppLocale } from '../i18n/messages';
export { localizedText } from '../i18n/messages';

export function localizedPath(locale: AppLocale, path: string): string {
  const defaultPath = `/${path.replace(/^\/+/, '')}`.replace(/^\/en(?=\/|$)/, '') || '/';
  return getRelativeLocaleUrl(locale, defaultPath === '/' ? '' : defaultPath.slice(1));
}

export function localizedMessage(message: string, locale: AppLocale): string {
  return locale === 'en' && hasEnglishText(message) ? localizedText(locale, message) : message;
}
