import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Spinner from "../../components/ui/loaders/Spinner";
import { Modal } from "../../components/ui/modal";
// @ts-ignore: service API module is plain JavaScript.
import {
  exportCurrentAccountClientExcel,
  fetchCurrentAccountClientDetail,
  fetchCurrentAccountTopDebtors,
  searchCurrentAccountCombinations,
  sendCurrentAccountEmails,
} from "../../serviceapi/api";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type Debtor = {
  phc_no: string;
  phc_estab: string;
  name: string;
  nome2?: string;
  ncont?: string;
  email?: string;
  saldo: string | number;
  moeda?: string;
  recipients: string[];
  has_overdue_90?: boolean;
  overdue_90_count?: number;
  oldest_overdue_90_date?: string | null;
  last_sent_at?: string | null;
  last_sent_by?: string | null;
};

type CurrentAccountMovement = {
  line_no?: number;
  ccstamp: string;
  datalc?: string | null;
  dataven?: string | null;
  nrdoc?: string | number | null;
  cmdesc?: string;
  origem?: string;
  deb: string | number;
  cred: string | number;
  amount: string | number;
  running_balance?: string | number;
  recibado?: boolean;
  is_overdue_90?: boolean;
  days_overdue?: number;
  age_emission_days?: number;
  age_due_days?: number;
};

type CurrentAccountDetail = {
  client: {
    phc_no: string;
    phc_estab: string;
    name: string;
    ncont?: string;
    moeda?: string;
    saldo: string | number;
  };
  summary: {
    movement_count: number;
    overdue_90_count: number;
  };
  movements: CurrentAccountMovement[];
};

type CombinationDocument = {
  line_no: number;
  nrdoc: number;
  amount: string | number;
  cmdesc?: string;
};

type CombinationResult = {
  invoice_ids: number[];
  expression: string;
  documents: CombinationDocument[];
  spread: number;
  highlight: boolean;
  total: string | number;
};

type CombinationResponse = {
  target: string | number;
  start_line: number;
  end_line: number;
  interval_size: number;
  total_lines: number;
  positive_count: number;
  interval_count: number;
  used_count: number;
  results: CombinationResult[];
};

type SortField =
  | "priority"
  | "name"
  | "ncont"
  | "saldo"
  | "overdue_90_count"
  | "oldest_overdue_90_date"
  | "last_sent_at";

const PAGE_SIZE = 20;

function normalizePage<T>(input: unknown): PaginatedResponse<T> {
  const data = input as any;
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return {
    count: Number(data?.count || 0),
    next: data?.next || null,
    previous: data?.previous || null,
    results: Array.isArray(data?.results) ? data.results : [],
  };
}

function getDebtorKey(item: Debtor) {
  return `${item.phc_no}:${item.phc_estab}`;
}

function formatCurrency(value: string | number) {
  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return String(value ?? "-");
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-PT");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("pt-PT");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function CurrentAccountDebtorsPage() {
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [overdueStatus, setOverdueStatus] = useState("all");
  const [recipientStatus, setRecipientStatus] = useState("all");
  const [sentStatus, setSentStatus] = useState("all");
  const [sortBy, setSortBy] = useState<SortField>("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [detailByKey, setDetailByKey] = useState<Record<string, CurrentAccountDetail>>({});
  const [activeDebtor, setActiveDebtor] = useState<Debtor | null>(null);
  const [activeDetailKey, setActiveDetailKey] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [exportingExcel, setExportingExcel] = useState(false);

  const [searchTarget, setSearchTarget] = useState("");
  const [searchStartLine, setSearchStartLine] = useState("1");
  const [searchIntervalSize, setSearchIntervalSize] = useState("100");
  const [searchMaxResults, setSearchMaxResults] = useState("100");
  const [searchingCombinations, setSearchingCombinations] = useState(false);
  const [combinationError, setCombinationError] = useState("");
  const [combinationResponse, setCombinationResponse] = useState<CombinationResponse | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setIsSuperuser(Boolean(parsedUser?.is_superuser));
    } catch (_error) {
      setIsSuperuser(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [overdueStatus, recipientStatus, sentStatus, sortBy, sortDir]);

  useEffect(() => {
    if (!isSuperuser) return;

    let active = true;
    setLoading(true);
    setError("");

    fetchCurrentAccountTopDebtors({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch,
      overdueStatus,
      recipientStatus,
      sentStatus,
      sortBy,
      sortDir,
    })
      .then((response: unknown) => {
        if (!active) return;
        const normalized = normalizePage<Debtor>(response);
        setDebtors(normalized.results);
        setCount(normalized.count);
      })
      .catch((fetchError: Error) => {
        if (!active) return;
        setDebtors([]);
        setError(fetchError.message || "Erro ao carregar conta corrente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isSuperuser, page, debouncedSearch, overdueStatus, recipientStatus, sentStatus, sortBy, sortDir, reloadToken]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const allVisibleSelected = useMemo(
    () => debtors.length > 0 && debtors.every((debtor) => selectedKeys.includes(getDebtorKey(debtor))),
    [debtors, selectedKeys]
  );

  const selectedVisibleClients = useMemo(
    () =>
      debtors
        .filter((debtor) => selectedKeys.includes(getDebtorKey(debtor)))
        .map((debtor) => ({
          phc_no: debtor.phc_no,
          phc_estab: debtor.phc_estab,
        })),
    [debtors, selectedKeys]
  );

  const activeDetail = activeDetailKey ? detailByKey[activeDetailKey] : null;

  const toggleClient = (debtor: Debtor) => {
    const key = getDebtorKey(debtor);
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const toggleVisible = () => {
    const visibleKeys = debtors.map(getDebtorKey);
    setSelectedKeys((current) => {
      if (allVisibleSelected) {
        return current.filter((item) => !visibleKeys.includes(item));
      }
      return Array.from(new Set([...current, ...visibleKeys]));
    });
  };

  const openDetailModal = async (debtor: Debtor) => {
    const key = getDebtorKey(debtor);
    setActiveDebtor(debtor);
    setActiveDetailKey(key);
    setDetailError("");
    setCombinationError("");
    setCombinationResponse(null);
    setSearchTarget("");
    setSearchStartLine("1");
    setSearchIntervalSize("100");
    setSearchMaxResults("100");

    if (detailByKey[key]) return;

    setDetailLoading(true);
    try {
      const response = await fetchCurrentAccountClientDetail(debtor.phc_no, debtor.phc_estab);
      setDetailByKey((current) => ({ ...current, [key]: response as CurrentAccountDetail }));
    } catch (detailFetchError: any) {
      setDetailError(detailFetchError?.message || "Erro ao carregar o detalhe da conta corrente.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setActiveDebtor(null);
    setActiveDetailKey(null);
    setDetailError("");
    setCombinationError("");
    setCombinationResponse(null);
  };

  const handleSort = (field: SortField) => {
    setSortBy((currentField) => {
      if (currentField === field) {
        setSortDir((currentDir) => (currentDir === "asc" ? "desc" : "asc"));
        return currentField;
      }
      setSortDir(field === "name" || field === "ncont" ? "asc" : "desc");
      return field;
    });
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setOverdueStatus("all");
    setRecipientStatus("all");
    setSentStatus("all");
    setSortBy("priority");
    setSortDir("desc");
    setPage(1);
  };

  const getSortIndicator = (field: SortField) => {
    if (sortBy !== field) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  const renderSortableHeader = (field: SortField, label: string, align: "left" | "right" = "left") => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className={`inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 ${
        align === "right" ? "justify-end w-full" : ""
      }`}
      title={`Ordenar por ${label}`}
    >
      <span>{label}</span>
      <span className="text-[11px] opacity-80">{getSortIndicator(field)}</span>
    </button>
  );

  const handleSend = async () => {
    if (selectedVisibleClients.length === 0) return;
    setSending(true);
    setError("");
    setFeedback("");

    try {
      const response = await sendCurrentAccountEmails(selectedVisibleClients);
      const queuedCount = Number(response?.queued_count || 0);
      const failedCount = Number(response?.failed_count || 0);
      setFeedback(`Envios colocados em fila: ${queuedCount}. Falhas imediatas: ${failedCount}.`);
      setSelectedKeys([]);
    } catch (sendError: any) {
      setError(sendError?.message || "Erro ao enviar emails.");
    } finally {
      setSending(false);
    }
  };

  const handleExportExcel = async () => {
    if (!activeDebtor) return;
    setExportingExcel(true);
    setDetailError("");
    try {
      const response = await exportCurrentAccountClientExcel(activeDebtor.phc_no, activeDebtor.phc_estab);
      downloadBlob(response.blob, response.filename);
    } catch (exportError: any) {
      setDetailError(exportError?.message || "Erro ao exportar Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleSearchCombinations = async () => {
    if (!activeDebtor) return;
    setSearchingCombinations(true);
    setCombinationError("");
    setCombinationResponse(null);

    try {
      const response = await searchCurrentAccountCombinations(activeDebtor.phc_no, activeDebtor.phc_estab, {
        target: searchTarget,
        start_line: searchStartLine,
        interval_size: searchIntervalSize,
        max_results: searchMaxResults,
      });
      setCombinationResponse(response as CombinationResponse);
    } catch (searchError: any) {
      setCombinationError(searchError?.message || "Erro ao procurar combinacoes.");
    } finally {
      setSearchingCombinations(false);
    }
  };

  if (!isSuperuser) {
    return (
      <div className="space-y-6">
        <PageMeta
          title="Conta Corrente - Portal do Trabalhador"
          description="Pagina reservada a administradores"
        />
        <PageBreadcrumb pageTitle="Conta Corrente" />
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          Esta pagina esta disponivel apenas para administradores.
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageMeta
        title="Conta Corrente - Portal do Trabalhador"
        description="Clientes com maior divida e envio de conta corrente por email"
      />
      <PageBreadcrumb pageTitle="Conta Corrente" />

      <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Clientes que devem mais
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Primeiro aparecem os clientes com documentos nao regularizados ha mais de 90 dias. A ultima coluna mostra quando a conta corrente foi enviada.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar cliente, NIF ou email..."
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 md:min-w-[320px] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || selectedVisibleClients.length === 0}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300 dark:disabled:bg-sky-900/40"
            >
              {sending ? "A enviar..." : `Enviar email aos clientes (${selectedVisibleClients.length})`}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <select
            value={overdueStatus}
            onChange={(event) => setOverdueStatus(event.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">Todos os vencimentos</option>
            <option value="overdue_90">Apenas &gt; 90 dias</option>
            <option value="not_overdue_90">Sem &gt; 90 dias</option>
          </select>

          <select
            value={recipientStatus}
            onChange={(event) => setRecipientStatus(event.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">Com e sem email</option>
            <option value="with_email">Apenas com email</option>
            <option value="without_email">Apenas sem email</option>
          </select>

          <select
            value={sentStatus}
            onChange={(event) => setSentStatus(event.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">Todos os envios</option>
            <option value="sent">Ja enviados</option>
            <option value="unsent">Nunca enviados</option>
          </select>

          <button
            type="button"
            onClick={() => setReloadToken((current) => current + 1)}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.05]"
          >
            Atualizar
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.05]"
          >
            Limpar filtros
          </button>
        </div>

        {feedback && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            {feedback}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-white/[0.04]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisible}
                      aria-label="Selecionar visiveis"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {renderSortableHeader("name", "Cliente")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {renderSortableHeader("ncont", "NIF")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Emails
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {renderSortableHeader("saldo", "Saldo", "right")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {renderSortableHeader("oldest_overdue_90_date", "Regularizacao")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {renderSortableHeader("last_sent_at", "Ultima conta corrente enviada")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                {debtors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      Sem clientes para mostrar.
                    </td>
                  </tr>
                ) : (
                  debtors.map((debtor) => {
                    const key = getDebtorKey(debtor);
                    const isSelected = selectedKeys.includes(key);
                    return (
                      <tr
                        key={key}
                        className={`align-top ${debtor.has_overdue_90 ? "bg-red-50/70 dark:bg-red-950/10" : ""}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClient(debtor)}
                            aria-label={`Selecionar ${debtor.name}`}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <button type="button" onClick={() => openDetailModal(debtor)} className="text-left">
                            <div className="font-medium text-gray-900 underline underline-offset-4 dark:text-white">
                              {debtor.name}
                            </div>
                            <div className="mt-1 text-xs text-sky-700 dark:text-sky-300">
                              Ver detalhe da conta corrente
                            </div>
                          </button>
                          {debtor.has_overdue_90 && (
                            <div className="mt-2 inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-200">
                              {debtor.overdue_90_count || 0} documento(s) &gt; 90 dias
                            </div>
                          )}
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            PHC {debtor.phc_no}/{debtor.phc_estab}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {debtor.ncont || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {debtor.recipients.length > 0 ? (
                            <div className="space-y-1">
                              {debtor.recipients.map((recipient) => (
                                <div key={recipient} className="break-all">
                                  {recipient}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-red-600 dark:text-red-300">Sem emails validos</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(debtor.saldo)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {debtor.has_overdue_90 ? (
                            <>
                              <div className="font-medium text-red-700 dark:text-red-200">
                                Documentos vencidos ha mais de 90 dias
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Mais antiga: {formatDateTime(debtor.oldest_overdue_90_date)}
                              </div>
                            </>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              Sem vencidas &gt; 90 dias
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <div>{formatDateTime(debtor.last_sent_at)}</div>
                          {debtor.last_sent_by && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              por {debtor.last_sent_by}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500 md:flex-row md:items-center md:justify-between dark:text-gray-400">
          <span>
            {count} cliente{count === 1 ? "" : "s"} encontrado{count === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
            >
              Anterior
            </button>
            <span>
              Pagina {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
            >
              Seguinte
            </button>
          </div>
        </div>
      </section>

      <Modal isOpen={Boolean(activeDebtor)} onClose={closeDetailModal} className="m-4 max-w-[1440px]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 pr-12 dark:border-gray-800">
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeDebtor?.name || "Conta corrente"}
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-500 md:flex-row md:flex-wrap md:items-center md:gap-4 dark:text-gray-400">
              <span>PHC {activeDebtor?.phc_no}/{activeDebtor?.phc_estab}</span>
              <span>NIF: {activeDebtor?.ncont || "-"}</span>
              {activeDetail && <span>Saldo: {formatCurrency(activeDetail.client.saldo)}</span>}
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exportingExcel || detailLoading || !activeDebtor}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {exportingExcel ? "A exportar..." : "Exportar Excel"}
              </button>
            </div>
          </div>

          {detailError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              {detailError}
            </div>
          )}

          {detailLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner />
            </div>
          ) : activeDetail ? (
            <div className="space-y-5 pt-5">
              <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Busca de valores
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Procura combinacoes de documentos positivos nao regularizados dentro do intervalo de linhas.
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4 xl:grid-cols-5">
                  <input
                    value={searchTarget}
                    onChange={(event) => setSearchTarget(event.target.value)}
                    placeholder="Valor alvo"
                    className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <input
                    value={searchStartLine}
                    onChange={(event) => setSearchStartLine(event.target.value)}
                    placeholder="Linha inicial"
                    className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <input
                    value={searchIntervalSize}
                    onChange={(event) => setSearchIntervalSize(event.target.value)}
                    placeholder="Tamanho intervalo"
                    className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <input
                    value={searchMaxResults}
                    onChange={(event) => setSearchMaxResults(event.target.value)}
                    placeholder="Max resultados"
                    className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSearchCombinations}
                    disabled={searchingCombinations || !searchTarget.trim()}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                  >
                    {searchingCombinations ? "A procurar..." : "Buscar combinacoes"}
                  </button>
                </div>

                {combinationError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                    {combinationError}
                  </div>
                )}

                {combinationResponse && (
                    <div className="mt-4 space-y-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                      Intervalo usado: linhas {combinationResponse.start_line} a {combinationResponse.end_line} de {combinationResponse.total_lines} linha(s) do detalhe.
                      Ha {combinationResponse.positive_count} documento(s) positivos no total e foram usados {combinationResponse.used_count} na procura.
                      </div>
                    {combinationResponse.results.length === 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                        Nenhuma combinacao encontrada nesse intervalo.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {combinationResponse.results.map((result, index) => (
                          <div
                            key={`${result.expression}-${index}`}
                            className={`rounded-lg border p-3 text-sm ${
                              result.highlight
                                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200"
                                : "border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            <div className="font-semibold">
                              #{index + 1}: {result.expression}
                            </div>
                            <div className="mt-1 text-xs opacity-80">
                              Total: {formatCurrency(result.total)} | Diff IDs: {result.spread}
                            </div>
                            <div className="mt-2 text-xs opacity-80">
                              {result.documents.map((document) => `L${document.line_no}: f${document.nrdoc}`).join(" + ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Documentos nao regularizados
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {activeDetail.summary.movement_count} documento(s) | {activeDetail.summary.overdue_90_count} documento(s) vencido(s) ha mais de 90 dias
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Saldo atual: {formatCurrency(activeDetail.client.saldo)}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Linha</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Lancamento</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Vencimento</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Doc</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Descricao</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Origem</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Valor</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Saldo</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Idade emis</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Idade venc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                    {activeDetail.movements.map((movement) => (
                      <tr
                        key={movement.ccstamp}
                        className={movement.is_overdue_90 ? "bg-red-100/80 text-red-900 dark:bg-red-950/20 dark:text-red-100" : ""}
                      >
                        <td className="px-3 py-2 text-sm">{movement.line_no || "-"}</td>
                        <td className="px-3 py-2 text-sm">{formatDate(movement.datalc)}</td>
                        <td className="px-3 py-2 text-sm">{formatDate(movement.dataven)}</td>
                        <td className="px-3 py-2 text-sm">{movement.nrdoc || "-"}</td>
                        <td className="px-3 py-2 text-sm">
                          <div>{movement.cmdesc || "-"}</div>
                          {movement.is_overdue_90 && (
                            <div className="text-xs font-semibold text-red-700 dark:text-red-300">
                              Documento vencido ha mais de 90 dias
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">{movement.origem || "-"}</td>
                        <td className="px-3 py-2 text-right text-sm font-medium">{formatCurrency(movement.amount)}</td>
                        <td className="px-3 py-2 text-right text-sm font-medium">{formatCurrency(movement.running_balance || 0)}</td>
                        <td className="px-3 py-2 text-right text-sm">{movement.age_emission_days ?? 0}</td>
                        <td className="px-3 py-2 text-right text-sm">{movement.age_due_days ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
