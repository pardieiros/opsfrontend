// src/pages/Produtos/Gerir.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { fetchWithAuth } from '../../serviceapi/api';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Alert from '../../components/ui/alert/Alert';

interface TipoSaco {
  id: number;
  nome: string;
  descricao: string;
}

interface Atributo {
  id: number;
  nome: string;
  tipo_dado: string;
  opcoes: string[] | null;
  tipo_saco: number;
}

const GerirTiposSaco: React.FC = () => {
  // Estado para tipos de saco
  const [tipoSacos, setTipoSacos] = useState<TipoSaco[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [errorTipos, setErrorTipos] = useState<string | null>(null);

  // Estado para seleção de um tipo de saco
  const [selectedTipo, setSelectedTipo] = useState<TipoSaco | null>(null);

  // Estado para atributos do tipo selecionado
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(false);
  const [errorAttrs, setErrorAttrs] = useState<string | null>(null);

  // Formulário para criar novo TipoSaco
  const [novoNomeTipo, setNovoNomeTipo] = useState('');
  const [novaDescTipo, setNovaDescTipo] = useState('');
  const [creatingTipo, setCreatingTipo] = useState(false);
  const [createTipoError, setCreateTipoError] = useState<string | null>(null);

  // Formulário para criar novo Atributo
  const [novoNomeAttr, setNovoNomeAttr] = useState('');
  const [novoTipoDado, setNovoTipoDado] = useState('string');
  const [novasOpcoes, setNovasOpcoes] = useState(''); // JSON string or comma list
  const [creatingAttr, setCreatingAttr] = useState(false);
  const [createAttrError, setCreateAttrError] = useState<string | null>(null);

  // Estados para alertas
  const [alertConfig, setAlertConfig] = useState<{
    variant: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  // Limpar alerta automaticamente após 5 segundos
  useEffect(() => {
    if (alertConfig) {
      const timer = setTimeout(() => {
        setAlertConfig(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertConfig]);

  // Carrega tipos de saco
  useEffect(() => {
    async function loadTipos() {
      try {
        const res = await fetchWithAuth('/api/op/tipo-sacos/');
        if (!res.ok) throw new Error('Falha ao carregar tipos de saco');
        const data: TipoSaco[] = await res.json();
        console.log('Tipos de saco carregados:', data);
        setTipoSacos(data);
      } catch (err: any) {
        setErrorTipos(err.message);
      } finally {
        setLoadingTipos(false);
      }
    }
    loadTipos();
  }, []);


  // Função para carregar atributos de um tipo de saco específico
  const loadAttributes = async (tipoId: number) => {
    // Limpa atributos anteriores ao carregar novos
    setAtributos([]);
    setLoadingAttrs(true);
    setErrorAttrs(null);
    try {
      const res = await fetchWithAuth(
        `/api/op/atributos-tipo-saco/?tipo_saco=${tipoId}`
      );
      if (!res.ok) throw new Error('Falha ao carregar atributos');
      const data: Atributo[] = await res.json();
      // Filtra client-side apenas os atributos pertencentes ao tipo selecionado
      const filtered = data.filter(at => at.tipo_saco === tipoId);
      console.log(`Atributos filtrados para tipo ${tipoId}:`, filtered);
      setAtributos(filtered);
    } catch (err: any) {
      setErrorAttrs(err.message);
    } finally {
      setLoadingAttrs(false);
    }
  };

  // Handler para criar novo tipo de saco
  const handleCreateTipo = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingTipo(true);
    setCreateTipoError(null);
    setAlertConfig(null);
    try {
      const res = await fetchWithAuth('/api/op/tipo-sacos/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome: novoNomeTipo, descricao: novaDescTipo }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Erro ao criar tipo de saco');
      }
      const newTipo: TipoSaco = await res.json();
      setTipoSacos(prev => [...prev, newTipo]);
      setNovoNomeTipo('');
      setNovaDescTipo('');
      setAlertConfig({
        variant: "success",
        title: "Sucesso",
        message: "Tipo de saco criado com sucesso!"
      });
    } catch (err: any) {
      setCreateTipoError(err.message);
      setAlertConfig({
        variant: "error",
        title: "Erro",
        message: err.message
      });
    } finally {
      setCreatingTipo(false);
    }
  };

  // Handler para criar novo atributo
  const handleCreateAttr = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTipo) return;
    setCreatingAttr(true);
    setCreateAttrError(null);
    setAlertConfig(null);
    try {
      let opcoesArr: string[] | null = null;
      if (novoTipoDado === 'choice') {
        // tenta parse JSON, senão split por vírgula
        try {
          opcoesArr = JSON.parse(novasOpcoes);
        } catch {
          opcoesArr = novasOpcoes.split(',').map(s => s.trim());
        }
      }
      const res = await fetchWithAuth('/api/op/atributos-tipo-saco/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          tipo_saco: selectedTipo.id,
          nome: novoNomeAttr,
          tipo_dado: novoTipoDado,
          opcoes: opcoesArr,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Erro ao criar atributo');
      }
      const newAttr: Atributo = await res.json();
      setAtributos(prev => [...prev, newAttr]);
      setNovoNomeAttr('');
      setNovoTipoDado('string');
      setNovasOpcoes('');
      setAlertConfig({
        variant: "success",
        title: "Sucesso",
        message: "Atributo criado com sucesso!"
      });
    } catch (err: any) {
      setCreateAttrError(err.message);
      setAlertConfig({
        variant: "error",
        title: "Erro",
        message: err.message
      });
    } finally {
      setCreatingAttr(false);
    }
  };

  if (loadingTipos) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  if (errorTipos) return (
    <Alert variant="error" title="Erro" message={errorTipos} />
  );

  return (
    <>
      <PageMeta title="Gestão de Tipos de Saco" description="Gerir tipos de saco e seus atributos" />
      <PageBreadcrumb pageTitle="Gestão de Tipos de Saco" />
      
      {alertConfig && (
        <Alert variant={alertConfig.variant} title={alertConfig.title} message={alertConfig.message} />
      )}
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão de Tipos de Saco</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {tipoSacos.length} tipos Registados
          </div>
        </div>

              {/* Lista de Tipos de Saco */}
        <ComponentCard title="Tipos de Saco Existentes" desc={`${tipoSacos.length} tipos Registados`}>
          {tipoSacos.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum tipo de saco</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece criando o primeiro tipo de saco.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {tipoSacos.map(ts => (
                    <tr
                      key={ts.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                        selectedTipo?.id === ts.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => {
                        setSelectedTipo(ts);
                        loadAttributes(ts.id);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {ts.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {ts.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {selectedTipo?.id === ts.id ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Selecionado
                          </span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                            Selecionar
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>

        {/* Formulário para novo Tipo */}
        <ComponentCard title="Adicionar Novo Tipo de Saco" desc="Criar um novo tipo de saco no sistema">
          <form onSubmit={handleCreateTipo} className="space-y-4">
            {createTipoError && (
              <Alert variant="error" title="Erro" message={createTipoError} />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Tipo
                </label>
                <input
                  type="text"
                  value={novoNomeTipo}
                  onChange={e => setNovoNomeTipo(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Ex: Saco Asa Torcida"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={novaDescTipo}
                  onChange={e => setNovaDescTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Descrição detalhada do tipo"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingTipo}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingTipo ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    A criar...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Criar Tipo de Saco
                  </>
                )}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
      {/* Se um tipo estiver selecionado, mostra atributos */}
        {selectedTipo && (
          <>
            <ComponentCard 
              title={`Atributos de: ${selectedTipo.nome}`} 
              desc={`${atributos.length} atributos configurados`}
            >
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center text-sm text-blue-800 dark:text-blue-200">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>Tipo selecionado:</strong> {selectedTipo.nome} - {selectedTipo.descricao}
                  </span>
                </div>
              </div>
              {loadingAttrs ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : errorAttrs ? (
                <Alert variant="error" title="Erro" message={errorAttrs} />
              ) : atributos.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum atributo configurado</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Adicione atributos para personalizar este tipo de saco.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tipo de Dado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Opções
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {atributos.map(at => (
                        <tr key={at.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {at.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {at.tipo_dado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {(at.opcoes || []).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ComponentCard>

            {/* Formulário para novo atributo */}
            <ComponentCard title="Adicionar Atributo" desc="Criar um novo atributo para este tipo de saco">
              <form onSubmit={handleCreateAttr} className="space-y-4">
                {createAttrError && (
                  <Alert variant="error" title="Erro" message={createAttrError} />
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Atributo
                    </label>
                    <input
                      type="text"
                      value={novoNomeAttr}
                      onChange={e => setNovoNomeAttr(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Ex: Cor, Material, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Dado
                    </label>
                    <select
                      value={novoTipoDado}
                      onChange={e => setNovoTipoDado(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="string">Texto</option>
                      <option value="integer">Inteiro</option>
                      <option value="decimal">Decimal</option>
                      <option value="boolean">Booleano</option>
                      <option value="choice">Escolha</option>
                    </select>
                  </div>
                  {novoTipoDado === 'choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Opções (JSON ou vírgulas)
                      </label>
                      <input
                        type="text"
                        value={novasOpcoes}
                        onChange={e => setNovasOpcoes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder='["Opção 1", "Opção 2"] ou Opção 1, Opção 2'
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingAttr}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingAttr ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        A criar...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Criar Atributo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </ComponentCard>
          </>
        )}
    </>
  );
};

export default GerirTiposSaco;