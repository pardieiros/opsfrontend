import React, { useState } from 'react';
import { fetchEmployeeOpsReport, generateEmployeeOpsPDF } from '../../serviceapi/api';

interface EmployeeOp {
  id: number;
  nome_op: string;
  created_on: string;
  created_by_name: string;
  numero_empregado: string;
}

interface EmployeeOpsData {
  employee_name: string;
  numero_empregado: string;
  total_ops: number;
  ops: EmployeeOp[];
}

const EmployeeOpsReportWidget: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [data, setData] = useState<EmployeeOpsData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleLoadData = async () => {
    if (!selectedDate) {
      setError('Por favor, selecione uma data');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const reportData = await fetchEmployeeOpsReport(selectedDate);
      setData(reportData);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedDate) {
      setError('Por favor, selecione uma data');
      return;
    }

    try {
      setGeneratingPDF(true);
      setError(null);
      await generateEmployeeOpsPDF(selectedDate);
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      setError(err.message || 'Erro ao gerar PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Relatório de OPs por Empregado
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visualize e gere relatório de OPs criadas por empregado em uma data específica
          </p>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {data.length} empregados
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleLoadData}
              disabled={loading || !selectedDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Carregando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Carregar Dados
                </>
              )}
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF || !selectedDate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generatingPDF ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gerando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Gerar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Dados */}
      {data.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Relatório para <strong>{formatDate(selectedDate)}</strong> - {data.length} empregado(s) encontrado(s)
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.map((employee) => (
              <div key={employee.numero_empregado} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      {employee.employee_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nº Empregado: {employee.numero_empregado}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {employee.total_ops} OP{employee.total_ops !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {employee.ops.length > 0 && (
                  <div className="space-y-2">
                    {employee.ops.map((op) => (
                      <div key={op.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {op.nome_op}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(op.created_on)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.length === 0 && !loading && selectedDate && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Nenhuma OP encontrada para esta data
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Clique em "Carregar Dados" para buscar OPs criadas em {formatDate(selectedDate)}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeOpsReportWidget;




