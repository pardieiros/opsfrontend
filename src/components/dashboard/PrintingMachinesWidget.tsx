import React, { useState, useEffect } from 'react';
import { getMaquinas, getEstadosImpressaoAtivos } from '../../serviceapi/api';

interface Maquina {
  id: number;
  nome: string;
  descricao: string;
  ativa: boolean;
  estado_atual?: EstadoImpressao;
}

interface EstadoImpressao {
  id: number;
  maquina_nome: string;
  tamanho_dimensoes: string;
  cor_nome: string;
  gramagem: number;
  quantidade_produzida: number;
  quantidade_planejada: number;
  progress_percentage: number;
  data_inicio: string;
  is_active: boolean;
}

export default function PrintingMachinesWidget() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") || "";
      const maquinasData = await getMaquinas(token);
      setMaquinas(maquinasData);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar máquinas:", err);
      setError("Erro ao carregar dados das máquinas");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Erro ao carregar
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={loadMachines}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const maquinasAtivas = maquinas.filter(maquina => maquina.ativa);
  const maquinasComImpressao = maquinasAtivas.filter(maquina => maquina.estado_atual);
  const maquinasLivres = maquinasAtivas.filter(maquina => !maquina.estado_atual);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Estado das Máquinas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Máquinas de impressão em tempo real
          </p>
        </div>
        <button
          onClick={loadMachines}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Atualizar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Máquinas com impressão ativa */}
        {maquinasComImpressao.map((maquina) => {
          const estado = maquina.estado_atual!;
          return (
            <div key={maquina.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {maquina.nome}
                  </h4>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  Ativa
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tamanho:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {estado.tamanho_dimensoes}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cor:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {estado.cor_nome}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Gramagem:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {estado.gramagem}g/m²
                  </span>
                </div>
                
                {estado.quantidade_planejada && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progresso:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {estado.quantidade_produzida} / {estado.quantidade_planejada}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${estado.progress_percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {estado.progress_percentage.toFixed(1)}% concluído
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-green-200 dark:border-green-800">
                  Iniciado: {formatDateTime(estado.data_inicio)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Máquinas livres */}
        {maquinasLivres.map((maquina) => (
          <div key={maquina.id} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {maquina.nome}
                </h4>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full">
                Livre
              </span>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {maquina.descricao || "Máquina disponível para impressão"}
            </div>
          </div>
        ))}

        {/* Mensagem se não houver máquinas */}
        {maquinasAtivas.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma máquina encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Configure as máquinas de impressão para começar
            </p>
          </div>
        )}
      </div>

      {/* Estatísticas rápidas */}
      {maquinasAtivas.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {maquinasComImpressao.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Ativas
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {maquinasLivres.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Livres
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


