import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ConfirmModal from "../../components/ui/ConfirmModal";
// @ts-ignore: no declaration file for module '../../serviceapi/api'
import { getTamanhos, deleteTamanho, getTipoSacos } from "../../serviceapi/api";

// Formata números, removendo casas decimais .00
export const formatNumber = (value: number | string | null): string => {
  if (value == null) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return Number.isInteger(num) ? num.toString() : num.toString();
};

interface GramagemPorCor {
  cor: number;
  cor_nome: string;
  gramagem: number | null;
  peso: number | null;
}

interface Tamanho {
  id: number;
  tipo_saco: number; // ID do tipo de saco
  tipo_saco_nome: string; // Nome do tipo de saco
  grupo: string;
  largura: number | null;
  fole: number | null;
  altura: number | null;
  usa_badana: boolean;
  gramagens: GramagemPorCor[];
}

export default function ConsultarTamanhos() {
  const navigate = useNavigate();
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [tiposSaco, setTiposSaco] = useState<{ id: number; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTipoSaco, setSelectedTipoSaco] = useState<string>("");
  const [selectedGrupo, setSelectedGrupo] = useState<string>("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    tamanhoId: number | null;
    tamanhoInfo: string;
  }>({
    isOpen: false,
    tamanhoId: null,
    tamanhoInfo: ""
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const [tamanhosData, tiposSacoData] = await Promise.all([
          getTamanhos(token),
          getTipoSacos(token)
        ]);
        console.log("getTamanhos response:", tamanhosData);
        console.log("getTipoSacos response:", tiposSacoData);
        setTamanhos(tamanhosData);
        setTiposSaco(tiposSacoData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filtra pelos termos de busca e filtros selecionados
  const filtered = tamanhos.filter((t) => {
    const dims = `${formatNumber(t.largura)}×${formatNumber(t.fole)}×${formatNumber(t.altura)}`.toLowerCase();
    const tipo = t.tipo_saco_nome;
    
    const searchText = `${dims}`.toLowerCase();
    const matchesSearch = searchText.includes(searchTerm.toLowerCase());
    const matchesTipo = !selectedTipoSaco || tipo === selectedTipoSaco;
    const matchesGrupo = !selectedGrupo || t.grupo === selectedGrupo;
    
    return matchesSearch && matchesTipo && matchesGrupo;
  });

  const grouped = filtered.reduce((acc: Record<string, Record<string, Tamanho[]>>, t) => {
    const tipo = t.tipo_saco_nome;
    if (!acc[tipo]) acc[tipo] = {};
    if (!acc[tipo][t.grupo]) acc[tipo][t.grupo] = [];
    acc[tipo][t.grupo].push(t);
    return acc;
  }, {});

  // Obter tipos de saco únicos para o filtro (usando dados do backend)
  const tiposSacoNomes = tiposSaco.map(t => t.nome).sort();

  // Obter grupos únicos para o filtro
  const grupos = Array.from(new Set(tamanhos.map(t => t.grupo))).sort();

  const handleDelete = async () => {
    if (!deleteModal.tamanhoId) return;
    
    try {
      const token = localStorage.getItem("accessToken") || "";
      await deleteTamanho(deleteModal.tamanhoId, token);
      
      // Atualizar a lista removendo o item deletado
      setTamanhos(prev => prev.filter(t => t.id !== deleteModal.tamanhoId));
      
      // Fechar modal
      setDeleteModal({ isOpen: false, tamanhoId: null, tamanhoInfo: "" });
    } catch (error) {
      console.error("Erro ao deletar tamanho:", error);
      alert("Erro ao deletar tamanho. Tente novamente.");
    }
  };

  const openDeleteModal = (tamanho: Tamanho) => {
    const dims = `${formatNumber(tamanho.largura)}×${formatNumber(tamanho.fole)}×${formatNumber(tamanho.altura)}`;
    const tipo = tamanho.tipo_saco_nome;
    
    setDeleteModal({
      isOpen: true,
      tamanhoId: tamanho.id,
      tamanhoInfo: `${dims} (${tipo} - ${tamanho.grupo})`
    });
  };

  if (loading) {
    return <div className="p-4">Carregando tamanhos…</div>;
  }

  return (
    <>
      <PageMeta title="Consultar Tamanhos" description="Lista de tamanhos de sacos" />
      <PageBreadcrumb pageTitle="Consultar Tamanhos" />
      
      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pesquisar Dimensões
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: 32×11"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Saco
            </label>
            <select
              value={selectedTipoSaco}
              onChange={(e) => setSelectedTipoSaco(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os tipos</option>
              {tiposSacoNomes.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo
            </label>
            <select
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os grupos</option>
              {grupos.map((grupo) => (
                <option key={grupo} value={grupo}>
                  {grupo.charAt(0).toUpperCase() + grupo.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedTipoSaco("");
                setSelectedGrupo("");
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Tamanhos de Sacos</h2>
          <button
            onClick={() => navigate("/tamanhos/criar")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            + Novo Tamanho
          </button>
        </div>
        
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum tamanho encontrado com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([tipo, grupos]) => (
              <div key={tipo} className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">
                    {tipo}
                  </span>
                  Tipo de Saco
                </h2>
                <div className="space-y-6">
                  {Object.entries(grupos).map(([grupo, items]) => (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6" key={grupo}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-700 flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">
                            {grupo.charAt(0).toUpperCase() + grupo.slice(1)}
                          </span>
                          Grupo
                        </h3>
                        <span className="text-sm text-gray-500">
                          {items.length} tamanho{items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border border-gray-200 rounded-lg overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dimensões
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cores e Gramagem
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {items.map((t) => {
                              const dims = `${formatNumber(t.largura)}×${formatNumber(t.fole)}×${formatNumber(t.altura)}`;
                              return t.gramagens.map((g, idx) => {
                                const pesoText = g.peso ? ` - ${formatNumber(g.peso)}g` : '';
                                const colorText = `${g.cor_nome} ${formatNumber(g.gramagem)}g/m²${pesoText}`;
                                if (idx === 0) {
                                  return (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                      <td
                                        rowSpan={t.gramagens.length}
                                        className="px-6 py-4 align-middle text-center font-medium text-gray-900"
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-lg">{dims}</span>
                                          {t.usa_badana && (
                                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1">
                                              Badana
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900">{colorText}</td>
                                      <td
                                        rowSpan={t.gramagens.length}
                                        className="px-6 py-4 align-middle text-center"
                                      >
                                        <div className="flex space-x-2 justify-center">
                                          <button
                                            onClick={() => navigate(`/tamanhos/editar/${t.id}`)}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md text-sm transition-colors"
                                          >
                                            Editar
                                          </button>
                                          <button
                                            onClick={() => openDeleteModal(t)}
                                            className="bg-red-500 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-md text-sm transition-colors"
                                          >
                                            Apagar
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }
                                return (
                                  <tr key={`${t.id}-${idx}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">{colorText}</td>
                                  </tr>
                                );
                              });
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, tamanhoId: null, tamanhoInfo: "" })}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja apagar o tamanho "${deleteModal.tamanhoInfo}"? Esta ação não pode ser desfeita.`}
        confirmText="Apagar"
        cancelText="Cancelar"
        variant="danger"
             />
     </>
   );
}