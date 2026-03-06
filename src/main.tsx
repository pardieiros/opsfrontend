import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App";
import { AppWrapper } from "./components/common/PageMeta";
import { ThemeProvider } from "./context/ThemeContext";

import { ScrollToTop } from './components/common/ScrollToTop';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Configurações para melhor compatibilidade mobile
if (typeof window !== 'undefined') {
  // Prevenir zoom em inputs no iOS
  const preventZoom = () => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  };

  // Aplicar configurações quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preventZoom);
  } else {
    preventZoom();
  }

  // Configurações específicas para Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    // Adicionar classe específica para Safari
    document.documentElement.classList.add('safari');
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppWrapper>
          <ToastContainer 
            position="top-right" 
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <ScrollToTop />
          <App />
        </AppWrapper>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

// Regista o Service Worker para tornar a app instalável como PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', {
      updateViaCache: 'none' // Força verificação de atualizações
    })
      .then(registration => {
        console.log('Service Worker registado com sucesso:', registration);
        
        // Verificar se há uma nova versão do service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível - notificar o usuário
                console.log('Nova versão disponível!');
                
                // Opcional: mostrar notificação para o usuário
                if (confirm('Uma nova versão está disponível. Deseja atualizar agora?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
        
        // Lidar com mudanças no service worker
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker atualizado');
          // Recarregar a página para usar a nova versão
          window.location.reload();
        });
      })
      .catch(error => {
        console.error('Falha ao registar o Service Worker:', error);
      });
  });
}
