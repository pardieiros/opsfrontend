import React, { useState, useEffect } from "react";
import {
  fetchHasCliche,
  setFlexografiaCliche,
  createClicheFromOp,
} from "../../serviceapi/api";
import ModalCliches from "../ui/modal/Modalcliches";


export default function ClichesCard({ flexId, opId }) {
  const [loading, setLoading] = useState(true);
  const [hasCliche, setHasCliche] = useState(false);
  const [cliche, setCliche] = useState(null);
  const [error, setError] = useState(null);

  // Fetch cliche info when flexId changes
  useEffect(() => {
    if (!flexId) {
      setLoading(false);
      setHasCliche(false);
      return;
    }

    async function loadHasCliche() {
      setLoading(true);
      try {
        const data = await fetchHasCliche(flexId);
        setHasCliche(data.has_cliche);
        if (data.has_cliche) {
          setCliche({ numero_cliche: data.numero_cliche });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadHasCliche();
  }, [flexId]);

  // --- Modal state ---
  const [showModal, setShowModal] = useState(false);

  // Seleciona um clichê existente e associa à Flexografia
  const handleSelectCliche = async (c) => {
    try {
      setLoading(true);
      await setFlexografiaCliche(flexId, c.id);
      const data = await fetchHasCliche(flexId);
      setHasCliche(data.has_cliche);
      if (data.has_cliche) setCliche({ numero_cliche: data.numero_cliche });
    } catch (err) {
      console.error("Erro ao associar clichê:", err);
      setError(err.message);
    } finally {
      setShowModal(false);
      setLoading(false);
    }
  };

  // Cria um clichê manualmente para esta OP
  const handleNewCliche = async () => {
    try {
      setLoading(true);
      // Cria o clichê no backend, que gera e retorna o numero_cliche
      const created = await createClicheFromOp(opId);
      // Atualiza estado direto com o novo clichê
      setHasCliche(true);
      setCliche({ numero_cliche: created.numero_cliche });
    } catch (err) {
      console.error("Erro ao criar clichê manual:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const actionButtons = (
    <div className="mt-4 flex gap-2">
      <button
        onClick={handleNewCliche}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-indigo-600 text-white text-theme-sm hover:bg-indigo-700 disabled:opacity-40"
      >
        Adicionar novo clichê
      </button>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="px-4 py-2 rounded-md border border-indigo-600 text-indigo-600 text-theme-sm hover:bg-indigo-50 disabled:opacity-40"
      >
        Adicionar existente
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center p-4">
        Carregando clichê...
        {actionButtons}
        {showModal && (
          <ModalCliches
            onClose={() => setShowModal(false)}
            onSelect={handleSelectCliche}
          />
        )}
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-600">
        Erro: {error}
        {actionButtons}
        {showModal && (
          <ModalCliches
            onClose={() => setShowModal(false)}
            onSelect={handleSelectCliche}
          />
        )}
      </div>
    );
  }
  if (!hasCliche) {
    return (
      <div className="p-4 text-gray-600">
        Ainda não tem clichê adicionado.
        {actionButtons}
        {showModal && (
          <ModalCliches
            onClose={() => setShowModal(false)}
            onSelect={handleSelectCliche}
          />
        )}
      </div>
    );
  }

  // Render using TailAdmin card styles
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Clichê Associado</h3>
      <div className="space-y-1 text-sm">
        <p><span className="font-medium">Número:</span> {cliche.numero_cliche}</p>
      </div>
      {actionButtons}
      {showModal && (
        <ModalCliches
          onClose={() => setShowModal(false)}
          onSelect={handleSelectCliche}
        />
      )}
    </div>
  );
}
