import { pdfjs } from 'react-pdf';

export interface PdfCompatibilityResult {
  isCompatible: boolean;
  issues: string[];
  recommendations: string[];
  browserInfo: {
    userAgent: string;
    isSafari: boolean;
    isChrome: boolean;
    isFirefox: boolean;
    isEdge: boolean;
    version: string;
  };
  pdfJsInfo: {
    version: string;
    workerSrc: string;
    workerLoaded: boolean;
  };
}

export const testPdfCompatibility = async (): Promise<PdfCompatibilityResult> => {
  const result: PdfCompatibilityResult = {
    isCompatible: true,
    issues: [],
    recommendations: [],
    browserInfo: {
      userAgent: navigator.userAgent,
      isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
      isChrome: /chrome/i.test(navigator.userAgent),
      isFirefox: /firefox/i.test(navigator.userAgent),
      isEdge: /edge/i.test(navigator.userAgent),
      version: getBrowserVersion(navigator.userAgent)
    },
    pdfJsInfo: {
      version: pdfjs.version,
      workerSrc: pdfjs.GlobalWorkerOptions.workerSrc || 'not set',
      workerLoaded: false
    }
  };

  // Testar funcionalidades básicas do navegador
  if (!window.fetch) {
    result.issues.push('Fetch API não suportada');
    result.isCompatible = false;
  }

  if (!window.Promise) {
    result.issues.push('Promises não suportadas');
    result.isCompatible = false;
  }

  if (!window.Blob) {
    result.issues.push('Blob API não suportada');
    result.isCompatible = false;
  }

  if (!window.FileReader) {
    result.issues.push('FileReader não suportado');
    result.isCompatible = false;
  }

  // Testar Canvas
  const canvas = document.createElement('canvas');
  if (!canvas.getContext) {
    result.issues.push('Canvas não suportado');
    result.isCompatible = false;
  }

  // Testar Web Workers
  if (!window.Worker) {
    result.issues.push('Web Workers não suportados');
    result.isCompatible = false;
  }

  // Testar PDF.js Worker
  try {
    const workerTest = new Worker(pdfjs.GlobalWorkerOptions.workerSrc);
    workerTest.terminate();
    result.pdfJsInfo.workerLoaded = true;
  } catch (error) {
    result.issues.push('PDF.js Worker não pode ser carregado');
    result.pdfJsInfo.workerLoaded = false;
    result.isCompatible = false;
  }

  // Verificar problemas específicos do Safari
  if (result.browserInfo.isSafari) {
    const safariVersion = parseInt(result.browserInfo.version);
    if (safariVersion < 12) {
      result.issues.push('Safari versão muito antiga (mínimo: 12)');
      result.isCompatible = false;
    }
  }

  // Verificar problemas específicos do Chrome
  if (result.browserInfo.isChrome) {
    const chromeVersion = parseInt(result.browserInfo.version);
    if (chromeVersion < 60) {
      result.issues.push('Chrome versão muito antiga (mínimo: 60)');
      result.isCompatible = false;
    }
  }

  // Gerar recomendações
  if (!result.isCompatible) {
    result.recommendations.push('Atualizar navegador para versão mais recente');
    result.recommendations.push('Usar imagens (JPG, PNG) em vez de PDF');
    result.recommendations.push('Tentar em modo incógnito');
    result.recommendations.push('Desabilitar extensões temporariamente');
  }

  if (result.browserInfo.isSafari) {
    result.recommendations.push('Considerar usar Chrome ou Firefox para melhor compatibilidade');
  }

  if (!result.pdfJsInfo.workerLoaded) {
    result.recommendations.push('Verificar conexão com internet');
    result.recommendations.push('Verificar se firewall está bloqueando CDN');
  }

  return result;
};

const getBrowserVersion = (userAgent: string): string => {
  const matches = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i);
  return matches ? matches[2] : 'unknown';
};

export const logCompatibilityResult = (result: PdfCompatibilityResult) => {
  console.group('🔍 PDF.js Compatibility Test');
  console.log('Browser:', result.browserInfo);
  console.log('PDF.js:', result.pdfJsInfo);
  console.log('Compatible:', result.isCompatible);
  
  if (result.issues.length > 0) {
    console.warn('Issues:', result.issues);
  }
  
  if (result.recommendations.length > 0) {
    console.info('Recommendations:', result.recommendations);
  }
  
  console.groupEnd();
};

export const showCompatibilityAlert = (result: PdfCompatibilityResult) => {
  if (!result.isCompatible) {
    const message = `
PDF.js Compatibility Issues Detected

Issues:
${result.issues.map(issue => `• ${issue}`).join('\n')}

Recommendations:
${result.recommendations.map(rec => `• ${rec}`).join('\n')}

Browser: ${result.browserInfo.userAgent}
PDF.js Version: ${result.pdfJsInfo.version}

Consider using images (JPG, PNG) instead of PDF for better compatibility.
    `;
    
    alert(message);
    return true;
  }
  return false;
}; 