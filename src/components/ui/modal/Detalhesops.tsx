import React, { useState, useEffect, ReactNode } from "react";
import ReactDOM from "react-dom";
import { fetchPdfMockup, triggerMockup as apiTriggerMockup } from "../../../serviceapi/api";
import Spinner from "../loaders/Spinner";
import { BoltIcon, CloseIcon } from "../../../icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, className, children }) => {
  if (!isOpen) return null;
  // Render modal in a portal with backdrop and centered content
  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center bg-gray-200 bg-opacity-50 ${className ?? ""}`}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full z-50 relative">
        {children}
      </div>
    </div>,
    document.body
  );
};

export interface DetalhesOPProps {
  opId: number;
  isOpen: boolean;
  onClose: () => void;
}

const DetalhesOP: React.FC<DetalhesOPProps> = ({ opId, isOpen, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const triggerMockup = async () => {
    setError(false);
    setIsUpdating(true);
    try {
      // Limpa o PDF atual para mostrar loading
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      
      // Executa a task generate_pdf_mockup novamente
      await apiTriggerMockup(opId);
      
      // Polling com retry - tenta buscar o PDF várias vezes
      const token = localStorage.getItem("accessToken") || "";
      const maxAttempts = 10;
      const delayMs = 2000;
      let attempts = 0;
      let url: string | null = null;
      
      while (attempts < maxAttempts && !url) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempts++;
        
        try {
          url = await fetchPdfMockup(opId, token);
        } catch (err) {
          // Se ainda não existe, continua tentando
          if (attempts < maxAttempts) {
            console.log(`Attempt ${attempts}/${maxAttempts}: PDF not ready yet, retrying...`);
            continue;
          }
          // Se esgotou todas as tentativas, lança o erro
          throw err;
        }
      }
      
      if (url) {
        setPdfUrl(url);
      } else {
        throw new Error("PDF não foi gerado após múltiplas tentativas");
      }
    } catch (err) {
      console.error("Error triggering mockup:", err);
      setError(true);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const fetchPdf = async () => {
      setError(false);
      const token = localStorage.getItem("accessToken") || "";
      
      // Tenta buscar o PDF com retry
      const maxAttempts = 5;
      const delayMs = 1000;
      let attempts = 0;
      let url: string | null = null;
      
      while (attempts < maxAttempts && !url) {
        attempts++;
        try {
          url = await fetchPdfMockup(opId, token);
        } catch (err) {
          // Se ainda não existe, continua tentando
          if (attempts < maxAttempts) {
            console.log(`Attempt ${attempts}/${maxAttempts}: PDF not ready yet, retrying...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
          // Se esgotou todas as tentativas, mostra erro
          console.error('Erro ao buscar PDF mockup:', err);
          setError(true);
          return;
        }
      }
      
      if (url) {
        setPdfUrl(url);
      }
    };
    fetchPdf();
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, opId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative">
        {/* Header com ícones */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={triggerMockup}
            disabled={isUpdating}
            className={`p-2 rounded-full transition-colors ${
              isUpdating 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={isUpdating ? "Atualizando..." : "Atualizar mockup"}
          >
            {isUpdating ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <BoltIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Fechar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Erro ao carregar o PDF mockup.</p>
            <button 
              onClick={triggerMockup}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Gerando..." : "Gerar mockup"}
            </button>
          </div>
        ) : pdfUrl ? (
          <div className="w-full">
            <iframe
              src={pdfUrl}
              className="w-full border-0"
              style={{ height: '600px' }}
              title="PDF Mockup"
            >
              <p>PDF não suportado. <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Baixar PDF</a></p>
            </iframe>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DetalhesOP;