import React, { useState, useEffect } from 'react';
import {
  fetchOrdensProducao,
  fetchHasArte,
  addOpToLote,
  removeOpFromLote,
  sendLote
} from '../../serviceapi/api';
import CardOP from '../../components/Ops/Card';
import AnexarArte from '../../components/Serigrafia/Anexararte';
import Button from '../../components/ui/button/Button';
import Carrinho from '../../components/Serigrafia/Carrinho';

interface OrdemProducao {
  id: number;
  cliente_nome2: string;
  quantidade: number;
  nome_trabalho?: string | null;
  status?: string;
  data_expedicao?: string | null;
}

const SERIGRAFIA_TYPE_ID = 5;

export default function Seribase() {
  const [loteId, setLoteId] = useState<number | null>(null);
  const [ops, setOps] = useState<OrdemProducao[]>([]);
  const [cart, setCart] = useState<OrdemProducao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedOp, setSelectedOp] = useState<OrdemProducao | null>(null);
  const [hasArte, setHasArte] = useState(false);
  const [arteUrl, setArteUrl] = useState<string | null>(null);
  // Reload trigger for Carrinho
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'Maquete Aprovada' | 'Em espera para impressão'>('Maquete Aprovada');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchOrdensProducao({ tipo_impressao: SERIGRAFIA_TYPE_ID, status: statusFilter });
        // Normalize response: array or paginated object
        const list = Array.isArray(res) ? res : (res as any).results;
        setOps(list);
      } catch {
        setError('Não foi possível carregar OPs de serigrafia.');
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadTrigger, statusFilter]);

  const addToCart = async (op: OrdemProducao) => {
    if (loteId === null) {
      console.warn('Nenhum lote aberto. Crie um lote antes de adicionar OPs.');
      return;
    }
    try {
      console.log(`[DEBUG] Adding OP ${op.id} to lote ${loteId}`);
      await addOpToLote(loteId, op.id);
      setCart(prev => (prev.some(item => item.id === op.id) ? prev : [...prev, op]));
      setReloadTrigger(prev => prev + 1);
    } catch (err) {
      console.error('[ERROR] addToCart failed:', err);
    }
  };

  const removeFromCart = async (opId: number) => {
    if (loteId === null) return;
    try {
      await removeOpFromLote(loteId, opId);
      setCart(prev => prev.filter(item => item.id !== opId));
      setReloadTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  

  const handleSelect = async (op: OrdemProducao) => {
    setSelectedOp(op);
    try {
      const res = await fetchHasArte(op.id);
      setHasArte(res.has_arte);
      setArteUrl(res.file_url || null);
    } catch {
      setHasArte(false);
      setArteUrl(null);
    }
  };

  if (loading) return <p>Carregando OPs de serigrafia...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
      {/* Lista de OPs disponíveis */}
      <div className="col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">OPs Disponíveis</h2>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'Maquete Aprovada' | 'Em espera para impressão')}
            className="border border-gray-300 rounded p-2"
          >
            <option value="Maquete Aprovada">Maquete Aprovada</option>
            <option value="Em espera para impressão">Em espera para impressão</option>
          </select>
        </div>
        <div className="space-y-4">
          {ops.filter(op => op.status === statusFilter).map(op => (
            <div key={op.id} onClick={() => handleSelect(op)}>
              <CardOP op={op} highlighted={selectedOp?.id === op.id} />
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-1 border-l border-r px-4">
        {selectedOp ? (
          <AnexarArte
            op={selectedOp}
            onAddToCart={addToCart}
            initialExisting={hasArte}
            initialFileUrl={arteUrl as any}
            loteId={loteId as any}
          />
        ) : (
          <p className="text-gray-500">Selecione uma OP para anexar arte.</p>
        )}
      </div>

      <Carrinho
        onCreateLote={setLoteId}
        onSelectLote={setLoteId}
        reloadTrigger={reloadTrigger}
        onUpdate={() => setReloadTrigger(prev => prev + 1)}
      />
    </div>
  );
}