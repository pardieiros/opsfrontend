import { useState, useEffect } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import UrgentOpsWidget from "../../components/dashboard/UrgentOpsWidget";
import StaleOpsWidget from "../../components/dashboard/StaleOpsWidget";
import EmployeeOpsReportWidget from "../../components/dashboard/EmployeeOpsReportWidget";
import PrintingMachinesWidget from "../../components/dashboard/PrintingMachinesWidget";
import WidgetConfigModal from "../../components/dashboard/WidgetConfigModal";
import PageMeta from "../../components/common/PageMeta";

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
}

export default function Home() {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Configuração padrão dos widgets
  const defaultWidgets: WidgetConfig[] = [
    {
      id: 'ecommerce-metrics',
      name: 'Métricas de Vendas',
      description: 'Mostra métricas gerais de vendas e receita',
      enabled: true,
      order: 1
    },
    {
      id: 'monthly-sales-chart',
      name: 'Gráfico de Vendas Mensais',
      description: 'Gráfico de linha com vendas dos últimos meses',
      enabled: true,
      order: 2
    },
    {
      id: 'monthly-target',
      name: 'Meta Mensal',
      description: 'Progresso em relação à meta mensal',
      enabled: true,
      order: 3
    },
    {
      id: 'statistics-chart',
      name: 'Estatísticas Gerais',
      description: 'Gráfico com estatísticas detalhadas',
      enabled: true,
      order: 4
    },
    {
      id: 'demographic-card',
      name: 'Demografia',
      description: 'Informações demográficas dos clientes',
      enabled: true,
      order: 5
    },
    {
      id: 'recent-orders',
      name: 'Pedidos Recentes',
      description: 'Lista dos pedidos mais recentes',
      enabled: true,
      order: 6
    },
    {
      id: 'urgent-ops',
      name: 'OPs Urgentes',
      description: 'OPs não finalizadas com prazo próximo (2 dias)',
      enabled: false,
      order: 7
    },
    {
      id: 'stale-ops',
      name: 'OPs Não Atualizadas',
      description: 'OPs que não foram atualizadas há mais de 3 dias',
      enabled: false,
      order: 8
    },
    {
      id: 'employee-ops-report',
      name: 'Relatório de OPs por Empregado',
      description: 'Relatório de OPs criadas por empregado em uma data específica',
      enabled: false,
      order: 9
    },
    {
      id: 'printing-machines',
      name: 'Estado das Máquinas',
      description: 'Mostra o estado atual das máquinas de impressão (tamanho, cor, progresso)',
      enabled: true,
      order: 10
    }
  ];

  useEffect(() => {
    // Carregar configuração salva do localStorage
    const savedConfig = localStorage.getItem('dashboard-widget-config');
    if (savedConfig) {
      try {
        setWidgetConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Erro ao carregar configuração dos widgets:', error);
        setWidgetConfig(defaultWidgets);
      }
    } else {
      setWidgetConfig(defaultWidgets);
    }
  }, []);

  const handleSaveWidgetConfig = (newConfig: WidgetConfig[]) => {
    setWidgetConfig(newConfig);
    localStorage.setItem('dashboard-widget-config', JSON.stringify(newConfig));
  };

  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.enabled) return null;

    switch (widget.id) {
      case 'ecommerce-metrics':
        return <EcommerceMetrics key={widget.id} />;
      case 'monthly-sales-chart':
        return <MonthlySalesChart key={widget.id} />;
      case 'monthly-target':
        return <MonthlyTarget key={widget.id} />;
      case 'statistics-chart':
        return <StatisticsChart key={widget.id} />;
      case 'demographic-card':
        return <DemographicCard key={widget.id} />;
      case 'recent-orders':
        return <RecentOrders key={widget.id} />;
      case 'urgent-ops':
        return <UrgentOpsWidget key={widget.id} />;
      case 'stale-ops':
        return <StaleOpsWidget key={widget.id} />;
      case 'employee-ops-report':
        return <EmployeeOpsReportWidget key={widget.id} />;
      case 'printing-machines':
        return <PrintingMachinesWidget key={widget.id} />;
      default:
        return null;
    }
  };

  const getWidgetLayout = (widget: WidgetConfig) => {
    switch (widget.id) {
      case 'ecommerce-metrics':
        return 'col-span-12 space-y-6 xl:col-span-7';
      case 'monthly-sales-chart':
        return 'col-span-12 space-y-6 xl:col-span-7';
      case 'monthly-target':
        return 'col-span-12 xl:col-span-5';
      case 'statistics-chart':
        return 'col-span-12';
      case 'demographic-card':
        return 'col-span-12 xl:col-span-5';
      case 'recent-orders':
        return 'col-span-12 xl:col-span-7';
      case 'urgent-ops':
        return 'col-span-12 xl:col-span-6';
      case 'stale-ops':
        return 'col-span-12 xl:col-span-6';
      case 'employee-ops-report':
        return 'col-span-12';
      case 'printing-machines':
        return 'col-span-12 xl:col-span-6';
      default:
        return 'col-span-12';
    }
  };

  const enabledWidgets = widgetConfig
    .filter(widget => widget.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <PageMeta
        title="Dashboard - Portal do Trabalhador"
        description="Dashboard principal com métricas e informações importantes"
      />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visão geral das métricas e informações importantes
            </p>
          </div>
          
          {/* Botão de configuração */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Configurar Dashboard"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Configurar
            </span>
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {enabledWidgets.map((widget) => (
            <div key={widget.id} className={getWidgetLayout(widget)}>
              {renderWidget(widget)}
            </div>
          ))}
        </div>

        {enabledWidgets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum widget ativo
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Configure os widgets do seu dashboard para começar
            </p>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configurar Dashboard
            </button>
          </div>
        )}
      </div>

      <WidgetConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveWidgetConfig}
        currentWidgets={widgetConfig}
      />
    </>
  );
}
