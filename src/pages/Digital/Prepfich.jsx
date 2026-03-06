import React, { useState, useEffect } from "react";
import CardOP from "../../components/Ops/Card";
import { fetchAllOrdensProducao, getFilePath, setFilePath as apiSetFilePath } from "../../serviceapi/api";

export default function Prepfich() {
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOp, setSelectedOp] = useState(null);
  const [filePath, setFilePath] = useState("");
  const [initialPathLoaded, setInitialPathLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    async function loadDigitalOps() {
      try {
        setLoading(true);
        const data = await fetchAllOrdensProducao();
        console.log("[DEBUG Prepfich] raw orders from backend:", data);
        // Filtra apenas ops cujo tipo_impressao_detail?.id seja 3 ou 4 e status diferente de "Finalizado"
        const digitalOps = data.filter(
          (op) =>
            (op.tipo_impressao_detail?.id === 3 || op.tipo_impressao_detail?.id === 4) &&
            op.status !== "Finalizado"
        );
        setOps(digitalOps);
      } catch (err) {
        console.error("Erro ao carregar OPs digitais:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDigitalOps();
  }, []);

  if (loading) {
    return <div className="p-4">Carregando OPs digitais…</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">Erro: {error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex h-full">
        {/* Lista de OPs digitais */}
        <div className="w-1/3 border-r border-gray-200 p-4 space-y-4 overflow-y-auto max-h-screen">
          {ops.map((op) => (
            <div
              key={op.id}
              onClick={async () => {
                console.log("[DEBUG] getFilePath request payload:", { op_id: op.id });
                setSelectedOp(op);
                setFilePath("");
                setInitialPathLoaded(false);
                setSaveError(null);
                try {
                  const data = await getFilePath(op.id);
                  console.log("[DEBUG] getFilePath response payload:", data);
                  if (data.file_path) {
                    setFilePath(data.file_path);
                    setInitialPathLoaded(true);
                  }
                } catch (err) {
                  console.error("Erro ao obter file_path:", err);
                }
              }}
              className="cursor-pointer rounded overflow-hidden hover:ring-1 hover:ring-gray-300"
            >
              <CardOP op={op} highlighted={selectedOp?.id === op.id} />
            </div>
          ))}
        </div>

        {/* Card de detalhe e input de caminho de ficheiro */}
        <div className="w-2/3 p-4">
          {selectedOp ? (
            <div className="p-4 border rounded bg-white shadow">
              <h2 className="text-lg font-medium mb-2">
                OP #{selectedOp.id}: {selectedOp.nome_trabalho}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Caminho do ficheiro
                  </label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="/caminho/para/o/ficheiro.pdf"
                    className="block w-full border border-gray-300 rounded px-3 py-2 text-theme-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    console.log("[DEBUG] setFilePath request payload:", { op_id: selectedOp.id, file_path: filePath });
                    setSaving(true);
                    setSaveError(null);
                    try {
                      const result = await apiSetFilePath(selectedOp.id, filePath);
                      console.log("[DEBUG] apiSetFilePath response payload:", result);
                      setInitialPathLoaded(true);
                    } catch (err) {
                      console.error("Erro ao salvar file_path:", err);
                      setSaveError(err.message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={!filePath || saving}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white text-theme-sm hover:bg-indigo-700 disabled:opacity-40"
                >
                  {initialPathLoaded ? "Atualizar caminho" : "Guardar caminho"}
                </button>
                {saveError && (
                  <p className="mt-2 text-red-600">{saveError}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-gray-500">
              Selecione uma OP para inserir o caminho do ficheiro.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}