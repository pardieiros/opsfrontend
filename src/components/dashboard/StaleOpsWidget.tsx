import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { fetchStaleOps } from "../../serviceapi/api";

interface StaleOp {
  id: number;
  nome_trabalho: string;
  status: string;
  updated_on: string;
  data_expedicao: string;
  cliente?: {
    nome: string;
  };
}

export default function StaleOpsWidget() {
  const [staleOps, setStaleOps] = useState<StaleOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStaleOps() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStaleOps();
        setStaleOps(data);
      } catch (err) {
        console.error("Erro ao carregar OPs não atualizadas:", err);
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    loadStaleOps();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getDaysSinceUpdate = (dateString: string) => {
    const updateDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updateDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aguardando Maquete':
        return 'bg-yellow-100 text-yellow-800';
      case 'Maquete não enviada':
        return 'bg-red-100 text-red-800';
      case 'Maquete em aprovação':
        return 'bg-blue-100 text-blue-800';
      case 'Maquete Aprovada':
        return 'bg-green-100 text-green-800';
      case 'Em espera para impressão':
        return 'bg-purple-100 text-purple-800';
      case 'Em impressão':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysColor = (days: number) => {
    if (days >= 7) return 'text-red-600 font-semibold';
    if (days >= 5) return 'text-orange-600 font-semibold';
    return 'text-yellow-600 font-semibold';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            OPs Não Atualizadas
          </h3>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            OPs Não Atualizadas
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {staleOps.length} OPs
          </span>
        </div>
        <div className="text-center py-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          OPs Não Atualizadas
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {staleOps.length} OPs
        </span>
      </div>

      {staleOps.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Todas as OPs foram atualizadas recentemente
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {staleOps.slice(0, 5).map((op) => {
            const daysSinceUpdate = getDaysSinceUpdate(op.updated_on);
            return (
              <div
                key={op.id}
                className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => navigate(`/ops/consultar?op=${op.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {op.nome_trabalho}
                    </h4>
                    {op.cliente && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {op.cliente.nome}
                      </p>
                    )}
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(op.status)}`}>
                        {op.status}
                      </span>
                      <span className={`text-xs ${getDaysColor(daysSinceUpdate)}`}>
                        {daysSinceUpdate} dia{daysSinceUpdate !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Última atualização
                    </p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {formatDate(op.updated_on)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {staleOps.length > 5 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/ops/consultar')}
            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Ver todas as {staleOps.length} OPs não atualizadas →
          </button>
        </div>
      )}
    </div>
  );
} 