import React, { useState, useEffect } from 'react';
import { getClientEmails, createClientEmail } from '../../serviceapi/api';
import { sendApprovalEmail } from '../../serviceapi/api';

// Define the shape of a client email entry
type ClientEmail = {
  id: number;
  email: string;
};

export default function SendEmailMaquete({ clientId, ordemId, onSent }) {
  const [clientEmailList, setClientEmailList] = useState<ClientEmail[]>([]);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);

  // Fetch client emails on mount
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('accessToken') || '';
      try {
        const emails = await getClientEmails(token, clientId);
        setClientEmailList(emails);
      } catch (err) {
        console.error('Erro ao buscar emails do cliente:', err);
      }
    })();
  }, [clientId]);

  const handleSendApproval = async () => {
    const token = localStorage.getItem('accessToken') || '';
    // If new email, offer to associate
    if (recipientEmail && !clientEmailList.some(e => e.email === recipientEmail)) {
      const confirmAdd = window.confirm(`Deseja associar ${recipientEmail} ao cliente?`);
      if (confirmAdd) {
        const fd = new FormData();
        fd.append('client', String(clientId));
        fd.append('email', recipientEmail);
        try {
          await createClientEmail(fd, token);
          setClientEmailList(prev => [...prev, { id: Date.now(), email: recipientEmail }]);
        } catch (err) {
          console.error('Erro ao associar email:', err);
          alert('Não foi possível associar o email.');
          return;
        }
      }
    }
    // Call approval email endpoint
    try {
      await sendApprovalEmail(
        { ordem: ordemId, email_destino: recipientEmail },
        token
      );
      alert('Email de aprovação enviado!');
      if (onSent) onSent();
    } catch (err) {
      console.error('Erro ao enviar aprovação:', err);
      alert('Falha ao enviar email de aprovação.');
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-2">Enviar Email de Aprovação</h3>
      <div>
        <label className="block mb-1">Para:</label>
        <div className="flex items-center space-x-2">
          <input
            type="email"
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            Emails do Cliente
          </button>
        </div>
      </div>
      {emailModalOpen && (
        <div className="mt-2 border rounded max-h-40 overflow-auto p-2">
          {clientEmailList.map(e => (
            <div
              key={e.id}
              className="p-1 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setRecipientEmail(e.email);
                setEmailModalOpen(false);
              }}
            >
              {e.email}
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSendApproval}
          disabled={!recipientEmail}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar para Aprovação
        </button>
      </div>
    </div>
  );
}
