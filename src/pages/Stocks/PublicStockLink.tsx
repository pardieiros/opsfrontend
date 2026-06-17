import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
// @ts-ignore: legacy JS service module
import { fetchPublicStockReport } from "../../serviceapi/api";

type StockStatus = "below_minimum" | "within_range" | "above_maximum" | "no_limits";

interface StockFamily {
  id: number;
  name: string;
  description: string | null;
  product_type: string;
}

interface StockItem {
  id: number;
  family_id: number;
  family_name: string;
  size_label: string;
  name: string;
  reference: string;
  category: string;
  current_quantity: number;
  minimum_stock: number | null;
  maximum_stock: number | null;
  status: StockStatus;
  minimum_gap: number | null;
  maximum_gap: number | null;
  stock_last_update: string | null;
}

interface PublicDashboard {
  family: StockFamily;
  summary: {
    total_items: number;
    total_stock: number;
    below_minimum: number;
    within_range: number;
    above_maximum: number;
    no_limits: number;
  };
  items: Omit<StockItem, "family_id" | "family_name">[];
}

interface PublicStockReport {
  schedule: { id: number; name: string };
  initial_family_id: number | null;
  dashboards: PublicDashboard[];
}

const numberFormatter = new Intl.NumberFormat("pt-PT");

const statusLabels: Record<StockStatus | "all", string> = {
  all: "Todos os estados",
  below_minimum: "Abaixo do mínimo",
  within_range: "Dentro do intervalo",
  above_maximum: "Acima do máximo",
  no_limits: "Sem limites",
};

const statusClass: Record<StockStatus, string> = {
  below_minimum: "bg-red-50 text-red-700 ring-red-200",
  within_range: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  above_maximum: "bg-amber-50 text-amber-700 ring-amber-200",
  no_limits: "bg-slate-100 text-slate-700 ring-slate-200",
};

function formatQuantity(value: number | null | undefined) {
  if (value == null) return "-";
  return numberFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Sem atualização";
  return new Date(value).toLocaleString("pt-PT");
}

export default function PublicStockLink() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [report, setReport] = useState<PublicStockReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Link inválido: falta o token do relatório.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    fetchPublicStockReport(token)
      .then((data: PublicStockReport) => {
        if (!isMounted) return;
        setReport(data);
        setSelectedFamilyId(
          data.initial_family_id ? String(data.initial_family_id) : "all",
        );
        setError(null);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setError(err.message || "Não foi possível carregar o relatório.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const allItems = useMemo<StockItem[]>(() => {
    if (!report) return [];
    return report.dashboards.flatMap((dashboard) =>
      dashboard.items.map((item) => ({
        ...item,
        family_id: dashboard.family.id,
        family_name: dashboard.family.name,
      })),
    );
  }, [report]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(allItems.map((item) => item.category || "Sem categoria")),
      ).sort((left, right) => left.localeCompare(right, "pt-PT")),
    [allItems],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesFamily =
        selectedFamilyId === "all" || String(item.family_id) === selectedFamilyId;
      const matchesCategory =
        selectedCategory === "all" ||
        (item.category || "Sem categoria") === selectedCategory;
      const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
      const haystack = [
        item.family_name,
        item.category,
        item.size_label,
        item.name,
        item.reference,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesFamily &&
        matchesCategory &&
        matchesStatus &&
        (!normalizedSearch || haystack.includes(normalizedSearch))
      );
    });
  }, [allItems, searchTerm, selectedCategory, selectedFamilyId, selectedStatus]);

  const summary = useMemo(
    () => ({
      totalItems: filteredItems.length,
      totalStock: filteredItems.reduce((sum, item) => sum + item.current_quantity, 0),
      belowMinimum: filteredItems.filter((item) => item.status === "below_minimum")
        .length,
      aboveMaximum: filteredItems.filter((item) => item.status === "above_maximum")
        .length,
    }),
    [filteredItems],
  );

  return (
    <>
      <PageMeta
        title="Relatório de Stocks"
        description="Relatório público e filtrável de stocks"
      />
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Plásticos Dão
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                  Relatório de Stocks
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {report?.schedule.name || "Consulta de stock da plataforma"}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Link válido por 1 dia
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            </div>
          ) : !report || error ? null : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Artigos visíveis" value={formatQuantity(summary.totalItems)} />
                <Metric label="Stock total" value={formatQuantity(summary.totalStock)} />
                <Metric
                  label="Abaixo do mínimo"
                  value={formatQuantity(summary.belowMinimum)}
                  tone="red"
                />
                <Metric
                  label="Acima do máximo"
                  value={formatQuantity(summary.aboveMaximum)}
                  tone="amber"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={selectedFamilyId}
                    onChange={(event) => setSelectedFamilyId(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">Todas as famílias</option>
                    {report.dashboards.map((dashboard) => (
                      <option key={dashboard.family.id} value={dashboard.family.id}>
                        {dashboard.family.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(event.target.value as StockStatus | "all")
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tamanho, artigo ou referência"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                    <tr className="text-left text-xs font-semibold uppercase text-slate-600">
                      <th className="px-4 py-3">Família</th>
                      <th className="px-4 py-3">Tamanho</th>
                      <th className="px-4 py-3">Artigo</th>
                      <th className="px-4 py-3">Referência</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3 text-right">Mín.</th>
                      <th className="px-4 py-3 text-right">Máx.</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={`${item.family_id}-${item.id}`}>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.family_name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-950">
                          {item.size_label}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div>{item.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.category}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.reference}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-950">
                          {formatQuantity(item.current_quantity)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          {formatQuantity(item.minimum_stock)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          {formatQuantity(item.maximum_stock)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {filteredItems.map((item) => (
                  <article
                    key={`${item.family_id}-${item.id}`}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          {item.family_name}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-slate-950">
                          {item.reference}
                        </h2>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{item.name}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <Detail label="Tamanho" value={item.size_label} />
                      <Detail label="Categoria" value={item.category || "Sem categoria"} />
                      <Detail label="Stock" value={formatQuantity(item.current_quantity)} />
                      <Detail label="Mínimo" value={formatQuantity(item.minimum_stock)} />
                      <Detail label="Máximo" value={formatQuantity(item.maximum_stock)} />
                      <Detail label="Atualizado" value={formatDate(item.stock_last_update)} />
                    </div>
                  </article>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
                  Nenhum artigo encontrado com estes filtros.
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function Metric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "red" | "amber";
}) {
  const valueClass =
    tone === "red"
      ? "text-red-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-950";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium text-slate-900">{value}</p>
    </div>
  );
}
