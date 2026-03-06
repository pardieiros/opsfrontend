import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/button/Button';

import { fetchSentLotes, fetchLoteDetail, markOpReceived } from '../../serviceapi/api';

// Formata dimensões: remove ".00" quando inteiro
const formatDim = (val?: string): string => {
  if (!val) return '';
  return val.endsWith('.00') ? String(parseInt(val, 10)) : val;
};

export default function Enviados() {
  const [lotes, setLotes] = useState<{ id: number; local_envio: string }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchSentLotes();
        setLotes(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectLote = async (id: number) => {
    setSelectedId(id);
    try {
      const detail = await fetchLoteDetail(id);
      setOps(detail.ops || []);
    } catch (e) {
      console.error(e);
      setOps([]);
    }
  };

  const onReceive = async (opId: number) => {
    try {
      await markOpReceived(opId);
      setOps(prev => prev.filter(o => o.id !== opId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <p className="p-4">Carregando lotes enviados…</p>;

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Coluna de lotes enviados */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Lotes Enviados</h2>
        <ul className="space-y-2">
          {lotes.map(lote => (
            <li
              key={lote.id}
              onClick={() => selectLote(lote.id)}
              className={`p-4 rounded cursor-pointer border ${
                selectedId === lote.id
                  ? 'bg-green-100 border-green-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <p className="font-bold">Lote #{lote.id}</p>
              <p className="text-gray-600">Local: {lote.local_envio}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Coluna de OPs do lote selecionado */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          {selectedId ? `OPs do lote #${selectedId}` : 'Selecione um lote'}
        </h2>
        {selectedId && (
          <ul className="space-y-2">
            {ops.length === 0 && <p className="text-gray-500">Nenhuma OP.</p>}
            {ops.map(op => (
              <li key={op.id} className="relative bg-white p-4 rounded shadow">
                {op.data_expedicao && (
                  <p className="absolute top-2 right-2 text-xs border border-red-500 px-2 rounded text-yellow-400 bg-white">
                    {op.data_expedicao.split('T')[0]}
                  </p>
                )}
                <p className="font-medium mb-1">
                  {op.nome_trabalho ?? `OP #${op.id}`}
                </p>
                <p className="mb-1">Quantidade: {op.quantidade}</p>
                <p className="mb-1 text-sm text-gray-700">
                  {formatDim(op.tamanho_detail?.largura)}x
                  {formatDim(op.tamanho_detail?.fole)}x
                  {formatDim(op.tamanho_detail?.altura)}
                </p>
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
                <button
                  onClick={() => onReceive(op.id)}
                  className="absolute bottom-2 right-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Recebido
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}