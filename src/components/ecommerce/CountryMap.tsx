// Componente alternativo para mapa de países - compatível com mobile
import React, { useState, useEffect } from "react";

// Define the component props
interface CountryMapProps {
  mapColor?: string;
}

interface CountryData {
  name: string;
  code: string;
  total_ops: number;
  percentage: number;
  customers: number;
}

// Mapeamento de códigos de país para emojis de bandeiras
const countryFlags: { [key: string]: string } = {
  'PT': '🇵🇹',
  'ES': '🇪🇸',
  'FR': '🇫🇷',
  'DE': '🇩🇪',
  'IT': '🇮🇹',
  'GB': '🇬🇧',
  'NL': '🇳🇱',
  'BE': '🇧🇪',
  'CH': '🇨🇭',
  'DK': '🇩🇰',
  'LU': '🇱🇺',
  'BG': '🇧🇬',
  'EL': '🇬🇷',
  'MX': '🇲🇽',
  'AO': '🇦🇴',
  'AD': '🇦🇩',
};

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estilos CSS para scrollbar personalizado
  const scrollbarStyles = `
    .country-list::-webkit-scrollbar {
      width: 6px;
    }
    .country-list::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 3px;
    }
    .country-list::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
    .country-list::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
    .dark .country-list::-webkit-scrollbar-track {
      background: #374151;
    }
    .dark .country-list::-webkit-scrollbar-thumb {
      background: #6b7280;
    }
    .dark .country-list::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `;

  useEffect(() => {
    const fetchCountriesData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        
        if (!token) {
          setError("Token de autenticação não encontrado");
          return;
        }

        const response = await fetch("/api/op/ordens-producao/countries-stats/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setCountries(data);
      } catch (err) {
        console.error("Erro ao buscar dados dos países:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchCountriesData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="relative w-full h-[250px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="animate-spin w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Carregando dados...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="relative w-full h-[250px] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-700 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Erro ao carregar dados
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <style>{scrollbarStyles}</style>
      {/* Placeholder visual para o mapa */}
      <div className="relative w-full h-[250px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Países com Mais OPs
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {countries.length} países com ordens de produção
          </p>
        </div>
        
        {/* Pontos com bandeiras no mapa */}
        {countries.map((country, index) => (
          <div
            key={country.name}
            className="absolute w-8 h-8 bg-white rounded-full border-2 border-blue-500 shadow-lg flex items-center justify-center text-sm animate-pulse"
            style={{
              left: `${20 + (index * 20)}%`,
              top: `${30 + (index * 15)}%`,
            }}
            title={`${country.name}: ${country.total_ops} OPs (${country.percentage}%)`}
          >
            {countryFlags[country.code] || '🏳️'}
          </div>
        ))}
      </div>
      
      {/* Lista de países com scroll */}
      <div 
        className="w-full mt-4 max-h-[400px] overflow-y-auto country-list"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--scrollbar-thumb, #d1d5db) var(--scrollbar-track, #f3f4f6)',
        }}
      >
        <div className="space-y-3 pr-2">
          {countries.map((country) => (
            <div key={country.name} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center text-lg">
                  {countryFlags[country.code] || '🏳️'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">
                    {country.name}
                  </p>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {country.total_ops.toLocaleString()} OPs
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${country.percentage}%` }}
                  />
                </div>
                <p className="font-medium text-gray-800 dark:text-white text-sm w-8 text-right">
                  {country.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountryMap;
