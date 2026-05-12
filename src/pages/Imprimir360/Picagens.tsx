import { useEffect, useState } from "react";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { fetch360ScanEvents } from "../../serviceapi/imprimir360";

interface ScanEventItem {
  id: number;
  barcode: string;
  order_line_id_value?: number;
  employee_name?: string;
  route_type: string;
  will_ship_today: boolean;
  status: string;
  printer_name?: string;
  created_at: string;
}

export default function Imprimir360Picagens() {
  const [events, setEvents] = useState<ScanEventItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData(nextPage = page) {
    try {
      setLoading(true);
      setError("");
      const data = await fetch360ScanEvents({
        page: nextPage,
        page_size: 20,
        search,
      });
      setEvents(data.results || []);
      setHasNext(Boolean(data.next));
      setPage(nextPage);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar picagens.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1);
  }, [search]);

  return (
    <>
      <PageMeta title="360Imprimir Picagens" description="Histórico de picagens e leituras 360Imprimir" />
      <PageBreadcrumb pageTitle="360Imprimir / Picagens" />

      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            placeholder="Pesquisar por código, encomenda ou empregado"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">A carregar picagens...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                    <tr>
                      <th className="px-3 py-3">Data</th>
                      <th className="px-3 py-3">Código</th>
                      <th className="px-3 py-3">OrderLine</th>
                      <th className="px-3 py-3">Empregado</th>
                      <th className="px-3 py-3">Decisão</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3">Impressora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {new Date(event.created_at).toLocaleString("pt-PT")}
                        </td>
                        <td className="px-3 py-4 font-medium text-gray-900 dark:text-white/90">
                          {event.barcode}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {event.order_line_id_value ? `#${event.order_line_id_value}` : "-"}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {event.employee_name || "-"}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {event.will_ship_today ? "Vai hoje" : "Stock"}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {event.status}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {event.printer_name || "-"}
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
    </>
  );
}
