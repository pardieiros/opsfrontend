import { useEffect, useState } from 'react';

interface ServiceWorkerUpdateProps {
  onUpdateAvailable?: () => void;
}

export const ServiceWorkerUpdate: React.FC<ServiceWorkerUpdateProps> = ({ 
  onUpdateAvailable 
}) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Verificar se há uma nova versão
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                onUpdateAvailable?.();
              }
            });
          }
        });
      });
    }
  }, [onUpdateAvailable]);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Nova versão disponível</h4>
          <p className="text-xs opacity-90 mt-1">
            Uma nova versão da aplicação está disponível.
          </p>
        </div>
        <div className="ml-4 flex space-x-2">
          <button
            onClick={handleUpdate}
            className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            Atualizar
          </button>
          <button
            onClick={() => setUpdateAvailable(false)}
            className="text-white opacity-70 hover:opacity-100 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}; 