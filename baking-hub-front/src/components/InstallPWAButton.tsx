import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWAButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstallEvent(null);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;

    try {
      await installEvent.prompt();
      await installEvent.userChoice;
      setError('');
    } catch {
      setError('No se pudo iniciar la instalación. Intenta desde el menú del navegador.');
    } finally {
      setInstallEvent(null);
    }
  };

  if (!installEvent && !error) return null;

  return (
    <span>
      {installEvent && (
        <button className="pwa-install" type="button" onClick={() => void install()}>
          Instalar Baking Hub
        </button>
      )}
      {error && <span role="alert">{error}</span>}
    </span>
  );
}
