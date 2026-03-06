// Script para limpar cache do Service Worker
// Execute este script no console do navegador quando tiver problemas

async function clearServiceWorkerCache() {
  console.log('Limpando cache do Service Worker...');
  
  // Limpar todos os caches
  const cacheNames = await caches.keys();
  for (const cacheName of cacheNames) {
    console.log('Removendo cache:', cacheName);
    await caches.delete(cacheName);
  }
  
  // Desregistrar service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      console.log('Desregistrando service worker');
      await registration.unregister();
    }
  }
  
  console.log('Cache limpo! Recarregue a página.');
  window.location.reload();
}

// Função para verificar status do service worker
function checkServiceWorkerStatus() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('Service Workers registados:', registrations.length);
      registrations.forEach((registration, index) => {
        console.log(`SW ${index}:`, {
          active: registration.active,
          installing: registration.installing,
          waiting: registration.waiting,
          scope: registration.scope
        });
      });
    });
  } else {
    console.log('Service Worker não suportado');
  }
}

// Expor funções globalmente
window.clearServiceWorkerCache = clearServiceWorkerCache;
window.checkServiceWorkerStatus = checkServiceWorkerStatus;

console.log('Script de limpeza de cache carregado!');
console.log('Use clearServiceWorkerCache() para limpar o cache');
console.log('Use checkServiceWorkerStatus() para verificar o status'); 