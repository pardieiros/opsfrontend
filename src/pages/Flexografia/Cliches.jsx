import React, { useState, useEffect } from "react";
import CardOP from "../../components/Ops/Card";
import { fetchAllOrdensProducao, createFlexografia } from "../../serviceapi/api";
import ClichesCard from "../../components/Flexografia/Clichescard";
import Enviarcliche from "../../components/Flexografia/Enviarcliche";

/**
 * Página de Clichês - Flexografia
 * 
 * Filtros aplicados:
 * - tipo_impressao = 1 (Flexografia)
 * - status !== "Finalizado"
 * 
 * Mostra apenas OPs de Flexografia que ainda não foram finalizadas
 * para permitir gestão de clichês em OPs ativas.
 */

export default function Cliches() {
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOp, setSelectedOp] = useState(null);
  // Atualiza o flexografia_id de selectedOp quando criado
  const handleFlexCreated = (newFlexId) => {
    setSelectedOp(prev => prev ? { ...prev, flexografia_id: newFlexId } : prev);
  };

  useEffect(() => {
    async function load() {
      try {
        // Buscar TODAS as OPs usando fetchAllOrdensProducao para contornar a paginação
        const allOps = await fetchAllOrdensProducao({});
        
        const filtered = allOps.filter(
          op =>
            op.tipo_impressao_detail &&
            op.tipo_impressao_detail.id === 1 &&
            op.status !== "Finalizado"
        );
        
        setOps(filtered);
      } catch (err) {
        console.error("Erro ao carregar OPs de clichês:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="p-4">Carregando OPs de Flexografia (não finalizadas)…</p>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex h-full">
        {/* Coluna de OPs */}
        <div className="w-1/3 border-r border-gray-200 p-4 space-y-4 overflow-y-auto">
          {ops.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 mb-2">Nenhuma OP encontrada</p>
              <p className="text-sm text-gray-400">
                Mostrando apenas OPs de Flexografia que não estão finalizadas
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Filtros ativos:</strong> Flexografia (tipo 1) • Não finalizadas
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {ops.length} OP{ops.length !== 1 ? 's' : ''} encontrada{ops.length !== 1 ? 's' : ''}
                </p>
              </div>
                            {ops.map(op => (
                <div
                  key={op.id}
                  onClick={async () => {
                    console.log("OP clicked:", op);
                    try {
                      const flex = await createFlexografia(op.id);
                      setSelectedOp({ ...op, flexografia_id: flex.id });
                    } catch (err) {
                      console.error("Erro ao obter Flexografia:", err);
                      setSelectedOp(op);
                    }
                  }}
                  className="cursor-pointer rounded overflow-hidden hover:ring-1 hover:ring-gray-300"
                >
                  <CardOP op={op} highlighted={selectedOp?.id === op.id} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Card de Clichê ao lado das OPs */}
        {selectedOp && (
          <div className="w-1/3 border-l border-gray-200 p-4">
            <ClichesCard
              flexId={
                selectedOp.flexId ??
                selectedOp.flexografia_id ??
                selectedOp.flexografia ??
                selectedOp.flexografia_automatica ??
                selectedOp.flexografia_manual
              }
              opId={selectedOp.id}
              onFlexCreated={handleFlexCreated}
            />
            <Enviarcliche
              flexId={
                selectedOp.flexId ??
                selectedOp.flexografia_id ??
                selectedOp.flexografia ??
                selectedOp.flexografia_automatica ??
                selectedOp.flexografia_manual
              }
              opId={selectedOp.id}
            />
          </div>
        )}

        {/* Conteúdo principal */}
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-semibold mb-4">Clichês</h1>
          {/* Aqui você pode adicionar detalhes da OP selecionada */}
        </div>
      </div>
    </div>
  );
}