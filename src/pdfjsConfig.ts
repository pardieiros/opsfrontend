import { pdfjs } from 'react-pdf';

// Configuração robusta do PDF.js para diferentes ambientes
const configurePdfJs = () => {
  try {
    // Tentar usar o worker do Vite primeiro
    import('pdfjs-dist/build/pdf.worker.min.mjs?url').then(module => {
      pdfjs.GlobalWorkerOptions.workerSrc = module.default;
    }).catch(() => {
      // Fallback para CDN se o worker local falhar
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    });
  } catch (error) {
    console.warn('PDF.js worker configuration failed, using CDN fallback:', error);
    // Fallback final para CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }
};

// Configurações adicionais para melhor compatibilidade
pdfjs.GlobalWorkerOptions.workerPort = null; // Desabilitar worker port para compatibilidade

// Configurar o worker
configurePdfJs();

export default pdfjs;