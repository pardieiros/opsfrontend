import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClientDetail, fetchClientOrders } from '../../serviceapi/api';
import PageMeta from '../../components/common/PageMeta';
import { Modal } from '../../components/ui/modal';

interface Client {
  id: number;
  name: string;
  nome2?: string;
  email?: string;
  phone?: string;
  fax?: string;
  contacto?: string;
  address?: string;
  morada?: string;
  local?: string;
  codpost?: string;
  zona?: string;
  pais?: string;
  ncont?: string;
  moeda?: string;
  obs?: string;
  obs2?: string;
  created_at: string;
  logo?: string;
  excel_file?: string;
}

interface Order {
  id: number;
  nome_trabalho: string;
  status: string;
  data_criacao: string;
  data_expedicao: string;
  tipo_saco?: string;
  tipo_impressao?: string;
  quantidade: number;
  cliente_nome2?: string;
  order_type?: 'op' | 'sacos_lisos';
  excel_rows?: SacosLisosRow[];
  total_subtracted?: number;
  email_recipients?: string[];
  source?: string;
  created_by?: number | null;
  created_by_name?: string;
  created_by_nome_completo?: string;
}

interface SacosLisosRow {
  ref: string;
  design?: string;
  qtt_original: number;
  qtt_milheiro: number;
  unidade?: string;
  preco_milheiro: number;
  preco_total: number;
  taxa_iva?: string | number;
}

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedSacosOrder, setSelectedSacosOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'orders'>('details');

  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      loadClientData();
    } else {
      setError('ID do cliente inválido');
      setLoading(false);
    }
  }, [id]);

  // Normaliza diferentes formatos de resposta para um array de Order
  function normalizeOrders(input: unknown): Order[] {
    const obj: any = input;
    if (Array.isArray(obj)) return obj as Order[];
    const candidates = [obj?.results, obj?.data, obj?.items, obj?.payload, obj?.value];
    for (const c of candidates) {
      if (Array.isArray(c)) return c as Order[];
    }
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        const val = (obj as any)[key];
        if (Array.isArray(val) && val.every(v => v && typeof v === 'object' && 'id' in v)) {
          return val as Order[];
        }
      }
    }
    return [];
  }

  const loadClientData = async () => {
    try {
      setLoading(true);
      const clientId = parseInt(id!);
      if (isNaN(clientId)) {
        throw new Error('ID do cliente inválido');
      }
      
      const [clientData, ordersData] = await Promise.all([
        fetchClientDetail(clientId),
        fetchClientOrders(clientId)
      ]);
      setClient(clientData);
      setOrders(normalizeOrders(ordersData));
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar dados do cliente:', err);
      setError(err.message || 'Erro ao carregar dados do cliente');
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
      'Finalizado': 'text-green-600 bg-green-100',
      'Sacos Enviados': 'text-green-600 bg-green-100',
    };
    return statusColors[status] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getEmployeeName = (order: Order) => {
    return order.created_by_nome_completo || order.created_by_name || '-';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Erro ao carregar cliente
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar à lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${client.name} - Detalhes do Cliente`}
        description={`Detalhes e ordens de produção do cliente ${client.name}`}
      />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/clients')}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {client.name}
              </h1>
              {client.nome2 && (
                <p className="text-gray-600 dark:text-gray-400">{client.nome2}</p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/clients/${client.id}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Editar</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Detalhes
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Ordens de Produção ({orders.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações básicas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Informações Básicas
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome</label>
                  <p className="text-gray-800 dark:text-gray-200">{client.name}</p>
                </div>
                {client.nome2 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome 2</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.nome2}</p>
                  </div>
                )}
                {client.ncont && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">NIF</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.ncont}</p>
                  </div>
                )}
                {client.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefone</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.phone}</p>
                  </div>
                )}
                {client.fax && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fax</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.fax}</p>
                  </div>
                )}
                {client.contacto && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contacto</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.contacto}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Endereço
              </h3>
              <div className="space-y-3">
                {client.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Endereço</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.address}</p>
                  </div>
                )}
                {client.morada && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Morada</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.morada}</p>
                  </div>
                )}
                {client.local && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Local</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.local}</p>
                  </div>
                )}
                {client.codpost && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Código Postal</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.codpost}</p>
                  </div>
                )}
                {client.zona && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Zona</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.zona}</p>
                  </div>
                )}
                {client.pais && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">País</label>
                    <p className="text-gray-800 dark:text-gray-200">{client.pais}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informações adicionais */}
            {(client.moeda || client.obs || client.obs2) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Informações Adicionais
                </h3>
                <div className="space-y-3">
                  {client.moeda && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Moeda</label>
                      <p className="text-gray-800 dark:text-gray-200">{client.moeda}</p>
                    </div>
                  )}
                  {client.obs && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</label>
                      <p className="text-gray-800 dark:text-gray-200">{client.obs}</p>
                    </div>
                  )}
                  {client.obs2 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Observações 2</label>
                      <p className="text-gray-800 dark:text-gray-200">{client.obs2}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Informações do Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID do Cliente</label>
                  <p className="text-gray-800 dark:text-gray-200">{client.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Criação</label>
                  <p className="text-gray-800 dark:text-gray-200">{formatDate(client.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Lista de ordens de produção */
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhuma ordem de produção
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Este cliente ainda não possui ordens de produção.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ordem
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data Criação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data Expedição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr key={`${order.order_type || 'op'}-${order.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {order.nome_trabalho || `OP ${order.id}`}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {order.id}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Empregado: {getEmployeeName(order)}
                            </div>
                            {order.order_type === 'sacos_lisos' && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Sacos lisos
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(order.data_criacao)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(order.data_expedicao)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {Number(order.quantidade || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              if (order.order_type === 'sacos_lisos') {
                                setSelectedSacosOrder(order);
                                return;
                              }

                              console.log('🔄 Navegando para gerir com OP:', order.id, 'do cliente:', client?.name);
                              navigate('/ops/gerir', {
                                state: {
                                  selectedOpId: order.id,
                                  fromClientDetail: true
                                }
                              });
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedSacosOrder}
        onClose={() => setSelectedSacosOrder(null)}
        className="max-w-[1100px] m-4 p-6"
      >
        {!selectedSacosOrder ? null : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Sacos lisos #{selectedSacosOrder.id}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Criada em {formatDate(selectedSacosOrder.data_criacao)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedSacosOrder.status}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Subtraído</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {Number(selectedSacosOrder.total_subtracted || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Destinatários</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {(selectedSacosOrder.email_recipients || []).join(', ') || '-'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Empregado</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getEmployeeName(selectedSacosOrder)}
                </p>
              </div>
            </div>

            {(!selectedSacosOrder.excel_rows || selectedSacosOrder.excel_rows.length === 0) ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Esta ordem não tem linhas registadas.
              </div>
            ) : (
              <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ref</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Design</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qtt Un</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qtt Milheiro</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unidade</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Preço</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Preço Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Taxa IVA</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedSacosOrder.excel_rows.map((row, idx) => (
                      <tr key={`${row.ref}-${idx}`}>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{row.ref}</td>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{row.design || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                          {Number(row.qtt_original || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                          {Number(row.qtt_milheiro || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{row.unidade || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                          {Number(row.preco_milheiro || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                          {Number(row.preco_total || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{row.taxa_iva || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ClientDetail; 
