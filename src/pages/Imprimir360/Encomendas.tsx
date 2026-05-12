import { useEffect, useState } from "react";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { fetch360Orders, fetch360Summary, trigger360BulkPick } from "../../serviceapi/imprimir360";

interface SummaryResponse {
  orders_total: number;
  orders_pending: number;
  orders_stock: number;
  orders_shipment: number;
  prints_today: number;
  scans_today: number;
  printers_active: number;
  last_sync?: {
    status: string;
    started_at: string;
    message: string;
  } | null;
}

interface OrderLineItem {
  id: number;
  production_plan_id: number | null;
  order_line_id: number;
  description: string;
  label_quantity: number;
  route_type: string;
  status: string;
  production_supplier_code: string;
  last_seen_at: string;
}

export default function Imprimir360Encomendas() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [orders, setOrders] = useState<OrderLineItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkEmail, setBulkEmail] = useState("acucenamarques@plasticosdao.com");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState("");

  async function loadData(nextPage = page) {
    try {
      setLoading(true);
      setError("");
      const [summaryData, ordersData] = await Promise.all([
        fetch360Summary(),
        fetch360Orders({
          page: nextPage,
          page_size: 15,
          search,
          status: statusFilter,
          route_type: routeFilter,
        }),
      ]);
      setSummary(summaryData);
      setOrders(ordersData.results || []);
      setHasNext(Boolean(ordersData.next));
      setPage(nextPage);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar encomendas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1);
  }, [search, statusFilter, routeFilter]);

  async function handleBulkPick() {
    try {
      setBulkSubmitting(true);
      setError("");
      setBulkSuccess("");
      const data = await trigger360BulkPick(bulkEmail);
      setBulkSuccess(
        `Processo lançado com sucesso. Task ${data.task_id}. Quando terminar, recebes email com os trabalhos a expedir.`,
      );
      setIsBulkModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Erro ao lançar a tarefa de picagem.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  const cards = [
    { label: "Order lines", value: summary?.orders_total ?? 0 },
    { label: "Pendentes", value: summary?.orders_pending ?? 0 },
    { label: "Shipment", value: summary?.orders_shipment ?? 0 },
    { label: "Stock", value: summary?.orders_stock ?? 0 },
  ];

  return (
    <>
      <PageMeta title="360Imprimir Encomendas" description="Gestão de encomendas 360Imprimir" />
      <PageBreadcrumb pageTitle="360Imprimir / Encomendas" />

      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {bulkSuccess ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {bulkSuccess}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white/90">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white/90">
                Sincronização diária
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Última execução: {summary?.last_sync?.started_at ? new Date(summary.last_sync.started_at).toLocaleString("pt-PT") : "sem registos"}
              </p>
            </div>
            <Button onClick={() => setIsBulkModalOpen(true)}>
              Picar todas as encomendas
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
              placeholder="Pesquisar por production plan ID, order line ou descrição"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            >
              <option value="">Todos os estados</option>
              <option value="pending">Pendente</option>
              <option value="printed">Impresso</option>
              <option value="shipped">Expedido</option>
              <option value="error">Erro</option>
            </select>
            <select
              value={routeFilter}
              onChange={(event) => setRouteFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            >
              <option value="">Todas as rotas</option>
              <option value="shipment">Shipment</option>
              <option value="stock">Stock</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">A carregar encomendas...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                    <tr>
                      <th className="px-3 py-3">Production Plan ID</th>
                      <th className="px-3 py-3">OrderLine</th>
                      <th className="px-3 py-3">Descrição</th>
                      <th className="px-3 py-3">Qtd.</th>
                      <th className="px-3 py-3">Rota</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3">Última sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-4 font-medium text-gray-900 dark:text-white/90">
                          {order.production_plan_id ?? "-"}
                        </td>
                        <td className="px-3 py-4 font-medium text-gray-900 dark:text-white/90">
                          #{order.order_line_id}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {order.description}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {order.label_quantity}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              order.route_type === "shipment"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                            }`}
                          >
                            {order.route_type}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {order.status}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {new Date(order.last_seen_at).toLocaleString("pt-PT")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <Button variant="outline" onClick={() => loadData(Math.max(1, page - 1))} disabled={page === 1}>
                  Página anterior
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">Página {page}</span>
                <Button variant="outline" onClick={() => loadData(page + 1)} disabled={!hasNext}>
                  Próxima página
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        className="max-w-xl p-6 sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white/90">
              Picar todas as encomendas
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Este é um processo demorado. Quando terminar, vais receber um email com os trabalhos a expedir e os eventuais erros.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email de destino
            </label>
            <input
              type="email"
              value={bulkEmail}
              onChange={(event) => setBulkEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)} disabled={bulkSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleBulkPick} disabled={bulkSubmitting}>
              {bulkSubmitting ? "A lançar..." : "Confirmar processo"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
