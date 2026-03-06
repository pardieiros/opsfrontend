import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchAllOrdensProducaoOptimized, fetchOrdemProducaoComplete, updateOrdemProducaoStatus, deleteOrdemProducao, fetchPdfMockup, triggerMockup } from "../../serviceapi/api";
import CardOP from "../../components/Ops/Card";
import FilterModal from "./FilterModal";

// Função para buscar paletes de uma OP
const fetchPaletesByOP = async (opId: number) => {
  try {
    const response = await fetch(`/api/op/paletes/by-ordem/?ordem_id=${opId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Erro ao buscar paletes');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar paletes:', error);
    return [];
  }
};

// Remove trailing ".00" from numeric strings
const formatNumber = (value: string | number | undefined) => {
  if (value === undefined || value === null) return "";
  const s = String(value);
  return s.endsWith('.00') ? s.slice(0, -3) : s;
};

// Status disponíveis para alteração
const statusOptions = [
  "Aguardando Maquete",
  "Maquete não enviada",
  "Maquete em aprovação",
  "Maquete Aprovada",
  "Maquete Reprovada",
  "Em espera para impressão",
  "Sacos Enviados",
  "Clichê Pedido",
  "Clichê recebido",
  "Impresso",
  "Chapa Pedida",
  "Ficheiro na partilha",
  "Em impressão",
  "Sacos a dobrar",
  "Em Armazem",
  "Cancelado",
  "Finalizado",
  "Pendente",
];

const Gerir: React.FC = () => {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  const [cordaoExpanded, setCordaoExpanded] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFinalizados, setShowFinalizados] = useState<boolean>(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTipoImpressao, setFilterTipoImpressao] = useState<string>("");
  const [filterClient, setFilterClient] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  
  // Estados para paletes e caixas
  const [paletes, setPaletes] = useState<any[]>([]);
  const [loadingPaletes, setLoadingPaletes] = useState<boolean>(false);
  const [paletesExpanded, setPaletesExpanded] = useState<boolean>(false);
  const [selectedPalete, setSelectedPalete] = useState<any | null>(null);
  const [expandedPaletes, setExpandedPaletes] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadOrdens() {
      try {
        const filtros: any = {};
        
        // Se há filtros da modal ativos, usam-se esses
        if (filterStatus || filterTipoImpressao || filterClient) {
          if (filterStatus) filtros.status = filterStatus;
          if (filterTipoImpressao) filtros.tipo_impressao = filterTipoImpressao;
          if (filterClient) filtros.cliente = filterClient.id;
        } else {
          // Se não há filtros da modal, usa a checkbox de finalizados
          if (showFinalizados) {
            filtros.status = "Finalizado";
          } else {
            filtros.status__ne = "Finalizado";
          }
        }
        
        const all = await fetchAllOrdensProducaoOptimized(filtros);
        console.log("📋 Todas as OPs carregadas (otimizado):", all);
        console.log("📋 Primeira OP como exemplo:", all[0] ? JSON.stringify(all[0], null, 2) : "Nenhuma OP encontrada");
        setOrdens(all);

        // Verificar se veio da página Consultar com uma OP específica selecionada
        if ((location.state?.fromConsultar || location.state?.fromClientDetail || location.state?.fromSearch) && location.state?.selectedOpId) {
          const opToSelect = all.find(op => op.id === location.state.selectedOpId);
          if (opToSelect) {
            console.log("🎯 Selecionando OP automaticamente:", opToSelect);
            console.log("🎯 Origem:", location.state.fromConsultar ? "Consultar" : location.state.fromClientDetail ? "ClientDetail" : "Search");
            handleSelect(opToSelect);
            // Limpar o state para evitar seleção automática em navegações futuras
            navigate(location.pathname, { replace: true });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar OPs para gerir:", err);
      }
    }
    loadOrdens();
  }, [showFinalizados, filterStatus, filterTipoImpressao, filterClient, location.state]);

  // useEffect separado para carregar mockup quando selected muda
  useEffect(() => {
    if (selected?.id) {
      loadMockupPdf(selected.id);
    }
  }, [selected?.id]);

  const handleSelect = async (op: any) => {
    console.log("🎯 OP selecionada para edição (dados otimizados):", op);
    
    // Buscar dados completos da OP
    try {
      const opCompletaData = await fetchOrdemProducaoComplete(op.id);
      
      console.log("📊 Dados completos da OP:", JSON.stringify(opCompletaData, null, 2));
      console.log("🔍 Campos específicos:");
      console.log("  - ID:", opCompletaData.id);
      console.log("  - Nome:", opCompletaData.nome_trabalho);
      console.log("  - Status:", opCompletaData.status);
      console.log("  - Cliente:", opCompletaData.cliente_nome2);
      console.log("  - Tipo Impressão:", opCompletaData.tipo_impressao_detail);
      console.log("  - Tamanho:", opCompletaData.tamanho_detail);
      console.log("  - Cor Gramagem:", opCompletaData.cor_gramagem_cor);
      console.log("  - Quantidade:", opCompletaData.quantidade);
      console.log("  - Created by:", opCompletaData.created_by_name);
      console.log("  - Updated by:", opCompletaData.updated_by_name);
      console.log("  - Updated on:", opCompletaData.updated_on);
      console.log("  - Maqueta file:", opCompletaData.maqueta_file_url);
      console.log("  - File type detected:", fileType);
      
      setSelected(opCompletaData);
      setStatus(opCompletaData.status ?? '');
    } catch (error) {
      console.error("❌ Erro ao buscar dados completos da OP:", error);
      // Fallback: usar dados otimizados
      console.warn("⚠️ Usando dados otimizados como fallback");
      setSelected(op);
      setStatus(op.status ?? '');
    }
    
    setMessage("");
    
    // Carregar paletes da OP
    setLoadingPaletes(true);
    try {
      const paletesData = await fetchPaletesByOP(op.id);
      setPaletes(paletesData);
      console.log("📦 Paletes carregadas:", paletesData);
    } catch (error) {
      console.error("Erro ao carregar paletes:", error);
      setPaletes([]);
    } finally {
      setLoadingPaletes(false);
    }
  };

  const loadMockupPdf = async (opId: number) => {
    setMockupLoading(true);
    setMockupError(false);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const url = await fetchPdfMockup(opId, token);
      setMockupPdfUrl(url);
    } catch (err) {
      console.error('Erro ao buscar PDF mockup:', err);
      setMockupError(true);
    } finally {
      setMockupLoading(false);
    }
  };

  const triggerMockupUpdate = async () => {
    if (!selected) return;
    
    setMockupUpdating(true);
    setMockupError(false);
    try {
      // Executa a task generate_pdf_mockup novamente
      await triggerMockup(selected.id);
      
      // Aguarda um pouco para a task processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Busca o novo PDF
      const token = localStorage.getItem("accessToken") || "";
      const url = await fetchPdfMockup(selected.id, token);
      setMockupPdfUrl(url);
    } catch (err) {
      console.error("Error triggering mockup:", err);
      setMockupError(true);
    } finally {
      setMockupUpdating(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateOrdemProducaoStatus(selected.id, status);
      setMessage("Guardado com sucesso!");
      // Atualiza a lista local com o objeto retornado
      setOrdens(prev => prev.map(o => (o.id === selected.id ? updated : o)));
    } catch (err: any) {
      console.error(err);
      setMessage("Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteOrdemProducao(selected.id);
      setMessage("OP deletada com sucesso!");
      // Remove a OP da lista local
      setOrdens(prev => prev.filter(o => o.id !== selected.id));
      // Limpa a seleção
      setSelected(null);
      setStatus("");
      setShowDeleteModal(false);
    } catch (err: any) {
      console.error(err);
      setMessage("Erro ao deletar OP.");
    } finally {
      setDeleting(false);
    }
  };

  // Determine selected gramagem entry based on cor_gramagem_cor
  const selectedGramagem = selected?.tamanho_detail?.gramagens?.find(
    (g: any) => String(g.cor) === selected?.cor_gramagem_cor
  );

  const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);
  
  // Estados para o mockup PDF
  const [mockupPdfUrl, setMockupPdfUrl] = useState<string | null>(null);
  const [mockupLoading, setMockupLoading] = useState<boolean>(false);
  const [mockupError, setMockupError] = useState<boolean>(false);
  const [mockupUpdating, setMockupUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (!selected?.maqueta_file_url) {
      setFileBlobUrl(null);
      setFileType(null);
      return;
    }
    let canceled = false;
    fetch(selected.maqueta_file_url)
      .then(res => res.blob())
      .then(blob => {
        if (!canceled) {
          const url = URL.createObjectURL(blob);
          setFileBlobUrl(url);
          
          // Detectar tipo de arquivo baseado no MIME type
          if (blob.type === 'application/pdf') {
            setFileType('pdf');
          } else if (blob.type.startsWith('image/')) {
            setFileType('image');
          } else {
            // Fallback: detectar por extensão do arquivo
            const fileName = selected.maqueta_file_url.toLowerCase();
            if (fileName.endsWith('.pdf')) {
              setFileType('pdf');
            } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
              setFileType('pdf'); // Default para PDF
            } else {
              setFileType('pdf'); // Default para PDF
            }
          }
        }
      })
      .catch(console.error);
    return () => {
      canceled = true;
      if (fileBlobUrl) {
        URL.revokeObjectURL(fileBlobUrl);
        setFileBlobUrl(null);
      }
    };
  }, [selected?.maqueta_file_url]);

  // Cleanup do mockup PDF quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (mockupPdfUrl) {
        URL.revokeObjectURL(mockupPdfUrl);
        setMockupPdfUrl(null);
      }
    };
  }, [mockupPdfUrl]);

  // Filter orders by name
  const filteredOrdens = ordens.filter(op => {
    const name = op.nome_trabalho ? op.nome_trabalho : `OP ${op.id}`;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleFilterClose = () => {
    setFilterOpen(false);
    // Se o filtro de status for "Finalizado", marca a checkbox
    if (filterStatus === "Finalizado") {
      setShowFinalizados(true);
    } else if (filterStatus) {
      // Se for outro status, desmarca a checkbox
      setShowFinalizados(false);
    }
  };

  // Funções para controlar expansão de paletes
  const togglePaleteExpansion = (paleteId: number) => {
    setExpandedPaletes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paleteId)) {
        newSet.delete(paleteId);
      } else {
        newSet.add(paleteId);
      }
      return newSet;
    });
  };

  const expandAllPaletes = () => {
    const allPaleteIds = paletes.map(p => p.id);
    setExpandedPaletes(new Set(allPaleteIds));
  };

  const collapseAllPaletes = () => {
    setExpandedPaletes(new Set());
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Gerir OPs</h1>
        <button
          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          onClick={() => setFilterOpen(true)}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
        </button>
      </div>
      <FilterModal
        isOpen={filterOpen}
        onClose={handleFilterClose}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterTipoImpressao={filterTipoImpressao}
        setFilterTipoImpressao={setFilterTipoImpressao}
        filterClient={filterClient}
        setFilterClient={setFilterClient}
        statusOptions={statusOptions}
      />
      <div className="flex flex-col lg:flex-row h-full gap-4">
        {/* Lista de OPs */}
        <div className="w-full lg:w-1/3 p-2 lg:p-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg flex flex-col h-[calc(100vh-200px)] lg:h-screen">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar OP..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="showFinalizados"
                  checked={showFinalizados}
                  onChange={(e) => setShowFinalizados(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="showFinalizados" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mostrar apenas finalizados
                </label>
                {showFinalizados && (
                  <span className="ml-2 text-xs text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
                    Ativo
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredOrdens.map((op) => (
                <div
                  key={op.id}
                  onClick={() => handleSelect(op)}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <CardOP 
                    op={op} 
                    highlighted={selected?.id === op.id}
                    onDoubleClick={(op) => {
                      // Duplo clique na página gerir pode abrir os detalhes ou fazer scroll para a seção de detalhes
                      handleSelect(op);
                      // Scroll suave para a seção de detalhes
                      setTimeout(() => {
                        const detailsSection = document.querySelector('.w-full.lg\\:w-2\\/3');
                        if (detailsSection) {
                          detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalhes da OP */}
        <div className="w-full lg:w-2/3 p-2 lg:p-6 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma OP selecionada</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Selecione uma Ordem de Produção da lista para visualizar e editar os detalhes.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {selected.nome_trabalho || `OP ${selected.id}`}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ID: {selected.id} • Status: <span className="font-medium">{selected.status}</span>
                  </p>
                  {/* Resumo das Paletes */}
                  {paletes.length > 0 && (
                    <div className="mt-3 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-sm font-medium text-blue-600">
                          {paletes.length} palete{paletes.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-sm font-medium text-green-600">
                          {paletes.reduce((total, palete) => total + (palete.total_caixas || 0), 0)} caixas
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-purple-600">
                          {paletes.reduce((total, palete) => total + (palete.total_quantidade || 0), 0).toLocaleString('pt-BR')} un.
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        <span className="text-sm font-medium text-orange-600">
                          {(() => {
                            const pesoTotal = paletes.reduce((total, palete) => {
                              const peso = typeof palete.peso_total === 'number' ? palete.peso_total : 0;
                              return total + peso;
                            }, 0);
                            return pesoTotal > 0 ? `${pesoTotal.toFixed(2)} kg` : 'Peso não disponível';
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Apagar OP
                </button>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left: Details */}
                <div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{selected.cliente_nome2}</dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo Saco</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{selected.tipo_saco_detail.nome}</dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Técnica de Impressão</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {selected.tipo_impressao_detail?.nome || '—'}
                      </dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Grupo</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{selected.tamanho_detail.grupo}</dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tamanho</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatNumber(selected.tamanho_detail.largura)}x{formatNumber(selected.tamanho_detail.fole)}x{formatNumber(selected.tamanho_detail.altura)}
                      </dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantidade</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {selected.quantidade ? `${selected.quantidade.toLocaleString('pt-BR')} unidades` : '—'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cor Gramagem</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {selectedGramagem?.cor_nome ?? selected.cor_gramagem_cor} Gr{selectedGramagem ? formatNumber(selectedGramagem.gramagem) : formatNumber(selected.cor_gramagem_valor)}
                      </dd>
                    </div>
                  </dl>
                  
                  {/* Campos de Auditoria */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Informações de Auditoria
                    </h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <dt className="text-xs font-medium text-blue-600 dark:text-blue-400">Criado por</dt>
                        <dd className="mt-1 text-xs font-semibold text-blue-900 dark:text-blue-100">
                          {selected.created_by_name || 'N/A'}
                        </dd>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <dt className="text-xs font-medium text-green-600 dark:text-green-400">Atualizado por</dt>
                        <dd className="mt-1 text-xs font-semibold text-green-900 dark:text-green-100">
                          {selected.updated_by_name || 'N/A'}
                        </dd>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                        <dt className="text-xs font-medium text-purple-600 dark:text-purple-400">Última atualização</dt>
                        <dd className="mt-1 text-xs font-semibold text-purple-900 dark:text-purple-100">
                          {selected.updated_on ? new Date(selected.updated_on).toLocaleString('pt-BR') : 'N/A'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  {/* Spoiler for generic cordão when tipo_saco id is 3 */}
                  {selected.tipo_saco_detail?.id === 3 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setCordaoExpanded(!cordaoExpanded)}
                        className="w-full flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded"
                      >
                        <span className="font-medium">Cordão</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`w-5 h-5 transform transition-transform ${
                            cordaoExpanded ? 'rotate-180' : 'rotate-0'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {cordaoExpanded && selected.cordao && (
                        <ul className="mt-2 pl-4 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                          <li><span className="font-medium">Tipo:</span> {selected.cordao.tipo}</li>
                          <li><span className="font-medium">Cor:</span> {selected.cordao.cor}</li>
                          <li><span className="font-medium">Espessura x Comprimento:</span> {selected.cordao.espessura}x{selected.cordao.comprimento}cm</li>
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Spoiler for cordão material-only when tipo_saco id is 5 */}
                  {selected.tipo_saco_detail?.id === 5 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setCordaoExpanded(!cordaoExpanded)}
                        className="w-full flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded"
                      >
                        <span className="font-medium">Cordão</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`w-5 h-5 transform transition-transform ${
                            cordaoExpanded ? 'rotate-180' : 'rotate-0'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {cordaoExpanded && selected.cordao_asa_torcida && (
                        <ul className="mt-2 pl-4 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                          <li><span className="font-medium">Cor:</span> {selected.cordao_asa_torcida.cor}</li>
                          <li><span className="font-medium">Material:</span> {selected.cordao_asa_torcida.material}</li>
                        </ul>
                      )}
                    </div>
                  )}
                  
                  {/* Seção de Paletes e Caixas */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Gestão de Paletes
                      </h4>
                      {paletes.length > 0 && (
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={expandAllPaletes}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
                          >
                            Expandir todas
                          </button>
                          <button
                            type="button"
                            onClick={collapseAllPaletes}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors"
                          >
                            Recolher todas
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaletesExpanded(!paletesExpanded)}
                      className="w-full flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="font-semibold text-blue-900 dark:text-blue-100">Paletes e Caixas</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                          {paletes.length}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-blue-600 dark:text-blue-400 transform transition-transform duration-200 ${
                          paletesExpanded ? 'rotate-180' : 'rotate-0'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {paletesExpanded && (
                      <div className="mt-4 space-y-4">
                        {loadingPaletes ? (
                          <div className="flex items-center justify-center py-8">
                            <svg className="animate-spin w-6 h-6 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-gray-600 dark:text-gray-400">Carregando paletes...</span>
                          </div>
                        ) : paletes.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma palete encontrada para esta OP</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">As paletes aparecerão aqui quando forem criadas</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {paletes.map((palete) => {
                              const isExpanded = expandedPaletes.has(palete.id);
                              return (
                                <div key={palete.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                  {/* Header da Palete */}
                                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                          </svg>
                                        </div>
                                        <div>
                                          <h5 className="font-semibold text-gray-900 dark:text-white">{palete.numero_palete}</h5>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Criada em {new Date(palete.data_criacao).toLocaleDateString('pt-BR')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {palete.lugar_info && (
                                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {palete.lugar_info.display}
                                          </span>
                                        )}
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                                          {palete.total_caixas} caixas
                                        </span>
                                        <button
                                          onClick={() => togglePaleteExpansion(palete.id)}
                                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        >
                                          <svg
                                            className={`w-5 h-5 transform transition-transform duration-200 ${
                                              isExpanded ? 'rotate-180' : 'rotate-0'
                                            }`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Conteúdo expansível da Palete */}
                                  {isExpanded && (
                                    <div className="p-4">
                                      {/* Informações da Palete */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Criado por</dt>
                                          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {palete.created_by_name || 'N/A'}
                                          </dd>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Atualizado por</dt>
                                          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {palete.updated_by_name || 'N/A'}
                                          </dd>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Quantidade</dt>
                                          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {palete.total_quantidade?.toLocaleString('pt-BR') || '0'} un.
                                          </dd>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Peso Total</dt>
                                          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {typeof palete.peso_total === 'number' 
                                              ? `${palete.peso_total.toFixed(2)} kg` 
                                              : palete.peso_total || 'N/A'}
                                          </dd>
                                        </div>
                                      </div>
                                      
                                      {/* Lista de Caixas */}
                                      {palete.caixas && palete.caixas.length > 0 && (
                                        <div>
                                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            Caixas ({palete.caixas.length})
                                          </h6>
                                          <div className="space-y-2">
                                            {palete.caixas.map((caixa: any) => (
                                              <div key={caixa.id} className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                      </svg>
                                                    </div>
                                                    <div>
                                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Caixa #{caixa.id}
                                                      </p>
                                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {caixa.quantidade?.toLocaleString('pt-BR')} un. • {caixa.medida}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                      Criada em {new Date(caixa.data_criacao).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    {caixa.observacoes && (
                                                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
                                                        "{caixa.observacoes}"
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Observações da Palete */}
                                      {palete.observacoes && (
                                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            <span className="font-medium">Observações:</span> {palete.observacoes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Right: Mockup Preview */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Mockup PDF
                      </h4>
                      <button
                        onClick={triggerMockupUpdate}
                        disabled={mockupUpdating}
                        className={`p-2 rounded-full transition-colors ${
                          mockupUpdating 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={mockupUpdating ? "Atualizando..." : "Atualizar mockup"}
                      >
                        {mockupUpdating ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {mockupError ? (
                      <div className="flex flex-col items-center justify-center h-[400px] lg:h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                          Erro ao carregar mockup
                        </p>
                        <button 
                          onClick={triggerMockupUpdate}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Gerar mockup
                        </button>
                      </div>
                    ) : mockupPdfUrl ? (
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <object
                          data={mockupPdfUrl}
                          type="application/pdf"
                          className="w-full h-[400px] lg:h-[500px]"
                        >
                          <div className="flex flex-col items-center justify-center h-[400px] lg:h-[500px] bg-gray-100 dark:bg-gray-800 p-6">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                              PDF não suportado no seu navegador
                            </p>
                            <a 
                              href={mockupPdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Abrir em nova aba
                            </a>
                          </div>
                        </object>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] lg:h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {mockupLoading ? (
                          <>
                            <svg className="animate-spin w-8 h-8 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400">Carregando mockup...</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                              Nenhum mockup disponível
                            </p>
                            <button 
                              onClick={triggerMockupUpdate}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Gerar mockup
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        console.log("🚀 Navegando para edição com dados:", selected);
                        navigate('/ops/criar', { state: selected });
                      }}
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg shadow-sm transition-colors font-medium"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {message && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                Confirmar Exclusão
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tem a certeza que quer apagar a OP <strong>"{selected?.nome_trabalho || `OP ${selected?.id}`}"</strong>?
                </p>
                <p className="text-xs text-red-500 mt-2">
                  Esta ação não pode ser desfeita e irá apagar todos os dados relacionados.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleting ? 'A apagar...' : 'Apagar OP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gerir;