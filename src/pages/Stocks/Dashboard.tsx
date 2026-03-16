import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import StockEntryModal from "./components/StockEntryModal";
import StockSettingsModal from "./components/StockSettingsModal";
// @ts-ignore: legacy JS service module
import {
  fetchFamilyStockDashboard,
  fetchStockFamilies,
  sendStockOrderEmail,
} from "../../serviceapi/api";

interface StockFamily {
  id: number;
  name: string;
  description: string | null;
  product_type: string;
}

interface StockSummary {
  total_items: number;
  total_stock: number;
  below_minimum: number;
  within_range: number;
  above_maximum: number;
  no_limits: number;
}

interface StockItem {
  id: number;
  size_label: string;
  name: string;
  reference: string;
  category: string;
  current_quantity: number;
  minimum_stock: number | null;
  maximum_stock: number | null;
  status: "below_minimum" | "within_range" | "above_maximum" | "no_limits";
  minimum_gap: number | null;
  maximum_gap: number | null;
  stock_last_update: string | null;
}

interface FamilyStockDashboard {
  family: StockFamily;
  summary: StockSummary;
  items: StockItem[];
}

interface StockOrderLine extends Pick<
  StockItem,
  "id" | "size_label" | "name" | "reference" | "category"
> {
  boxes: number;
}

const numberFormatter = new Intl.NumberFormat("pt-PT");
const MINIMUM_ORDER_BOXES = 96;
const BOXES_PER_PALLET = 24;
const DEFAULT_ORDER_EMAIL = "mariana@plasticosdao.com";

const statusConfig: Record<
  StockItem["status"],
  { label: string; badgeClass: string; progressClass: string }
> = {
  below_minimum: {
    label: "Abaixo do mínimo",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    progressClass: "bg-red-500",
  },
  within_range: {
    label: "Dentro do intervalo",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    progressClass: "bg-emerald-500",
  },
  above_maximum: {
    label: "Acima do máximo",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    progressClass: "bg-amber-500",
  },
  no_limits: {
    label: "Sem limites",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    progressClass: "bg-slate-500",
  },
};

function formatQuantity(value: number | null | undefined) {
  if (value == null) return "-";
  return numberFormatter.format(value);
}

function formatGap(value: number | null | undefined, fallback: string) {
  if (value == null) return fallback;
  if (value > 0) return `+${formatQuantity(value)}`;
  return formatQuantity(value);
}

function formatLastUpdate(value: string | null) {
  if (!value) return "Sem atualização";
  return new Date(value).toLocaleString("pt-PT");
}

function formatChartCategory(category: string) {
  return category?.trim() || "Sem categoria";
}

function formatChartLabel(item: StockItem) {
  return `${item.size_label} | ${formatChartCategory(item.category)}`;
}

export default function StocksDashboard() {
  const [families, setFamilies] = useState<StockFamily[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [dashboard, setDashboard] = useState<FamilyStockDashboard | null>(null);
  const [familiesLoading, setFamiliesLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [orderCart, setOrderCart] = useState<StockOrderLine[]>([]);
  const [isOrderCartOpen, setIsOrderCartOpen] = useState(false);
  const [isOrderEmailOpen, setIsOrderEmailOpen] = useState(false);
  const [orderEmail, setOrderEmail] = useState(DEFAULT_ORDER_EMAIL);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadFamilies = async () => {
    try {
      setFamiliesLoading(true);
      const data = await fetchStockFamilies();
      setFamilies(data);
      setError(null);

      if (data.length > 0) {
        setSelectedFamilyId((currentValue) => {
          const hasCurrentFamily = data.some(
            (family) => String(family.id) === currentValue,
          );
          if (hasCurrentFamily) return currentValue;
          return String(data[0].id);
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar famílias:", err);
      setError(err.message || "Erro ao carregar famílias.");
    } finally {
      setFamiliesLoading(false);
    }
  };

  const loadDashboard = async (familyId: string) => {
    if (!familyId) {
      setDashboard(null);
      return;
    }

    try {
      setDashboardLoading(true);
      const data = await fetchFamilyStockDashboard(familyId);
      setDashboard(data);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar dashboard de stock:", err);
      setError(err.message || "Erro ao carregar dashboard de stock.");
    } finally {
      setDashboardLoading(false);
    }
  };

  const refreshPageData = async () => {
    await loadFamilies();
    const familyIdToRefresh = selectedFamilyId || "";
    if (familyIdToRefresh) {
      await loadDashboard(familyIdToRefresh);
    }
  };

  useEffect(() => {
    loadFamilies();
  }, []);

  useEffect(() => {
    loadDashboard(selectedFamilyId);
  }, [selectedFamilyId]);

  const categoryOptions = Array.from(
    new Set((dashboard?.items ?? []).map((item) => formatChartCategory(item.category))),
  ).sort((left, right) => left.localeCompare(right, "pt-PT"));

  useEffect(() => {
    if (!selectedCategory) return;
    if (!categoryOptions.includes(selectedCategory)) {
      setSelectedCategory("");
    }
  }, [categoryOptions, selectedCategory]);

  const filteredItems = dashboard
    ? dashboard.items.filter((item) => {
        const matchesCategory =
          !selectedCategory ||
          formatChartCategory(item.category) === selectedCategory;
        const haystack = [
          item.size_label,
          item.name,
          item.reference,
          item.category,
        ]
          .join(" ")
          .toLowerCase();

        return matchesCategory && haystack.includes(searchTerm.toLowerCase());
      })
    : [];

  const chartHeight = Math.max(360, filteredItems.length * 56);
  const selectedFamily = families.find(
    (family) => String(family.id) === selectedFamilyId,
  );
  const totalOrderBoxes = orderCart.reduce((sum, item) => sum + item.boxes, 0);
  const totalOrderPallets = totalOrderBoxes / BOXES_PER_PALLET;
  const canSubmitOrder = totalOrderBoxes >= MINIMUM_ORDER_BOXES;

  const addItemToOrderCart = (item: StockItem) => {
    setOrderCart((current) => {
      const existingItem = current.find((entry) => entry.id === item.id);
      if (existingItem) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, boxes: entry.boxes + 1 } : entry,
        );
      }

      return [
        ...current,
        {
          id: item.id,
          size_label: item.size_label,
          name: item.name,
          reference: item.reference,
          category: item.category,
          boxes: 1,
        },
      ];
    });
    setOrderFeedback(null);
  };

  const updateOrderBoxes = (itemId: number, nextBoxes: number) => {
    if (nextBoxes <= 0) {
      setOrderCart((current) => current.filter((item) => item.id !== itemId));
      return;
    }

    setOrderCart((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, boxes: nextBoxes } : item,
      ),
    );
  };

  const removeOrderItem = (itemId: number) => {
    setOrderCart((current) => current.filter((item) => item.id !== itemId));
  };

  const openOrderEmailModal = () => {
    if (orderCart.length === 0) {
      setOrderFeedback({
        type: "error",
        message: "Adicione pelo menos um artigo à encomenda.",
      });
      return;
    }

    if (!canSubmitOrder) {
      setOrderFeedback({
        type: "error",
        message:
          "O fornecedor só aceita encomendas com 96 caixas ou mais (4 paletes).",
      });
      return;
    }

    setOrderEmail(DEFAULT_ORDER_EMAIL);
    setOrderFeedback(null);
    setIsOrderEmailOpen(true);
  };

  const handleSendOrder = async () => {
    const normalizedEmail = orderEmail.trim();

    if (!normalizedEmail) {
      setOrderFeedback({
        type: "error",
        message: "Indique o email de destino da encomenda.",
      });
      return;
    }

    if (!canSubmitOrder) {
      setOrderFeedback({
        type: "error",
        message:
          "O fornecedor só aceita encomendas com 96 caixas ou mais (4 paletes).",
      });
      return;
    }

    try {
      setIsSendingOrder(true);
      await sendStockOrderEmail({
        destination_email: normalizedEmail,
        family_name: selectedFamily?.name || "Family",
        category: selectedCategory || "",
        items: orderCart.map((item) => ({
          reference: item.reference,
          name: item.name,
          category: formatChartCategory(item.category),
          size_label: item.size_label,
          boxes: item.boxes,
        })),
      });

      setOrderFeedback({
        type: "success",
        message: `Email de encomenda enviado para ${normalizedEmail}.`,
      });
      setOrderCart([]);
      setIsOrderEmailOpen(false);
      setIsOrderCartOpen(false);
    } catch (err: any) {
      setOrderFeedback({
        type: "error",
        message: err.message || "Erro ao enviar email de encomenda.",
      });
    } finally {
      setIsSendingOrder(false);
    }
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#2563eb", "#f59e0b", "#10b981"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: "68%",
      },
    },
    stroke: {
      width: 0,
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    xaxis: {
      categories: filteredItems.map((item) => formatChartLabel(item)),
      title: {
        text: "Quantidade",
      },
      labels: {
        formatter: (value) => formatQuantity(Number(value)),
      },
    },
    yaxis: {
      labels: {
        maxWidth: 220,
      },
    },
    tooltip: {
      custom: ({ series, seriesIndex, dataPointIndex }) => {
        const item = filteredItems[dataPointIndex];
        const seriesName =
          seriesIndex === 0
            ? "Stock Atual"
            : seriesIndex === 1
              ? "Stock Mínimo"
              : "Stock Máximo";
        const value = series[seriesIndex]?.[dataPointIndex] ?? 0;

        if (!item) return "";

        return `
          <div class="min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
            <div class="font-semibold text-gray-900 dark:text-white">${item.size_label}</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">${formatChartCategory(item.category)}</div>
            <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">${item.name} | ${item.reference}</div>
            <div class="mt-3 font-medium text-gray-900 dark:text-white">${seriesName}: ${formatQuantity(Number(value))}</div>
          </div>
        `;
      },
      y: {
        formatter: (value) => formatQuantity(Number(value)),
      },
    },
  };

  return (
    <>
      <PageMeta
        title="Stocks - Portal do Trabalhador"
        description="Dashboard de stocks por família"
      />
      <PageBreadcrumb pageTitle="Stocks" />

      <div className="space-y-6">
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
            startIcon={
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M4.94336 12.75C4.83858 12.2625 4.83858 11.7375 4.94336 11.25L6.18878 10.5774C6.46812 9.72418 6.91856 8.93869 7.50724 8.26962L7.3287 6.86126C7.72361 6.53365 8.17953 6.2694 8.67695 6.08559L9.82629 6.95886C10.6795 6.76274 11.5679 6.76274 12.4211 6.95886L13.5704 6.08559C14.0679 6.2694 14.5238 6.53365 14.9187 6.86126L14.7401 8.26962C15.3288 8.93869 15.7793 9.72418 16.0586 10.5774L17.304 11.25C17.4088 11.7375 17.4088 12.2625 17.304 12.75L16.0586 13.4226C15.7793 14.2758 15.3288 15.0613 14.7401 15.7304L14.9187 17.1387C14.5238 17.4664 14.0679 17.7306 13.5704 17.9144L12.4211 17.0411C11.5679 17.2373 10.6795 17.2373 9.82629 17.0411L8.67695 17.9144C8.17953 17.7306 7.72361 17.4664 7.3287 17.1387L7.50724 15.7304C6.91856 15.0613 6.46812 14.2758 6.18878 13.4226L4.94336 12.75Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Definições
          </Button>
          <Button
            onClick={() => setIsEntryOpen(true)}
            startIcon={
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            }
          >
            Adicionar Entrada
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <ComponentCard
            title="Selecionar Família"
            desc="Escolha a family para ver os tamanhos, stocks e limites mínimo/máximo."
          >
            <div className="space-y-4">
              <select
                value={selectedFamilyId}
                onChange={(event) => setSelectedFamilyId(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                disabled={familiesLoading || families.length === 0}
              >
                {families.length === 0 ? (
                  <option value="">Sem famílias disponíveis</option>
                ) : (
                  families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))
                )}
              </select>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tipo
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedFamily?.product_type || "-"}
                </p>
                <p className="mt-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Descrição
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {selectedFamily?.description || "Sem descrição disponível."}
                </p>
              </div>
            </div>
          </ComponentCard>

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Artigos</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {formatQuantity(dashboard?.summary.total_items ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Stock total</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {formatQuantity(dashboard?.summary.total_stock ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Abaixo do mínimo
              </p>
              <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-300">
                {formatQuantity(dashboard?.summary.below_minimum ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Acima do máximo
              </p>
              <p className="mt-2 text-3xl font-semibold text-amber-600 dark:text-amber-300">
                {formatQuantity(dashboard?.summary.above_maximum ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        {orderFeedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              orderFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            }`}
          >
            {orderFeedback.message}
          </div>
        )}

        <ComponentCard
          title="Filtros"
          desc="Filtre os registos visíveis por categoria e por pesquisa livre."
        >
          <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Todas as categorias</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar tamanho, artigo ou referência..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </ComponentCard>

        <ComponentCard
          title="Gráfico de Stocks por Tamanho"
          desc="Comparação entre stock atual, stock mínimo e stock máximo para a família selecionada."
        >
          {dashboardLoading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Não há tamanhos para mostrar neste gráfico.
            </div>
          ) : (
            <Chart
              type="bar"
              height={chartHeight}
              options={chartOptions}
              series={[
                {
                  name: "Stock Atual",
                  data: filteredItems.map((item) => item.current_quantity),
                },
                {
                  name: "Stock Mínimo",
                  data: filteredItems.map((item) => item.minimum_stock ?? 0),
                },
                {
                  name: "Stock Máximo",
                  data: filteredItems.map((item) => item.maximum_stock ?? 0),
                },
              ]}
            />
          )}
        </ComponentCard>

        <ComponentCard
          title="Tabela de Stocks"
          desc="Veja cada tamanho/artigo da family selecionada e o estado face aos limites."
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dashboard
                ? `${formatQuantity(filteredItems.length)} registos visíveis em ${dashboard.family.name}`
                : "Sem dados carregados"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Categoria: {selectedCategory || "Todas"}
            </div>
          </div>

          {dashboardLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Nenhum artigo encontrado para esta pesquisa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Tamanho</th>
                    <th className="px-4 py-3">Artigo</th>
                    <th className="px-4 py-3">Referência</th>
                    <th className="px-4 py-3">Stock atual</th>
                    <th className="px-4 py-3">Stock mínimo</th>
                    <th className="px-4 py-3">Stock máximo</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Leitura rápida</th>
                    <th className="px-4 py-3">Encomenda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredItems.map((item) => {
                    const status = statusConfig[item.status];
                    const progressBase =
                      item.maximum_stock && item.maximum_stock > 0
                        ? Math.min(
                            (item.current_quantity / item.maximum_stock) * 100,
                            100,
                          )
                        : 0;

                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.size_label}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Atualizado: {formatLastUpdate(item.stock_last_update)}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <div>{item.name}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {item.category || "Sem categoria"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {item.reference}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatQuantity(item.current_quantity)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatQuantity(item.minimum_stock)}
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Dif.: {formatGap(item.minimum_gap, "Sem limite")}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatQuantity(item.maximum_stock)}
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Folga: {formatGap(item.maximum_gap, "Sem limite")}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="w-44">
                            <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatQuantity(item.current_quantity)}</span>
                              <span>
                                max {formatQuantity(item.maximum_stock ?? 0)}
                              </span>
                            </div>
                            <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-800">
                              <div
                                className={`h-2.5 rounded-full ${status.progressClass}`}
                                style={{ width: `${progressBase}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => addItemToOrderCart(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                            aria-label={`Adicionar ${item.reference} à encomenda`}
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 5V19"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                              <path
                                d="M5 12H19"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      <StockSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChanged={refreshPageData}
      />

      <StockEntryModal
        isOpen={isEntryOpen}
        onClose={() => setIsEntryOpen(false)}
        families={families}
        defaultFamilyId={selectedFamilyId}
        onEntryCreated={refreshPageData}
      />

      {orderCart.length > 0 && (
        <button
          type="button"
          onClick={() => setIsOrderCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
          aria-label="Abrir carrinho de encomenda"
        >
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4H5.5L7.2 13.39C7.28 13.81 7.72 14.13 8.17 14.13H17.2C17.65 14.13 18.05 13.84 18.16 13.43L20 7.5H6.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18C8.32843 18 9 18.6716 9 19.5Z"
              fill="currentColor"
            />
            <path
              d="M19 19.5C19 20.3284 18.3284 21 17.5 21C16.6716 21 16 20.3284 16 19.5C16 18.6716 16.6716 18 17.5 18C18.3284 18 19 18.6716 19 19.5Z"
              fill="currentColor"
            />
          </svg>
          <span className="absolute -right-1 -top-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-gray-900">
            {orderCart.length}
          </span>
        </button>
      )}

      <Modal
        isOpen={isOrderCartOpen}
        onClose={() => setIsOrderCartOpen(false)}
        className="m-4 max-w-[900px]"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Carrinho de Encomenda
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                O fornecedor só aceita encomendas com pelo menos 4 paletes, ou
                seja, 96 caixas.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
              <div className="font-medium text-gray-900 dark:text-white">
                {totalOrderBoxes} caixas
              </div>
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                {totalOrderPallets.toFixed(2)} paletes
              </div>
            </div>
          </div>

          {orderCart.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Ainda não tens artigos no carrinho.
            </div>
          ) : (
            <div className="space-y-3">
              {orderCart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.reference} | {item.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatChartCategory(item.category)} | {item.size_label}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="min-w-28">
                        <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Caixas
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.boxes}
                          onChange={(event) =>
                            updateOrderBoxes(
                              item.id,
                              Number(event.target.value || 0),
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => removeOrderItem(item.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-4 py-4 text-sm dark:border-gray-700">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span className="text-gray-600 dark:text-gray-300">
                Mínimo exigido pelo fornecedor
              </span>
              <span
                className={`font-semibold ${
                  canSubmitOrder
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-amber-600 dark:text-amber-300"
                }`}
              >
                {totalOrderBoxes}/{MINIMUM_ORDER_BOXES} caixas
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOrderCartOpen(false)}>
              Fechar
            </Button>
            <Button onClick={openOrderEmailModal} disabled={orderCart.length === 0}>
              Encomendar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isOrderEmailOpen}
        onClose={() => setIsOrderEmailOpen(false)}
        className="m-4 max-w-[520px]"
      >
        <div className="p-6 sm:p-8">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Enviar Encomenda
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Confirma o email de destino. Por defeito vai para{" "}
            {DEFAULT_ORDER_EMAIL}.
          </p>

          <div className="mt-5 space-y-4">
            <input
              type="email"
              value={orderEmail}
              onChange={(event) => setOrderEmail(event.target.value)}
              placeholder="Email de destino"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm dark:border-gray-800 dark:bg-gray-900/40">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-600 dark:text-gray-300">
                  Artigos na encomenda
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {orderCart.length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-gray-600 dark:text-gray-300">
                  Total de caixas
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalOrderBoxes}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-gray-600 dark:text-gray-300">
                  Equivalência
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalOrderPallets.toFixed(2)} paletes
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOrderEmailOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendOrder} disabled={!canSubmitOrder || isSendingOrder}>
              {isSendingOrder ? "A enviar..." : "Enviar Email"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
