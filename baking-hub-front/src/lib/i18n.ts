import { getRelativeLocaleUrl } from 'astro:i18n';

export type AppLocale = 'es' | 'en';

export function localizedPath(locale: AppLocale, path: string): string {
  const defaultPath = `/${path.replace(/^\/+/, '')}`.replace(/^\/en(?=\/|$)/, '') || '/';
  return getRelativeLocaleUrl(locale, defaultPath === '/' ? '' : defaultPath.slice(1));
}

const englishMessages: Record<string, string> = {
  'No se pudo conectar con el servidor': 'Could not connect to the server.',
  'Error inesperado': 'Unexpected error.',
  'Ocurrió un error inesperado. Inténtalo de nuevo.': 'An unexpected error occurred. Please try again.',
};

export function localizedMessage(message: string, locale: AppLocale): string {
  return locale === 'en' ? englishMessages[message] ?? message : message;
}
