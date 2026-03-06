import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
// @ts-ignore: no declaration file for module '../../serviceapi/api'
import { fetchAllOrdensProducaoOptimized } from "../../serviceapi/api";
import CardOP, { OrdemCardProps } from "../../components/Ops/Card";
import FilterModal from "./FilterModal";

// Estilos CSS para scrollbar sempre visível
const scrollbarStyles = `
  .column-scroll::-webkit-scrollbar {
    width: 8px;
    background-color: #f3f4f6;
  }
  
  .column-scroll::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 4px;
  }
  
  .column-scroll::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
  }
  
  .dark .column-scroll::-webkit-scrollbar {
    background-color: #374151;
  }
  
  .dark .column-scroll::-webkit-scrollbar-thumb {
    background-color: #6b7280;
  }
  
  .dark .column-scroll::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
  }
`;

interface Ordem extends OrdemCardProps {
  // Detalhe do tipo de impressão vindo da API, com nome para filtro
  tipo_impressao_detail?: {
    nome: string;
  };
}

export default function ConsultarOPs() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingFilter, setPrintingFilter] = useState<"Todos" | "Serigrafia" | "Flexografia" | "Offset" | "Digital">("Todos");
  const [scrollToTopVisible, setScrollToTopVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTipoImpressao, setFilterTipoImpressao] = useState<string>("");
  const [filterClient, setFilterClient] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState<"name" | "date" | null>(null);

  // Função para verificar se um tipo de impressão corresponde ao filtro
  const matchesPrintingFilter = (tipoImpressaoNome: string | undefined, filter: string) => {
    if (filter === "Todos") return true;
    if (filter === "Digital") {
      return tipoImpressaoNome === "Digital" || tipoImpressaoNome === "Digital Manual";
    }
    return tipoImpressaoNome === filter;
  };

  // Função para atualizar o status de uma OP localmente
  const handleStatusUpdate = (opId: number, newStatus: string) => {
    setOrdens(prevOrdens => 
      prevOrdens.map(op => 
        op.id === opId 
          ? { ...op, status: newStatus }
          : op
      )
    );
  };

  // Ordem fixa de status conforme workflow, incluindo estados adicionais
  const statusOrder = [
    "Aguardando Maquete",
    "Maquete não enviada",
    "Maquete em aprovação",
    "Maquete Aprovada",
    "Maquete Reprovada",
    "Em espera para impressão",
    "Ficheiro na partilha",
    "Clichê Pedido",
    "Chapa Pedida",
    "Em impressão",
    "Sacos a dobrar",
    "Sacos Enviados",
    "Clichê recebido",
    "Impresso",
    "Em Armazem",
    "Cancelado",
    "Finalizado",
    "Pendente",
  ];

  // Filtra e ordena as ordens baseado nos filtros aplicados
  const filteredAndSortedOrdens = useMemo(() => {
    let filtered = ordens;

    // Aplicar filtro de busca por nome do trabalho
    if (searchTerm) {
      filtered = filtered.filter(op => 
        op.nome_trabalho?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de status
    if (filterStatus) {
      filtered = filtered.filter(op => op.status === filterStatus);
    }

    // Aplicar filtro de tipo de impressão
    if (filterTipoImpressao) {
      filtered = filtered.filter(op => 
        matchesPrintingFilter(op.tipo_impressao_detail?.nome, filterTipoImpressao)
      );
    }

    // Aplicar filtro de cliente
    if (filterClient) {
      filtered = filtered.filter(op => op.cliente_nome2 === filterClient.nome2);
    }

    // Aplicar ordenação
    if (sortOrder === "name") {
      filtered = [...filtered].sort((a, b) => 
        (a.nome_trabalho || "").localeCompare(b.nome_trabalho || "")
      );
    } else if (sortOrder === "date") {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.data_expedicao || "");
        const dateB = new Date(b.data_expedicao || "");
        return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
      });
    }

    return filtered;
  }, [ordens, searchTerm, filterStatus, filterTipoImpressao, filterClient, sortOrder]);

  // Agrupa ordens por status, usando fallback quando undefined
  const groupedOrdens = useMemo(() => {
    return filteredAndSortedOrdens.reduce<Record<string, Ordem[]>>((acc, op) => {
      const statusKey = op.status ?? 'Sem Status';
      if (!acc[statusKey]) {
        acc[statusKey] = [];
      }
      acc[statusKey].push(op);
      return acc;
    }, {});
  }, [filteredAndSortedOrdens]);
  // Lista de statuses na ordem encontrada
  const statusList = Object.keys(groupedOrdens);

  // Função para detectar scroll e mostrar botão de voltar ao topo
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollToTopVisible(target.scrollTop > 100);
  };

  // Função para voltar ao topo
  const scrollToTop = () => {
    const containers = document.querySelectorAll('.column-scroll');
    containers.forEach(container => {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Função para navegar para gerir com a OP selecionada
  const handleDoubleClick = (op: OrdemCardProps) => {
    console.log('🔄 handleDoubleClick chamado com OP:', op);
    console.log('🔄 Navegando para /ops/gerir com state:', { 
      selectedOpId: op.id,
      fromConsultar: true 
    });
    
    navigate('/ops/gerir', { 
      state: { 
        selectedOpId: op.id,
        fromConsultar: true 
      } 
    });
  };

  useEffect(() => {
    async function fetchOrdens() {
      try {
        const token = localStorage.getItem("accessToken") || "";
        // Envia filtro para o backend: status__ne=Finalizado (Django: status__ne ou status__not)
        const filtros = { status__ne: "Finalizado" };
        const allOps = await fetchAllOrdensProducaoOptimized(filtros);
        console.log("All ordens fetched (optimized):", allOps);
        setOrdens(allOps);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrdens();
  }, []);

  if (loading) {
    return <div className="p-4">Carregando ordens…</div>;
  }

  return (
    <>
      <PageMeta title="Consultar OPs" description="Lista das ordens de produção" />
      <PageBreadcrumb pageTitle="Consultar OPs" />
      
      {/* Estilos CSS para scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      
      {/* Seção de Busca, Filtro e Ordenação */}
      <div className="p-4">
        <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Campo de Busca */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar por Nome do Trabalho
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome do trabalho..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Botão de Filtro */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtros
              </button>
            </div>

            {/* Botões de Ordenação */}
            <div className="flex-shrink-0 flex gap-2">
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "name" ? null : "name")}
                className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  sortOrder === "name"
                    ? "border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                A-Z
              </button>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "date" ? null : "date")}
                className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  sortOrder === "date"
                    ? "border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Data
              </button>
            </div>
          </div>

          {/* Indicadores de Filtros Ativos */}
          {(filterStatus || filterTipoImpressao || filterClient || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    Busca: "{searchTerm}"
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterStatus && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    Status: {filterStatus}
                    <button
                      type="button"
                      onClick={() => setFilterStatus("")}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterTipoImpressao && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                    Impressão: {filterTipoImpressao}
                    <button
                      type="button"
                      onClick={() => setFilterTipoImpressao("")}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterClient && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                    Cliente: {filterClient.nome2}
                    <button
                      type="button"
                      onClick={() => setFilterClient(null)}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("");
                    setFilterTipoImpressao("");
                    setFilterClient(null);
                    setSortOrder(null);
                  }}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Limpar Todos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block mb-2 font-medium">Filtrar por tipo de impressão:</label>
            <select
              value={printingFilter}
              onChange={e => setPrintingFilter(e.target.value as any)}
              className="border rounded p-2"
            >
              <option value="Todos">Todos</option>
              <option value="Serigrafia">Serigrafia</option>
              <option value="Flexografia">Flexografia</option>
              <option value="Offset">Offset</option>
              <option value="Digital">Digital</option>
            </select>
          </div>
          
          {/* Contador total de OPs */}
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total de OPs: <span className="font-semibold text-gray-800 dark:text-gray-200">{ordens.length}</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {statusOrder.filter(status => {
                const opsForStatus = groupedOrdens[status] || [];
                const filteredOps = printingFilter === "Todos"
                  ? opsForStatus
                  : opsForStatus.filter(op => matchesPrintingFilter(op.tipo_impressao_detail?.nome, printingFilter));
                return filteredOps.length > 0;
              }).length} colunas ativas
            </div>
          </div>
        </div>
      </div>
      {/* Container principal com scroll horizontal */}
      <div className="p-4">
        <div 
          className="flex space-x-6 overflow-x-auto pb-4 relative"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
        >
          {/* Indicador de scroll horizontal */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600 opacity-50"></div>
          
          {/* Indicador de scroll horizontal no lado direito */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">
            ← Scroll →
          </div>
          {statusOrder.map(status => {
            const opsForStatus = groupedOrdens[status] || [];
            // Aplica filtro de tipo
            const filteredOps = printingFilter === "Todos"
              ? opsForStatus
              : opsForStatus.filter(op => matchesPrintingFilter(op.tipo_impressao_detail?.nome, printingFilter));
            if (filteredOps.length === 0) return null;
            return (
              <div key={status} className="flex-shrink-0 w-80">
                {/* Header da coluna */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                    {status}
                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({filteredOps.length})
                    </span>
                  </h3>
                </div>
                
                        {/* Container dos cards com scroll vertical */}
        <div 
          className="column-scroll h-[calc(100vh-200px)] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6',
            msOverflowStyle: 'none'
          }}
          onScroll={handleScroll}
        >
                  {filteredOps.map(op => (
                    <CardOP 
                      key={op.id} 
                      op={op} 
                      onStatusUpdate={handleStatusUpdate}
                      onDoubleClick={handleDoubleClick}
                    />
                  ))}
                  
                  {/* Indicador de scroll quando há muitos cards */}
                  {filteredOps.length > 8 && (
                    <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-2 bg-gradient-to-t from-white dark:from-gray-900 to-transparent">
                      <div className="flex items-center justify-center space-x-1">
                        <span>↓</span>
                        <span>Scroll para ver mais</span>
                        <span>↓</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Botão de voltar ao topo */}
      {scrollToTopVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50"
          title="Voltar ao topo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* FilterModal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterTipoImpressao={filterTipoImpressao}
        setFilterTipoImpressao={setFilterTipoImpressao}
        filterClient={filterClient}
        setFilterClient={setFilterClient}
        statusOptions={statusOrder}
      />
    </>
  );
}