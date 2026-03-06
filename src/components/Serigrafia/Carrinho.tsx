import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/button/Button';
import {
  fetchOpenLotes,
  createLoteEnvio,
  deleteOpenLotes,
  fetchLoteDetail,
  removeOpFromLote
} from '../../serviceapi/api';
import { sendLote } from '../../serviceapi/api';

// Formata dimensões: remove ".00" quando inteiro
const formatDim = (val?: string): string => {
  if (!val) return '';
  return val.endsWith('.00') ? String(parseInt(val, 10)) : val;
};

interface Lote {
  id: number;
  local_envio: string;
}

interface CarrinhoProps {
  onCreateLote?: (id: number) => void;
  onSelectLote?: (id: number) => void;
  reloadTrigger?: number;
  onUpdate?: () => void;
}

export default function Carrinho({ onCreateLote, onSelectLote, reloadTrigger, onUpdate }: CarrinhoProps) {
  const [localEnvio, setLocalEnvio] = useState('');
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [creating, setCreating] = useState(false);
  const [selectedLoteId, setSelectedLoteId] = useState<number | null>(null);
  const [selectedLoteOps, setSelectedLoteOps] = useState<any[]>([]);
  const [emailDest, setEmailDest] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Carrega lotes abertos
  const loadLotes = async () => {
    try {
      const data: Lote[] = await fetchOpenLotes();
      setLotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLotes();
  }, [reloadTrigger]);

  useEffect(() => {
    if (selectedLoteId !== null) {
      handleOpenLote(selectedLoteId);
    }
  }, [reloadTrigger]);

  // Valida email de destinatário
  useEffect(() => {
    const re = /\S+@\S+\.\S+/;
    setEmailValid(re.test(emailDest));
  }, [emailDest]);

  // Cria um novo lote
  const handleCreateLote = async () => {
    if (!localEnvio.trim()) return;  // não cria sem local
    setCreating(true);
    try {
      const novo = await createLoteEnvio(localEnvio);
      setLotes(prev => [...prev, { id: novo.id, local_envio: localEnvio }]);
      onCreateLote?.(novo.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Exclui um lote aberto
  const handleDelete = async (id: number) => {
    const ok = window.confirm('Deseja realmente eliminar esse lote?');
    if (!ok) return;
    try {
      await deleteOpenLotes([id]);
      setLotes(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Abre um lote e carrega suas OPs
  const handleOpenLote = async (loteId: number) => {
    setSelectedLoteId(loteId);
    onSelectLote?.(loteId);
    try {
      const detail = await fetchLoteDetail(loteId);
      setSelectedLoteOps(detail.ops || []);
    } catch (err) {
      console.error(err);
      setSelectedLoteOps([]);
    }
  };

  // Remove OP de um lote aberto
  const handleRemoveOp = async (opId: number) => {
    if (selectedLoteId === null) return;
    try {
      await removeOpFromLote(selectedLoteId, opId);
      setSelectedLoteOps(prev => prev.filter(op => op.id !== opId));
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
  };

  // Envia o lote por email
  const handleEnviarLote = async () => {
    if (selectedLoteId === null || !emailValid) return;
    setSendingEmail(true);
    setEmailError(null);
    try {
      // @ts-ignore
      await sendLote(selectedLoteId, emailDest, '');
      setEmailSuccess(true);
    } catch (err) {
      console.error(err);
      setEmailError('Falha ao enviar o lote.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="col-span-1 pl-4">
      {selectedLoteId === null ? (
        <>
          {/* Input de Local e Botão Criar Lote */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local de envio
            </label>
            <input
              type="text"
              value={localEnvio}
              onChange={e => setLocalEnvio(e.target.value)}
              placeholder="Digite o local de envio"
              className="w-full border border-gray-300 p-2 rounded mb-2"
            />
            <Button onClick={handleCreateLote} disabled={creating || !localEnvio.trim()} className="w-full mb-4">
              {creating ? 'Criando...' : 'Criar Lote'}
            </Button>
          </div>

          {/* Lista de lotes abertos */}
          <h2 className="text-2xl font-semibold mb-4">
            Sacos para envio <span className="text-sm text-gray-500">({lotes.length})</span>
          </h2>
          {lotes.length === 0 ? (
            <p className="text-gray-500">Nenhum lote aberto.</p>
          ) : (
            <ul className="space-y-4">
              {lotes.map(lote => (
                <li
                  key={lote.id}
                  onClick={() => handleOpenLote(lote.id)}
                  className={`bg-white p-4 rounded shadow relative cursor-pointer ${
                    selectedLoteId === lote.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <p className="font-bold mb-1">Lote #{lote.id}</p>
                  <p className="text-gray-600 mb-2">Local: {lote.local_envio}</p>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(lote.id);
                    }}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          {/* Cabeçalho do lote selecionado com botão de voltar */}
          <div className="flex items-center mb-4">
            <button
              onClick={() => {
                setSelectedLoteId(null);
                setSelectedLoteOps([]);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold ml-2">
              Lote para {localEnvio}
            </h2>
          </div>

          {/* OPs dentro do lote */}
          {selectedLoteOps.length === 0 ? (
            <p className="text-gray-500">Nenhuma OP neste lote.</p>
          ) : (
            <ul className="space-y-4 mb-4">
              {selectedLoteOps.map(op => (
                <li key={op.id} className="relative bg-white p-4 rounded shadow">
                  {/* Data de expedição no canto superior direito */}
                  {op.data_expedicao && (
                    <p className="absolute top-2 right-2 text-xs border border-red-500 px-2 rounded text-yellow-400 bg-white">
                      {op.data_expedicao.split('T')[0]}
                    </p>
                  )}
                  {/* Nome do trabalho */}
                  <p className="font-medium mb-1">
                    {op.nome_trabalho ?? `OP #${op.id}`}
                  </p>
                  {/* Quantidade */}
                  <p className="mb-1">Quantidade: {op.quantidade}</p>
                  {/* Dimensões */}
                  <p className="mb-1 text-sm text-gray-700">
                    {formatDim(op.tamanho_detail?.largura)}x
                    {formatDim(op.tamanho_detail?.fole)}x
                    {formatDim(op.tamanho_detail?.altura)}
                  </p>
                  {/* Cor e gramagem */}
                  {op.tamanho_detail?.gramagens && op.cor_gramagem_cor && (
                    <p className="mb-3 text-sm text-gray-700">
                      {(() => {
                        const gram = op.tamanho_detail!.gramagens.find(
                          g => g.cor === Number(op.cor_gramagem_cor)
                        );
                        if (!gram) return '';
                        const gVal = gram.gramagem.endsWith('.00')
                          ? String(parseInt(gram.gramagem, 10))
                          : gram.gramagem;
                        return `${gram.cor_nome} ${gVal}Gr`;
                      })()}
                    </p>
                  )}
                  {/* Botão Remover no canto inferior direito */}
                  <button
                    onClick={() => handleRemoveOp(op.id)}
                    className="absolute bottom-2 right-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* Campo de email e botão enviar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enviar para
            </label>
            <input
              type="email"
              value={emailDest}
              onChange={e => setEmailDest(e.target.value)}
              placeholder="email@dominio.com"
              className="w-full border border-gray-300 p-2 rounded mb-2"
            />
            {!emailValid && emailDest && (
              <p className="text-red-600 text-sm mb-2">Email inválido</p>
            )}
            <Button
              onClick={handleEnviarLote}
              disabled={!emailValid || sendingEmail}
              className="w-full"
            >
              {sendingEmail ? 'Enviando...' : 'Enviar Lote'}
            </Button>
            {emailError && <p className="mt-2 text-red-600">{emailError}</p>}
            {emailSuccess && <p className="mt-2 text-green-600">Lote enviado!</p>}
          </div>
        </>
      )}
    </div>
  );
}