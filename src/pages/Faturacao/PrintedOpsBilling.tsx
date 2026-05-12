import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Spinner from "../../components/ui/loaders/Spinner";
// @ts-ignore: service API module is plain JavaScript.
import {
  downloadFaturacaoPrintedOpsExcel,
  fetchFaturacaoClientOps,
  fetchFaturacaoClients,
} from "../../serviceapi/api";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type Client = {
  id: number;
  name: string;
  nome2?: string;
  email?: string;
  ncont?: string;
  pais?: string;
};

type OrdemProducao = {
  id: number;
  order_type?: string;
  nome_trabalho?: string;
  status?: string;
  quantidade?: number;
  data_criacao?: string;
  data_expedicao?: string;
  cor_gramagem_cor?: string;
  cor_gramagem_valor?: string;
  tipo_saco_detail?: { nome?: string };
  tamanho_detail?: {
    largura?: string | number | null;
    fole?: string | number | null;
    altura?: string | number | null;
  };
};

const PAGE_SIZE = 12;

function normalizePage<T>(input: unknown): PaginatedResponse<T> {
  const data = input as any;
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return {
    count: Number(data?.count || 0),
    next: data?.next || null,
    previous: data?.previous || null,
    results: Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.data)
        ? data.data
        : [],
  };
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-PT");
}

function formatDimension(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(String(value).replace(",", "."));
  if (Number.isFinite(numeric)) {
    return Number.isInteger(numeric) ? String(numeric) : String(numeric).replace(".", ",");
  }
  return String(value);
}

function formatTamanho(op: OrdemProducao) {
  const tamanho = op.tamanho_detail;
  if (!tamanho) return "-";
  return [tamanho.largura, tamanho.fole, tamanho.altura]
    .map(formatDimension)
    .filter(Boolean)
    .join("x") || "-";
}

export default function PrintedOpsBilling() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPage, setClientPage] = useState(1);
  const [clientCount, setClientCount] = useState(0);
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState("");

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [ops, setOps] = useState<OrdemProducao[]>([]);
  const [opsPage, setOpsPage] = useState(1);
  const [opsCount, setOpsCount] = useState(0);
  const [loadingOps, setLoadingOps] = useState(false);
  const [opsError, setOpsError] = useState("");
  const [selectedOps, setSelectedOps] = useState<number[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(clientSearch.trim());
      setClientPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [clientSearch]);

  useEffect(() => {
    let active = true;
    setLoadingClients(true);
    setClientsError("");

    fetchFaturacaoClients({ page: clientPage, pageSize: PAGE_SIZE, search: debouncedSearch })
      .then((response: unknown) => {
        if (!active) return;
        const page = normalizePage<Client>(response);
        setClients(page.results);
        setClientCount(page.count);
      })
      .catch((error: Error) => {
        if (!active) return;
        setClients([]);
        setClientsError(error.message || "Erro ao carregar clientes.");
      })
      .finally(() => {
        if (active) setLoadingClients(false);
      });

    return () => {
      active = false;
    };
  }, [clientPage, debouncedSearch]);

  useEffect(() => {
    if (!selectedClient) return;

    let active = true;
    setLoadingOps(true);
    setOpsError("");

    fetchFaturacaoClientOps(selectedClient.id, {
      page: opsPage,
      pageSize: PAGE_SIZE,
    })
      .then((response: unknown) => {
        if (!active) return;
        const page = normalizePage<OrdemProducao>(response);
        setOps(page.results.filter((op) => op.order_type === "op" || !op.order_type));
        setOpsCount(page.count);
      })
      .catch((error: Error) => {
        if (!active) return;
        setOps([]);
        setOpsError(error.message || "Erro ao carregar OPs.");
      })
      .finally(() => {
        if (active) setLoadingOps(false);
      });

    return () => {
      active = false;
    };
  }, [selectedClient, opsPage]);

  const clientTotalPages = Math.max(1, Math.ceil(clientCount / PAGE_SIZE));
  const opsTotalPages = Math.max(1, Math.ceil(opsCount / PAGE_SIZE));
  const selectedClientName = selectedClient?.nome2 || selectedClient?.name || "";

  const allVisibleSelected = useMemo(
    () => ops.length > 0 && ops.every((op) => selectedOps.includes(op.id)),
    [ops, selectedOps]
  );

  const openClient = (client: Client) => {
    setSelectedClient(client);
    setOpsPage(1);
    setSelectedOps([]);
    setDownloadError("");
  };

  const toggleOp = (opId: number) => {
    setSelectedOps((current) =>
      current.includes(opId)
        ? current.filter((id) => id !== opId)
        : [...current, opId]
    );
  };

  const toggleVisibleOps = () => {
    const visibleIds = ops.map((op) => op.id);
    setSelectedOps((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const handleDownload = async () => {
    if (!selectedClient || selectedOps.length === 0) return;
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadFaturacaoPrintedOpsExcel(selectedOps, selectedClientName);
    } catch (error: any) {
      setDownloadError(error?.message || "Erro ao gerar Excel.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title="Faturacao - OPs"
        description="Geracao de Excel de faturacao para OPs impressas"
      />
      <PageBreadcrumb pageTitle="Faturacao" />

      <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Clientes
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pesquisa com debounce e paginacao.
            </p>
          </div>
          <div className="relative w-full md:max-w-md">
            <input
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Pesquisar cliente..."
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        {clientsError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {clientsError}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          {loadingClients ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-white/[0.04]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">NIF</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Pais</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {clients.map((client) => (
                  <tr key={client.id} className="dark:text-gray-200">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {client.nome2 || client.name}
                      </div>
                      {client.nome2 && <div className="text-xs text-gray-500">{client.name}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{client.ncont || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{client.pais || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openClient(client)}
                        className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
                {!clients.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>Pagina {clientPage} de {clientTotalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={clientPage <= 1}
              onClick={() => setClientPage((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-40 dark:border-gray-700"
            >
              Anterior
            </button>
            <button
              disabled={clientPage >= clientTotalPages}
              onClick={() => setClientPage((page) => Math.min(clientTotalPages, page + 1))}
              className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-40 dark:border-gray-700"
            >
              Seguinte
            </button>
          </div>
        </div>
      </section>

      {selectedClient && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                OPs de {selectedClientName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mais recentes primeiro. Selecionadas: {selectedOps.length}
              </p>
            </div>
            <button
              disabled={selectedOps.length === 0 || downloading}
              onClick={handleDownload}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "A gerar..." : "Gerar Excel"}
            </button>
          </div>

          {downloadError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              {downloadError}
            </div>
          )}
          {opsError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              {opsError}
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            {loadingOps ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-white/[0.04]">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleVisibleOps}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">OP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tamanho</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cor / Gramagem</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Qtd</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Criada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {ops.map((op) => (
                    <tr key={op.id} className="dark:text-gray-200">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOps.includes(op.id)}
                          onChange={() => toggleOp(op.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {op.nome_trabalho || `OP ${op.id}`}
                        </div>
                        <div className="text-xs text-gray-500">#{op.id} - {op.status || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatTamanho(op)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {op.cor_gramagem_cor || "-"} {op.cor_gramagem_valor ? `${op.cor_gramagem_valor}g/m2` : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{op.quantidade || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(op.data_criacao)}</td>
                    </tr>
                  ))}
                  {!ops.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        Nenhuma OP encontrada para este cliente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>Pagina {opsPage} de {opsTotalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={opsPage <= 1}
                onClick={() => setOpsPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-40 dark:border-gray-700"
              >
                Anterior
              </button>
              <button
                disabled={opsPage >= opsTotalPages}
                onClick={() => setOpsPage((page) => Math.min(opsTotalPages, page + 1))}
                className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-40 dark:border-gray-700"
              >
                Seguinte
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
