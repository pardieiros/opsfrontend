import React, { useState, useEffect, useRef } from "react";
import CardOP from "../../components/Ops/Card";
import { fetchOrdensProducao } from "../../serviceapi/api";

export default function Pedchap() {
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOp, setSelectedOp] = useState(null);

  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function loadOffsetOps() {
      try {
        setLoading(true);
        const res = await fetchOrdensProducao({});
        const list = Array.isArray(res) ? res : res.results;
        const offsetOps = list.filter(
          (op) => op.tipo_impressao_detail?.id === 6
        );
        setOps(offsetOps);
      } catch (err) {
        console.error("Erro ao carregar OPs de Offset:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOffsetOps();
  }, []);

  // Email validation
  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSend = () => {
    if (!file || !isValidEmail) return;
    console.log("Enviando Offset pedido:", {
      opId: selectedOp.id,
      email,
      file,
    });
    // TODO: call API to send offset file
  };

  if (loading) {
    return <div className="p-4">Carregando OPs de Off-Set…</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">Erro: {error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex h-full">
        {/* Lista de OPs */}
        <div className="w-1/3 border-r border-gray-200 p-4 space-y-4 overflow-y-auto">
          {ops.map((op) => (
            <div
              key={op.id}
              onClick={() => {
                setSelectedOp(op);
                setFile(null);
                setEmail("");
                setIsValidEmail(false);
              }}
              className={`cursor-pointer rounded overflow-hidden hover:ring-1 hover:ring-gray-300 ${
                selectedOp?.id === op.id
                  ? "ring-2 ring-indigo-500 bg-indigo-50"
                  : ""
              }`}
            >
              <CardOP op={op} highlighted={selectedOp?.id === op.id} />
            </div>
          ))}
        </div>
        {/* Card de envio */}
        <div className="w-2/3 p-4">
          {selectedOp ? (
            <div className="p-4 border rounded bg-white shadow space-y-4">
              <h2 className="text-lg font-medium">
                OP #{selectedOp.id}: {selectedOp.nome_trabalho}
              </h2>
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
                  <p className="mt-2 text-theme-sm text-gray-600">
                    {file.name}
                  </p>
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
                type="button"
                onClick={handleSend}
                disabled={!file || !isValidEmail}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-theme-sm hover:bg-indigo-700 disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          ) : (
            <div className="p-4 text-gray-500">
              Selecione uma OP de Off-Set para enviar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}