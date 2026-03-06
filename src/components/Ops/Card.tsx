import React, { useState } from "react";
import DetalhesOP from "../ui/modal/Detalhesops";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import { updateOrdemProducaoStatus } from "../../serviceapi/api";
import "./Card.css";

// Mapeamento de classes de cores para cada status
const statusClasses: Record<string, string> = {
  "Aguardando Maquete": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Maquete não enviada": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Maquete Aprovada": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Em espera para impressão": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Sacos Enviados": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "Clichê Pedido": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Clichê recebido": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  "Impresso": "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200",
  "Chapa Pedida": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  "Ficheiro na partilha": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Em impressão": "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-200",
  "Sacos a dobrar": "bg-pink-200 text-pink-900 dark:bg-pink-800 dark:text-pink-200",
  "Em Armazem": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  "Maquete em aprovação": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Maquete Reprovada":       "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "Cancelado":               "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  "Finalizado":              "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200",
  "Pendente":                "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-200",
};

// Formata ISO date para DD/MM/YYYY
const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString();
};

// Formata dimensões: remove ".00" quando inteiro
const formatDim = (val?: string | number | null): string => {
  if (!val) return '';
  const strVal = String(val);
  return strVal.endsWith('.00') ? String(parseInt(strVal, 10)) : strVal;
};

// Formata tamanho completo
const formatTamanho = (tamanhoDetail?: any): string => {
  if (!tamanhoDetail) return '';
  
  const largura = formatDim(tamanhoDetail.largura);
  const fole = formatDim(tamanhoDetail.fole);
  const altura = formatDim(tamanhoDetail.altura);
  
  if (fole && parseFloat(fole) > 0) {
    return `${largura}×${fole}×${altura}`;
  } else {
    return `${largura}×${altura}`;
  }
};

// Formata quantidade com pontos nos milhares
const formatQuantidade = (quantidade: number | string | null | undefined): string => {
  if (!quantidade) return '';
  const num = Number(quantidade);
  if (isNaN(num)) return String(quantidade);
  
  // Formatação manual com pontos nos milhares
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Lista de status disponíveis
const STATUS_OPTIONS = [
  "Aguardando Maquete",
  "Maquete não enviada",
  "Maquete em aprovação",
  "Maquete Aprovada",
  "Maquete Reprovada",
  "Em espera para impressão",
  "Em impressão",
  "Impresso",
  "Sacos a dobrar",
  "Em Armazem",
  "Finalizado",
  "Cancelado",
  "Pendente"
];

export interface OrdemCardProps {
  id: number;
  nome_trabalho?: string | null;
  cliente_nome2: string;
  status?: string;
  data_expedicao?: string | null;
  quantidade?: number;
  tamanho_detail?: {
    largura?: string | number | null;
    fole?: string | number | null;
    altura?: string | number | null;
  };
}

interface CardProps {
  op: OrdemCardProps;
  highlighted?: boolean;
  onStatusUpdate?: (opId: number, newStatus: string) => void;
  onDoubleClick?: (op: OrdemCardProps) => void;
}

const CardOP: React.FC<CardProps> = ({ op, highlighted = false, onStatusUpdate, onDoubleClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(op.status || "");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [oldStatus, setOldStatus] = useState(op.status || "");
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = (newStatusValue: string) => {
    setNewStatus(newStatusValue);
    setOldStatus(op.status || "");
    setShowConfirmModal(true);
  };

  const confirmStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      // Chamar a API para atualizar o status
      await updateOrdemProducaoStatus(op.id, newStatus);
      
      // Fechar modais e resetar estados
      setShowConfirmModal(false);
      setIsEditingStatus(false);
      
      // Notificar o componente pai sobre a atualização
      if (onStatusUpdate) {
        onStatusUpdate(op.id, newStatus);
      } else {
        // Fallback: recarregar a página se não houver callback
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar o status. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDoubleClick) {
      console.log('Double click detected, navigating to gerir with OP:', op.id);
      onDoubleClick(op);
    }
  };

  return (
    <>
      <div
        className={`card-op relative rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer group ${
          highlighted ? 'bg-green-50 dark:bg-green-900 ring-2 ring-green-500' : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700'
        }`}
        onDoubleClick={handleDoubleClick}
        style={{ 
          transform: 'translateZ(0)', // Força hardware acceleration
          willChange: 'transform', // Otimiza para animações
          // Garante que o hover funcione
          '--tw-scale-x': '1',
          '--tw-scale-y': '1',
        } as React.CSSProperties}
      >
        {/* Indicador de duplo clique */}
        <div className="double-click-indicator absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[9px] shadow-sm">
            Duplo clique
          </div>
        </div>

        <span className="absolute top-3 right-3 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
          {formatDate(op.data_expedicao)}
        </span>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
          {op.nome_trabalho || `OP #${op.id}`}
        </h4>
        <p className="mt-2 text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
          Cliente: {op.cliente_nome2 || "—"}
        </p>
        
        {/* Quantidade */}
        {op.quantidade && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
            Quantidade: {formatQuantidade(op.quantidade)}
          </p>
        )}
        
        {/* Tamanho formatado */}
        {op.tamanho_detail && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
            Tamanho: {formatTamanho(op.tamanho_detail)}
          </p>
        )}
        
        <div className="mt-4 relative">
          {isEditingStatus ? (
            <div className="flex items-center space-x-2">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  if (newStatus !== op.status) {
                    handleStatusChange(newStatus);
                  }
                }}
                className="px-3 py-1 rounded-full text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingStatus(false);
                }}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              className={`status-group group relative inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer transition-all duration-200 hover:pr-8 ${
                statusClasses[op.status || ""] ||
                "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingStatus(true);
              }}
            >
              <span>
                {(op.status ?? "").charAt(0).toUpperCase() + (op.status ?? "").slice(1)}
              </span>
              <svg
                className="status-edit-icon absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="absolute bottom-3 right-3 px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Detalhes
        </button>
      </div>
      <DetalhesOP
        opId={op.id}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {/* Modal de Confirmação */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="max-w-md p-6"
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Confirmar Alteração de Status
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Tem a certeza que quer atualizar o status de{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              "{oldStatus}"
            </span>{" "}
            para{" "}
            <span className="font-semibold text-green-600 dark:text-green-400">
              "{newStatus}"
            </span>
            ?
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={isUpdating}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmStatusUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? "Atualizando..." : "Sim, Atualizar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CardOP;