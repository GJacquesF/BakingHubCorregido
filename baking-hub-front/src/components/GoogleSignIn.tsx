import { useEffect, useRef, useState } from 'react';
import { messages } from '../i18n/messages';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback(response: GoogleCredentialResponse): void;
      }): void;
      renderButton(
        element: HTMLElement,
        options: { theme: string; size: string; text: string; width: number },
      ): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

function cargarGoogleIdentity(): Promise<void> {
  if (window.google) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    const script = existente ?? document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el servicio de Google.'));
    if (!existente) document.head.append(script);
  });
}

interface Props {
  clientId?: string;
  next: string;
  locale: 'es' | 'en';
}

export default function GoogleSignIn({ clientId, next, locale }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const t = messages[locale].googleSignIn;

  useEffect(() => {
    let activo = true;

    if (!clientId) {
      setError(t.notConfigured);
      return () => {
        activo = false;
      };
    }

    cargarGoogleIdentity()
      .then(() => {
        if (!activo || !buttonRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            if (!credential) {
              setError(t.missingCredential);
              return;
            }

            try {
              const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ idToken: credential }),
              });
              const result = (await response.json()) as { error?: string };
              if (!response.ok) throw new Error(result.error || t.signInFailed);
              window.location.assign(next);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : t.signInFailed);
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 320,
        });
      })
      .catch(() => {
        if (activo) setError(t.loadFailed);
      });

    return () => {
      activo = false;
    };
  }, [clientId, next, t.loadFailed, t.missingCredential, t.notConfigured, t.signInFailed]);

  return (
    <div className="google-login">
      <div ref={buttonRef} />
      {error && <p role="alert" className="google-login-error">{error}</p>}
      <style>{`
        .google-login { display: grid; justify-items: center; gap: .5rem; margin-top: 1rem; }
        .google-login-error { margin: 0; color: #a12622; font-size: .9rem; text-align: center; }
      `}</style>
    </div>
  );
}
