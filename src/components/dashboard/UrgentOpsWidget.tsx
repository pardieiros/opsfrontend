import React, { useState, useEffect } from 'react';
import { fetchUrgentOps } from '../../serviceapi/api';

interface UrgentOp {
  id: number;
  nome_trabalho: string;
  status: string;
  data_expedicao: string;
  cliente_nome2?: string;
}

// Normalizador resiliente a vários formatos de resposta
// (Mantemos definição simples para evitar inferências erradas do TS)
function parseUrgentOps(input: unknown): UrgentOp[] {
  const obj: any = input;
  // Se já vier um array direto
  if (Array.isArray(obj)) return obj as UrgentOp[];

  // Tenta propriedades comuns
  const candidates = [obj?.results, obj?.data, obj?.items, obj?.payload, obj?.value];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as UrgentOp[];
  }

  // Procura a primeira propriedade que seja array de objetos com 'id' e 'status'
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (Array.isArray(val) && val.every(v => v && typeof v === 'object' && 'id' in v)) {
        return val as UrgentOp[];
      }
    }
  }

  return [];
}

const UrgentOpsWidget: React.FC = () => {
  const [urgentOps, setUrgentOps] = useState<UrgentOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUrgentOps();
  }, []);

  const loadUrgentOps = async () => {
    try {
      setLoading(true);
      const raw = await fetchUrgentOps();
      const parsed = parseUrgentOps(raw);
      setUrgentOps(parsed);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar OPs urgentes:', err);
      setError(err.message || 'Erro ao carregar OPs urgentes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Aguardando Maquete': 'text-yellow-600 bg-yellow-100',
      'Maquete não enviada': 'text-red-600 bg-red-100',
      'Maquete em aprovação': 'text-yellow-600 bg-yellow-100',
      'Maquete Aprovada': 'text-green-600 bg-green-100',
      'Maquete Reprovada': 'text-red-600 bg-red-100',
      'Em espera para impressão': 'text-blue-600 bg-blue-100',
      'Em impressão': 'text-blue-600 bg-blue-100',
      'Impresso': 'text-green-600 bg-green-100',
    };
    return statusColors[status] || 'text-gray-600 bg-gray-100';
  };

  const getDaysUntilDeadline = (expedicaoDate: string) => {
    const today = new Date();
    const expedicao = new Date(expedicaoDate);
    const diffTime = expedicao.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { days: Math.abs(diffDays), overdue: true };
    if (diffDays === 0) return { days: 0, overdue: false };
    return { days: diffDays, overdue: false };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            OPs Urgentes
          </h3>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            OPs Urgentes
          </h3>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          </div>
        </div>
        <div className="text-center py-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadUrgentOps}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          OPs Urgentes
        </h3>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {urgentOps.length} OPs
          </span>
        </div>
      </div>

      {urgentOps.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Nenhuma OP urgente encontrada!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Todas as OPs estão dentro do prazo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {urgentOps.slice(0, 5).map((op) => {
            const deadline = getDaysUntilDeadline(op.data_expedicao);
            return (
              <div
                key={op.id}
                className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {op.nome_trabalho || `OP ${op.id}`}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Cliente: {op.cliente_nome2 || 'N/A'}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(op.status)}`}>
                        {op.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        deadline.overdue 
                          ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20' 
                          : 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20'
                      }`}>
                        {deadline.overdue 
                          ? `${deadline.days} dia${deadline.days > 1 ? 's' : ''} em atraso`
                          : deadline.days === 0 
                            ? 'Vence hoje'
                            : `${deadline.days} dia${deadline.days > 1 ? 's' : ''} restante${deadline.days > 1 ? 's' : ''}`
                        }
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(op.data_expedicao)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {urgentOps.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                +{urgentOps.length - 5} mais OPs urgentes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UrgentOpsWidget; 