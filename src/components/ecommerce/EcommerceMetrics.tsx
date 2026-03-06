import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useState, useEffect } from "react";

interface MonthlyStats {
  ops_this_month: number;
  total_bags: number;
  variation_percentage: number;
  current_month_name: string;
  current_year: number;
}

export default function EcommerceMetrics() {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        
        if (!token) {
          setError("Token de autenticação não encontrado");
          return;
        }

        const response = await fetch("/api/op/ordens-producao/monthly-stats/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Erro ao buscar estatísticas mensais:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
            <div className="mt-5 space-y-2">
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
            <div className="mt-5 space-y-2">
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20 md:p-6">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Erro ao carregar dados
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20 md:p-6">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Erro ao carregar dados
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              OPs em {stats.current_month_name}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.ops_this_month.toLocaleString()}
            </h4>
          </div>
          <Badge color={stats.variation_percentage >= 0 ? "success" : "error"}>
            {stats.variation_percentage >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(stats.variation_percentage).toFixed(2)}%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Sacos em {stats.current_month_name}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.total_bags.toLocaleString()}
            </h4>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            Total
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
