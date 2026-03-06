import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import { useState, useEffect } from "react";

interface StatisticsData {
  monthly_ops: number[];
  monthly_quantities: number[];
  current_year: number;
}

export default function StatisticsChart() {
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatisticsData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        
        if (!token) {
          setError("Token de autenticação não encontrado");
          return;
        }

        const response = await fetch("/api/op/ordens-producao/statistics-chart/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setStatisticsData(data);
      } catch (err) {
        console.error("Erro ao buscar dados de estatísticas:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchStatisticsData();
  }, []);

  const options: ApexOptions = {
    legend: {
      show: false, // Hide legend
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"], // Define line colors
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line", // Set the chart type to 'line'
      toolbar: {
        show: false, // Hide chart toolbar
      },
    },
    stroke: {
      curve: "straight", // Define the line style (straight, smooth, or step)
      width: [2, 2], // Line width for each dataset
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0, // Size of the marker points
      strokeColors: "#fff", // Marker border color
      strokeWidth: 2,
      hover: {
        size: 6, // Marker size on hover
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false, // Hide grid lines on x-axis
        },
      },
      yaxis: {
        lines: {
          show: true, // Show grid lines on y-axis
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    tooltip: {
      enabled: true, // Enable tooltip
      x: {
        format: "dd MMM yyyy", // Format for x-axis tooltip
      },
      y: {
        formatter: function(val, opts) {
          if (opts.seriesIndex === 0) {
            return `${val} OPs`;
          } else {
            return `${val.toLocaleString()} sacos`;
          }
        }
      }
    },
    xaxis: {
      type: "category", // Category-based x-axis
      categories: [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ],
      axisBorder: {
        show: false, // Hide x-axis border
      },
      axisTicks: {
        show: false, // Hide x-axis ticks
      },
      tooltip: {
        enabled: false, // Disable tooltip for x-axis points
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px", // Adjust font size for y-axis labels
          colors: ["#6B7280"], // Color of the labels
        },
      },
      title: {
        text: "", // Remove y-axis title
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Ordens de Produção",
      data: statisticsData?.monthly_ops || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      name: "Quantidade de Sacos",
      data: statisticsData?.monthly_quantities || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Estatísticas
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              OPs e quantidades mensais
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-[310px]">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-32 mb-2"></div>
            <div className="h-64 bg-gray-200 rounded dark:bg-gray-700 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !statisticsData) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 pb-5 pt-5 dark:border-red-800 dark:bg-red-900/20 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Estatísticas
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center h-[310px]">
          <p className="text-sm text-red-600 dark:text-red-400">
            Erro ao carregar dados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Estatísticas {statisticsData.current_year}
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            OPs e quantidades mensais
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
