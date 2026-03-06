import React from "react";
import Modal from "../../components/ui/modal";
import ClientsTable from "../../components/clients/Clientstable";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterTipoImpressao: string;
  setFilterTipoImpressao: (s: string) => void;
  filterClient: any;
  setFilterClient: (c: any) => void;
  statusOptions: string[];
}

const tiposImpressao = ["Serigrafia", "Flexografia", "Offset", "Digital"];

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filterStatus,
  setFilterStatus,
  filterTipoImpressao,
  setFilterTipoImpressao,
  filterClient,
  setFilterClient,
  statusOptions,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg w-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Filtros Avançados</h2>
        <div className="mb-4">
          <label className="block mb-1">Cliente</label>
          <ClientsTable onSelect={client => setFilterClient(client)} />
          {filterClient && (
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
              Selecionado: {filterClient.name}
              <button className="ml-2 text-red-500" onClick={() => setFilterClient(null)}>Remover</button>
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {filterStatus === "Finalizado" && (
            <p className="text-sm text-blue-600 mt-1">
              ⚠️ Selecionar "Finalizado" irá marcar automaticamente a checkbox "Mostrar apenas finalizados"
            </p>
          )}
        </div>
        <div className="mb-4">
          <label className="block mb-1">Tipo de Impressão</label>
          <select value={filterTipoImpressao} onChange={e => setFilterTipoImpressao(e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="">Todos</option>
            {tiposImpressao.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded mt-4"
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
};

export default FilterModal; 