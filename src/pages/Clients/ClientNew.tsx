import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, API_BASE } from '../../serviceapi/api';
import PageMeta from '../../components/common/PageMeta';

interface ClientFormData {
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
}

const ClientNew: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    nome2: '',
    email: '',
    phone: '',
    fax: '',
    contacto: '',
    address: '',
    morada: '',
    local: '',
    codpost: '',
    zona: '',
    pais: '',
    ncont: '',
    moeda: '',
    obs: '',
    obs2: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('O nome do cliente é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAuth(`${API_BASE}/clients/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao criar cliente');
      }

      const newClient = await response.json();
      navigate(`/clients/${newClient.id}`);
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err);
      setError(err.message || 'Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Novo Cliente - Portal do Trabalhador"
        description="Adicionar novo cliente"
      />
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Novo Cliente
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Adicionar um novo cliente ao sistema
            </p>
          </div>
          
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Voltar</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome * <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Nome do cliente"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome 2
                  </label>
                  <input
                    type="text"
                    name="nome2"
                    value={formData.nome2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Nome alternativo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="+351 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fax
                  </label>
                  <input
                    type="tel"
                    name="fax"
                    value={formData.fax}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="+351 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contacto
                  </label>
                  <input
                    type="text"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Nome do contacto"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Morada
                  </label>
                  <input
                    type="text"
                    name="morada"
                    value={formData.morada}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Rua, número"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Local
                  </label>
                  <input
                    type="text"
                    name="local"
                    value={formData.local}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="codpost"
                    value={formData.codpost}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="1234-567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zona
                  </label>
                  <input
                    type="text"
                    name="zona"
                    value={formData.zona}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Zona/Região"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    name="pais"
                    value={formData.pais}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Portugal"
                  />
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Informações Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Contribuinte
                  </label>
                  <input
                    type="text"
                    name="ncont"
                    value={formData.ncont}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Moeda
                  </label>
                  <input
                    type="text"
                    name="moeda"
                    value={formData.moeda}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="EUR"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Observações
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações
                  </label>
                  <textarea
                    name="obs"
                    value={formData.obs}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Observações gerais sobre o cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações 2
                  </label>
                  <textarea
                    name="obs2"
                    value={formData.obs2}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Criando...</span>
                  </div>
                ) : (
                  'Criar Cliente'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ClientNew; 