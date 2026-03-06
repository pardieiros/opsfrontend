import React, { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ConfirmModal from "../../components/ui/ConfirmModal";
// @ts-ignore: no declaration file for module '../../serviceapi/api'
import {
  getMaquinas,
  createMaquina,
  updateMaquina,
  deleteMaquina,
  getEstadosImpressaoAtivos,
  createEstadoImpressao,
  finalizarEstadoImpressao,
  atualizarQuantidadeProduzida,
  getTamanhos,
  getCores,
  getGramagensByTamanhoCor,
  getTipoSacos,
} from "../../serviceapi/api";

interface Maquina {
  id: number;
  nome: string;
  descricao: string;
  ativa: boolean;
  created_by_name: string | null;
  updated_by_name: string | null;
  created_on: string;
  updated_on: string;
  estado_atual: EstadoImpressao | null;
}

interface EstadoImpressao {
  id: number;
  maquina: number;
  maquina_nome: string;
  tamanho: number;
  tamanho_dimensoes: string;
  cor: number;
  cor_nome: string;
  gramagem_por_cor: number;
  gramagem: string;
  peso: string | null;
  quantidade_produzida: number;
  quantidade_planejada: number | null;
  data_inicio: string;
  data_fim: string | null;
  observacoes: string;
  is_active: boolean;
  progress_percentage: number;
}

interface Tamanho {
  id: number;
  grupo: string;
  largura: number | null;
  fole: number | null;
  altura: number | null;
  tipo_saco: number;
  tipo_saco_nome: string;
  gramagens: GramagemPorCor[];
}

interface TipoSaco {
  id: number;
  nome: string;
}

interface Cor {
  id: number;
  nome: string;
}

interface GramagemPorCor {
  id: number;
  cor: number;
  cor_nome: string;
  gramagem: number;
  peso: number | null;
  tamanho: number;
}

export default function GestaoImpressao() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [tipoSacos, setTipoSacos] = useState<TipoSaco[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para criar/editar máquina
  const [showMaquinaModal, setShowMaquinaModal] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<Maquina | null>(null);
  const [maquinaForm, setMaquinaForm] = useState({
    nome: "",
    descricao: "",
    ativa: true,
  });

  // Estados para criar estado de impressão
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [selectedMaquina, setSelectedMaquina] = useState<number | null>(null);
  const [estadoForm, setEstadoForm] = useState({
    tipo_saco: "",
    grupo: "",
    tamanho: "",
    cor: "",
    gramagem_por_cor: "",
    quantidade_planejada: "",
    observacoes: "",
  });
  const [availableGramagens, setAvailableGramagens] = useState<GramagemPorCor[]>([]);

  // Estados para modal de confirmação
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    maquinaId: number | null;
    maquinaNome: string;
  }>({
    isOpen: false,
    maquinaId: null,
    maquinaNome: "",
  });

  // Estados para atualizar quantidade
  const [quantidadeModal, setQuantidadeModal] = useState<{
    isOpen: boolean;
    estadoId: number | null;
    quantidadeAtual: number;
    quantidadeNova: string;
  }>({
    isOpen: false,
    estadoId: null,
    quantidadeAtual: 0,
    quantidadeNova: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") || "";
      
      const [maquinasData, tamanhosData, tipoSacosData, coresData] = await Promise.all([
        getMaquinas(token),
        getTamanhos(token),
        getTipoSacos(token),
        getCores(token),
      ]);

      setMaquinas(maquinasData);
      setTamanhos(tamanhosData);
      setTipoSacos(tipoSacosData);
      setCores(coresData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaquina = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken") || "";
      const newMaquina = await createMaquina(maquinaForm, token);
      setMaquinas([...maquinas, newMaquina]);
      setShowMaquinaModal(false);
      setMaquinaForm({ nome: "", descricao: "", ativa: true });
    } catch (err) {
      console.error("Erro ao criar máquina:", err);
      alert("Erro ao criar máquina. Tente novamente.");
    }
  };

  const handleEditMaquina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaquina) return;

    try {
      const token = localStorage.getItem("accessToken") || "";
      const updatedMaquina = await updateMaquina(editingMaquina.id, maquinaForm, token);
      setMaquinas(maquinas.map(m => m.id === editingMaquina.id ? updatedMaquina : m));
      setShowMaquinaModal(false);
      setEditingMaquina(null);
      setMaquinaForm({ nome: "", descricao: "", ativa: true });
    } catch (err) {
      console.error("Erro ao editar máquina:", err);
      alert("Erro ao editar máquina. Tente novamente.");
    }
  };

  const handleDeleteMaquina = async () => {
    if (!deleteModal.maquinaId) return;

    try {
      const token = localStorage.getItem("accessToken") || "";
      await deleteMaquina(deleteModal.maquinaId, token);
      setMaquinas(maquinas.filter(m => m.id !== deleteModal.maquinaId));
      setDeleteModal({ isOpen: false, maquinaId: null, maquinaNome: "" });
    } catch (err) {
      console.error("Erro ao deletar máquina:", err);
      alert("Erro ao deletar máquina. Tente novamente.");
    }
  };

  const openEditMaquina = (maquina: Maquina) => {
    setEditingMaquina(maquina);
    setMaquinaForm({
      nome: maquina.nome,
      descricao: maquina.descricao,
      ativa: maquina.ativa,
    });
    setShowMaquinaModal(true);
  };

  const openDeleteModal = (maquina: Maquina) => {
    setDeleteModal({
      isOpen: true,
      maquinaId: maquina.id,
      maquinaNome: maquina.nome,
    });
  };

  const openEstadoModal = (maquinaId: number) => {
    setSelectedMaquina(maquinaId);
    setEstadoForm({
      tipo_saco: "",
      grupo: "",
      tamanho: "",
      cor: "",
      gramagem_por_cor: "",
      quantidade_planejada: "",
      observacoes: "",
    });
    setAvailableGramagens([]);
    setShowEstadoModal(true);
  };

  const handleTipoSacoChange = (tipoSacoId: string) => {
    setEstadoForm({
      ...estadoForm,
      tipo_saco: tipoSacoId,
      grupo: "",
      tamanho: "",
      cor: "",
      gramagem_por_cor: "",
    });
    setAvailableGramagens([]);
  };

  const handleGrupoChange = (grupo: string) => {
    setEstadoForm({
      ...estadoForm,
      grupo,
      tamanho: "",
      cor: "",
      gramagem_por_cor: "",
    });
    setAvailableGramagens([]);
  };

  const handleTamanhoChange = (tamanhoId: string) => {
    setEstadoForm({
      ...estadoForm,
      tamanho: tamanhoId,
      cor: "",
      gramagem_por_cor: "",
    });
    setAvailableGramagens([]);
  };

  const handleCorChange = (corId: string) => {
    setEstadoForm({
      ...estadoForm,
      cor: corId,
      gramagem_por_cor: "",
    });
    setAvailableGramagens([]);
  };

  const handleTamanhoCorChange = async () => {
    console.log('🔍 handleTamanhoCorChange chamada');
    console.log('📊 Estado atual:', { tamanho: estadoForm.tamanho, cor: estadoForm.cor });
    
    if (!estadoForm.tamanho || !estadoForm.cor) {
      console.log('❌ Tamanho ou cor não selecionados, limpando gramagens');
      setAvailableGramagens([]);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || "";
      console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
      console.log('📡 Chamando API com:', { 
        tamanho: parseInt(estadoForm.tamanho), 
        cor: parseInt(estadoForm.cor) 
      });
      
      const gramagens = await getGramagensByTamanhoCor(
        parseInt(estadoForm.tamanho),
        parseInt(estadoForm.cor),
        token
      );
      
      console.log('✅ Gramagens recebidas:', gramagens);
      if (gramagens.length === 0) {
        console.log('⚠️ Nenhuma gramagem encontrada para tamanho', estadoForm.tamanho, 'e cor', estadoForm.cor);
      }
      setAvailableGramagens(gramagens);
    } catch (err) {
      console.error("❌ Erro ao buscar gramagens:", err);
      setAvailableGramagens([]);
    }
  };

  useEffect(() => {
    handleTamanhoCorChange();
  }, [estadoForm.tamanho, estadoForm.cor]);

  const handleCreateEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaquina) return;

    try {
      const token = localStorage.getItem("accessToken") || "";
      await createEstadoImpressao({
        maquina: selectedMaquina,
        tamanho: parseInt(estadoForm.tamanho),
        cor: parseInt(estadoForm.cor),
        gramagem_por_cor: parseInt(estadoForm.gramagem_por_cor),
        quantidade_planejada: estadoForm.quantidade_planejada ? parseInt(estadoForm.quantidade_planejada) : null,
        observacoes: estadoForm.observacoes,
      }, token);

      await loadData(); // Recarregar dados para atualizar o estado atual das máquinas
      setShowEstadoModal(false);
      setSelectedMaquina(null);
    } catch (err) {
      console.error("Erro ao criar estado de impressão:", err);
      alert("Erro ao criar estado de impressão. Tente novamente.");
    }
  };

  const handleFinalizarEstado = async (estadoId: number) => {
    try {
      const token = localStorage.getItem("accessToken") || "";
      await finalizarEstadoImpressao(estadoId, token);
      await loadData(); // Recarregar dados
    } catch (err) {
      console.error("Erro ao finalizar estado:", err);
      alert("Erro ao finalizar estado de impressão. Tente novamente.");
    }
  };

  const openQuantidadeModal = (estado: EstadoImpressao) => {
    setQuantidadeModal({
      isOpen: true,
      estadoId: estado.id,
      quantidadeAtual: estado.quantidade_produzida,
      quantidadeNova: estado.quantidade_produzida.toString(),
    });
  };

  const handleAtualizarQuantidade = async () => {
    if (!quantidadeModal.estadoId) return;

    try {
      const token = localStorage.getItem("accessToken") || "";
      await atualizarQuantidadeProduzida(
        quantidadeModal.estadoId,
        parseInt(quantidadeModal.quantidadeNova),
        token
      );
      await loadData(); // Recarregar dados
      setQuantidadeModal({ isOpen: false, estadoId: null, quantidadeAtual: 0, quantidadeNova: "" });
    } catch (err) {
      console.error("Erro ao atualizar quantidade:", err);
      alert("Erro ao atualizar quantidade. Tente novamente.");
    }
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-gray-400";
  };

  const formatDimensoes = (dimensoes: string): string => {
    return dimensoes.replace(/×/g, " × ");
  };

  // Função para formatar números (removendo casas decimais .00)
  const formatNumber = (value: number | string | null): string => {
    if (value == null) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Number.isInteger(num) ? num.toString() : num.toString();
  };

  // Filtrar tamanhos por tipo de saco e grupo
  const getFilteredTamanhos = () => {
    if (!estadoForm.tipo_saco) return [];
    
    let filtered = tamanhos.filter(t => t.tipo_saco === parseInt(estadoForm.tipo_saco));
    
    if (estadoForm.grupo) {
      filtered = filtered.filter(t => t.grupo === estadoForm.grupo);
    }
    
    return filtered;
  };

  // Obter grupos únicos para o tipo de saco selecionado
  const getGrupoOptions = () => {
    if (!estadoForm.tipo_saco) return [];
    
    const filteredTamanhos = tamanhos.filter(t => t.tipo_saco === parseInt(estadoForm.tipo_saco));
    return Array.from(new Set(filteredTamanhos.map(t => t.grupo))).sort();
  };

  if (loading) {
    return <div className="p-4">Carregando gestão de impressão…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Erro: {error}</div>;
  }

  return (
    <>
      <PageMeta title="Gestão de Impressão" description="Gerir máquinas e estados de impressão" />
      <PageBreadcrumb pageTitle="Gestão de Impressão" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Máquinas de Impressão</h2>
          <button
            onClick={() => setShowMaquinaModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            + Nova Máquina
          </button>
        </div>

        {maquinas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma máquina cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maquinas.map((maquina) => (
              <div key={maquina.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{maquina.nome}</h3>
                    {maquina.descricao && (
                      <p className="text-sm text-gray-600 mt-1">{maquina.descricao}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditMaquina(maquina)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => openDeleteModal(maquina)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    maquina.ativa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {maquina.ativa ? "Ativa" : "Inativa"}
                  </span>
                </div>

                {maquina.estado_atual ? (
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium text-gray-800">Estado Atual</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openQuantidadeModal(maquina.estado_atual!)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Atualizar Qtd
                        </button>
                        <button
                          onClick={() => handleFinalizarEstado(maquina.estado_atual!.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Finalizar
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Tamanho:</span> {formatDimensoes(maquina.estado_atual.tamanho_dimensoes)}
                      </div>
                      <div>
                        <span className="font-medium">Cor:</span> {maquina.estado_atual.cor_nome}
                      </div>
                      <div>
                        <span className="font-medium">Gramagem:</span> {maquina.estado_atual.gramagem} g/m²
                      </div>
                      <div>
                        <span className="font-medium">Produzido:</span> {maquina.estado_atual.quantidade_produzida}
                        {maquina.estado_atual.quantidade_planejada && (
                          <span> / {maquina.estado_atual.quantidade_planejada}</span>
                        )}
                      </div>
                      
                      {maquina.estado_atual.quantidade_planejada && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progresso</span>
                            <span>{Math.round(maquina.estado_atual.progress_percentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(maquina.estado_atual.progress_percentage)}`}
                              style={{ width: `${Math.min(100, maquina.estado_atual.progress_percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 border border-dashed border-gray-300 text-center">
                    <p className="text-gray-500 text-sm mb-3">Máquina parada</p>
                    <button
                      onClick={() => openEstadoModal(maquina.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Iniciar Impressão
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para criar/editar máquina */}
      {showMaquinaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingMaquina ? "Editar Máquina" : "Nova Máquina"}
            </h3>
            <form onSubmit={editingMaquina ? handleEditMaquina : handleCreateMaquina}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Máquina
                </label>
                <input
                  type="text"
                  value={maquinaForm.nome}
                  onChange={(e) => setMaquinaForm({ ...maquinaForm, nome: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={maquinaForm.descricao}
                  onChange={(e) => setMaquinaForm({ ...maquinaForm, descricao: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={maquinaForm.ativa}
                    onChange={(e) => setMaquinaForm({ ...maquinaForm, ativa: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Máquina ativa</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMaquinaModal(false);
                    setEditingMaquina(null);
                    setMaquinaForm({ nome: "", descricao: "", ativa: true });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingMaquina ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para criar estado de impressão */}
      {showEstadoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Iniciar Impressão</h3>
            <form onSubmit={handleCreateEstado}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Saco
                </label>
                <select
                  value={estadoForm.tipo_saco}
                  onChange={(e) => handleTipoSacoChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um tipo de saco</option>
                  {tipoSacos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
              </div>

              {estadoForm.tipo_saco && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grupo
                  </label>
                  <select
                    value={estadoForm.grupo}
                    onChange={(e) => handleGrupoChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione um grupo</option>
                    {getGrupoOptions().map((grupo) => (
                      <option key={grupo} value={grupo}>
                        {grupo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {estadoForm.grupo && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamanho
                  </label>
                  <select
                    value={estadoForm.tamanho}
                    onChange={(e) => handleTamanhoChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione um tamanho</option>
                    {getFilteredTamanhos().map((tamanho) => (
                      <option key={tamanho.id} value={tamanho.id}>
                        {formatNumber(tamanho.largura)}×{formatNumber(tamanho.fole)}×{formatNumber(tamanho.altura)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {estadoForm.tamanho && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor
                  </label>
                  <select
                    value={estadoForm.cor}
                    onChange={(e) => handleCorChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione uma cor</option>
                    {cores.map((cor) => (
                      <option key={cor.id} value={cor.id}>
                        {cor.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {estadoForm.cor && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gramagem
                  </label>
                  <select
                    value={estadoForm.gramagem_por_cor}
                    onChange={(e) => setEstadoForm({ ...estadoForm, gramagem_por_cor: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={availableGramagens.length === 0}
                  >
                    <option value="">
                      {availableGramagens.length === 0 ? "Nenhuma gramagem disponível para esta combinação" : "Selecione uma gramagem"}
                    </option>
                    {availableGramagens.map((gramagem) => (
                      <option key={gramagem.id} value={gramagem.id}>
                        {gramagem.gramagem} g/m² {gramagem.peso && `(${gramagem.peso}g)`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Planejada (opcional)
                </label>
                <input
                  type="number"
                  value={estadoForm.quantidade_planejada}
                  onChange={(e) => setEstadoForm({ ...estadoForm, quantidade_planejada: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={estadoForm.observacoes}
                  onChange={(e) => setEstadoForm({ ...estadoForm, observacoes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEstadoModal(false);
                    setSelectedMaquina(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Iniciar Impressão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para atualizar quantidade */}
      {quantidadeModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Atualizar Quantidade Produzida</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade Atual: {quantidadeModal.quantidadeAtual}
              </label>
              <input
                type="number"
                value={quantidadeModal.quantidadeNova}
                onChange={(e) => setQuantidadeModal({ ...quantidadeModal, quantidadeNova: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setQuantidadeModal({ isOpen: false, estadoId: null, quantidadeAtual: 0, quantidadeNova: "" })}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAtualizarQuantidade}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação para deletar máquina */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, maquinaId: null, maquinaNome: "" })}
        onConfirm={handleDeleteMaquina}
        title="Confirmar Remoção"
        message={`Tem certeza que deseja remover a máquina "${deleteModal.maquinaNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
}
