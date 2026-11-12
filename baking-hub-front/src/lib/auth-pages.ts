import type { AstroCookies } from 'astro';
import { guardarSesion, rutaSegura } from './auth';
import { graphql, ApiError } from './graphql';
import { LOGIN, REGISTRAR } from './queries';
import { localizedPath, type AppLocale } from './i18n';

type LoginInput = {
  request: Request;
  cookies: AstroCookies;
  usuario: unknown;
  locale: AppLocale;
  turnstileSiteKey?: string;
};

type AuthPageResult<T> = T | { redirect: string; status: 302 | 303 };

export async function processLogin({
  request,
  cookies,
  usuario,
  locale,
  turnstileSiteKey,
}: LoginInput): Promise<AuthPageResult<{ error: string | null; email: string; next: string }>> {
  const url = new URL(request.url);
  const next = rutaSegura(url.searchParams.get('next'));
  if (usuario) return { redirect: localizedPath(locale, next), status: 302 };

  let error: string | null = null;
  let email = '';

  if (request.method === 'POST') {
    const data = await request.formData();
    email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const turnstileEnabled = Boolean(turnstileSiteKey);
    const turnstileToken = String(data.get('cf-turnstile-response') ?? '').trim();

    if (turnstileEnabled && !turnstileToken) {
      error = locale === 'en'
        ? 'Complete the security check before signing in.'
        : 'Completa la verificación de seguridad antes de iniciar sesión.';
    } else {
      try {
        const { login } = await graphql<{ login: { token: string } }>(LOGIN, {
          email,
          password,
          turnstileToken: turnstileEnabled ? turnstileToken : null,
        });
        guardarSesion(cookies, login.token);
        return { redirect: localizedPath(locale, next), status: 303 };
      } catch (cause) {
        const isUserError = cause instanceof ApiError && ['UNAUTHENTICATED', 'BAD_USER_INPUT'].includes(cause.codigo);
        error = isUserError
          ? cause.message
          : locale === 'en'
            ? 'We could not sign you in. Please try again in a moment.'
            : 'No pudimos iniciar sesión. Inténtalo de nuevo en un momento.';
      }
    }
  }

  return { error, email, next };
}

type RegistrationInput = {
  request: Request;
  usuario: unknown;
  locale: AppLocale;
  turnstileSiteKey?: string;
};

export async function processRegistration({
  request,
  usuario,
  locale,
  turnstileSiteKey,
}: RegistrationInput): Promise<
  AuthPageResult<{
    error: string | null;
    mensaje: string | null;
    nombre: string;
    email: string;
    next: string;
    registroExitoso: boolean;
  }>
> {
  const url = new URL(request.url);
  const next = rutaSegura(url.searchParams.get('next'));
  if (usuario) return { redirect: localizedPath(locale, next), status: 302 };

  let error: string | null = null;
  let mensaje: string | null = null;
  let nombre = '';
  let email = (url.searchParams.get('email') ?? '').trim();
  let registroExitoso = false;

  if (request.method === 'POST') {
    const data = await request.formData();
    email = String(data.get('email') ?? '').trim();
    nombre = String(data.get('nombre') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const confirmar = String(data.get('confirmar') ?? '');
    const turnstileEnabled = Boolean(turnstileSiteKey);
    const turnstileToken = String(data.get('cf-turnstile-response') ?? '').trim();

    if (turnstileEnabled && !turnstileToken) {
      error = locale === 'en'
        ? 'Complete the security check before creating an account.'
        : 'Completa la verificación de seguridad antes de crear la cuenta.';
    } else if (password !== confirmar) {
      error = locale === 'en' ? 'The passwords do not match.' : 'Las contraseñas no coinciden.';
    } else {
      try {
        await graphql<{ registrar: { mensaje: string } }>(REGISTRAR, {
          nombre,
          email,
          password,
          turnstileToken: turnstileEnabled ? turnstileToken : null,
        });
        registroExitoso = true;
        mensaje = locale === 'en' ? 'Account created. You can now sign in.' : 'Cuenta creada. Ya puedes iniciar sesión.';
      } catch (cause) {
        error =
          cause instanceof ApiError && cause.codigo === 'BAD_USER_INPUT'
            ? cause.message
            : locale === 'en'
              ? 'We could not create your account. Please try again in a moment.'
              : 'No pudimos crear tu cuenta. Inténtalo de nuevo en un momento.';
      }
    }
  }

  return { error, mensaje, nombre, email, next, registroExitoso };
}
