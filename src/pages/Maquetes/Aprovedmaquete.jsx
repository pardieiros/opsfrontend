import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMaqueteBlob, approveMaquete, rejectMaquete } from '../../serviceapi/api';

export default function Aprovedmaquete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
//https://plastic.floow.pt
  useEffect(() => {
    (async () => {
      try {
        const url = await fetchMaqueteBlob(id, token);
        setPdfUrl(url);
      } catch (err) {
        setError('Não foi possível carregar a maquete.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleApprove = async () => {
    try {
      await approveMaquete(id, token);
      setSuccessMessage('Mockup approved successfully');
    } catch {
      setError('Failed to approve mockup.');
    }
  };

  const handleReject = async () => {
    try {
      await rejectMaquete(id, reason, token);
      setSuccessMessage('Mockup rejected successfully');
    } catch {
      setError('Failed to reject mockup.');
    }
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Aprovar Maquete OP #{id}</h2>
      {successMessage && (
        <p className="mt-4 text-green-600 font-bold text-3xl text-center">
          {successMessage}
        </p>
      )}
      {pdfUrl && (
        <object data={pdfUrl} type="application/pdf" width="100%" height="900px">
          <p>Seu navegador não suporta PDF embutido. <a href={pdfUrl}>Baixar PDF</a></p>
        </object>
      )}
      <div className="mt-4 space-x-2">
        <button
          onClick={handleApprove}
          disabled={!!successMessage}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Aprovar
        </button>
        <button
          onClick={() => setRejectMode(true)}
          disabled={!!successMessage}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Rejeitar
        </button>
      </div>
      {rejectMode && (
        <div className="mt-4">
          <textarea
            rows={4}
            className="w-full border rounded p-2"
            placeholder="Motivo da rejeição"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <button
            onClick={handleReject}
            className="mt-2 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
          >
            Enviar Rejeição
          </button>
        </div>
      )}
    </div>
  );
}