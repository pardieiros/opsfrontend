import React, { useState, useRef, useEffect } from "react";
import { sendCliche, getMyEmailProfissional } from "../../serviceapi/api";

export default function Enviarcliche({ flexId, opId }) {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para email profissional
  const [emailProfissional, setEmailProfissional] = useState(null);
  const [loadingEmailProf, setLoadingEmailProf] = useState(true);
  const [emailProfError, setEmailProfError] = useState(null);

  // Buscar email profissional do usuário atual
  useEffect(() => {
    const fetchEmailProfissional = async () => {
      try {
        setLoadingEmailProf(true);
        setEmailProfError(null);
        
        const emailProf = await getMyEmailProfissional();
        setEmailProfissional(emailProf);
        
        if (!emailProf) {
          setEmailProfError('Email profissional não configurado');
        }
      } catch (err) {
        console.error('Erro ao buscar email profissional:', err);
        setEmailProfError('Erro ao verificar email profissional');
      } finally {
        setLoadingEmailProf(false);
      }
    };
    
    fetchEmailProfissional();
  }, []);

  const validateEmail = (value) => {
    // Simple email regex validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSend = async () => {
    if (!isValidEmail || !file) return;
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      await sendCliche(flexId, opId, email, file);
      setSuccess("Clichê enviado com sucesso!");
    } catch (err) {
      console.error("Erro ao enviar clichê:", err);
      setError(err.message || "Erro ao enviar clichê");
    } finally {
      setLoading(false);
    }
  };

  // Se está carregando o email profissional
  if (loadingEmailProf) {
    return (
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Enviar Clichê</h2>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Verificando email profissional...</span>
        </div>
      </div>
    );
  }

  // Se não tem email profissional configurado
  if (emailProfError || !emailProfissional) {
    return (
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Enviar Clichê</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Email Profissional Não Configurado
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Para enviar clichês, é necessário ter um email profissional configurado. 
                Contacte o administrador para configurar seu email profissional.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Enviar Clichê</h2>
      
      {/* Informação do email profissional */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-green-700">
            <strong>Email profissional:</strong> {emailProfissional.email}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Anexar ficheiro
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="px-3 py-1 bg-gray-200 rounded text-theme-sm hover:bg-gray-300"
          >
            Escolher ficheiro
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          {file && (
            <p className="mt-2 text-theme-sm text-gray-600">{file.name}</p>
          )}
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Email de destino
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="example@dominio.com"
            className="block w-full border border-gray-300 rounded px-3 py-2 text-theme-sm"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!isValidEmail || !file || loading}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white text-theme-sm hover:bg-indigo-700 disabled:opacity-40"
        >
          Enviar
        </button>
        {error && <p className="mt-2 text-red-600">{error}</p>}
        {success && <p className="mt-2 text-green-600">{success}</p>}
      </div>
    </div>
  );
}