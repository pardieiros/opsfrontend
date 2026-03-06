import React, { useState, useEffect } from 'react';
import { uploadSerigrafiaArte } from '../../serviceapi/api';
import Button from '../../components/ui/button/Button';

export default function AnexarArte({ op, onAddToCart, initialExisting = false, initialFileUrl = null, loteId = null }) {
  const [file, setFile] = useState(null);
  const [existing, setExisting] = useState(initialExisting);
  const [fileUrl, setFileUrl] = useState(initialFileUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    setExisting(initialExisting);
    setFileUrl(initialFileUrl);
  }, [initialExisting, initialFileUrl]);

  const handleFileChange = e => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setFileName(selected ? selected.name : '');
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      await uploadSerigrafiaArte(op.id, file);
      setSuccess(true);
      setExisting(true);
      setFileUrl(null); // Optionally, could refetch arte URL here if needed
    } catch {
      setError('Falha ao anexar arte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white p-4 rounded shadow mb-4 max-h-[80vh] overflow-y-auto">
      <h3 className="text-xl font-semibold mb-2">Anexar Arte - OP #{op.id}</h3>
      {fileUrl && (
        <p className="mb-2 text-sm">
          Arte existente: <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Visualizar</a>
        </p>
      )}
      <label className="mb-2 inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded cursor-pointer hover:bg-gray-300">
        Escolher Arte
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {fileName && (
        <p className="mb-2 text-sm text-gray-700">Arquivo: {fileName}</p>
      )}
      {loading && (
        <progress className="w-full mb-2" />
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">Arte enviada com sucesso!</p>}
      <Button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="mt-auto w-full"
      >
        {loading ? 'Enviando...' : existing ? 'Atualizar Arte' : 'Adicionar Arte'}
      </Button>
      <Button
        onClick={() => onAddToCart(op)}
        disabled={!existing || loteId === null}
        className="mt-2 w-full"
        variant="outline"
      >
        Adicionar ao Carrinho
      </Button>
    </div>
  );
}
