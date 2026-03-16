import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import {
  type FaturacaoSettingsResponse,
  type FaturacaoWeekBucket,
} from "../dashboardShared";

type FaturacaoSettingsTabProps = {
  loadingSettings: boolean;
  settingsData: FaturacaoSettingsResponse | null;
  settingsError: string;
  uploadError: string;
  uploadSuccess: string;
  uploadingFile: boolean;
  selectedFileName: string;
  onFileChange: (file: File | null) => void;
  onRefresh: () => void;
  onUpload: () => void;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function WeekList({
  items,
  emptyLabel,
}: {
  items: FaturacaoWeekBucket[];
  emptyLabel: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.date_from}`}
          className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-white/5"
        >
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {item.date_from} até {item.date_to}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FaturacaoSettingsTab({
  loadingSettings,
  settingsData,
  settingsError,
  uploadError,
  uploadSuccess,
  uploadingFile,
  selectedFileName,
  onFileChange,
  onRefresh,
  onUpload,
}: FaturacaoSettingsTabProps) {
  const latestUpload = settingsData?.latest_upload;
  const weeklyCoverage = settingsData?.weekly_coverage;

  return (
    <div className="space-y-6">
      <ComponentCard
        title="Upload de faturação"
        desc="Carrega um ficheiro Excel com tabelas estruturadas para substituir os dados atuais do dashboard."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ficheiro Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xlsm,.xltx,.xltm"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
              className="mt-3 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-600 dark:text-gray-300"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Selecionado: {selectedFileName || "nenhum ficheiro"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onUpload} disabled={uploadingFile}>
              {uploadingFile ? "A importar..." : "Importar Excel"}
            </Button>
            <Button variant="outline" onClick={onRefresh} disabled={loadingSettings}>
              Atualizar estado
            </Button>
          </div>

          {uploadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
              {uploadSuccess}
            </div>
          )}

          {settingsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {settingsError}
            </div>
          )}

          {loadingSettings && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A carregar o estado atual da importação.
            </p>
          )}

          {latestUpload && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                <div className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Último ficheiro
                </div>
                <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {latestUpload.filename}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                <div className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Importado em
                </div>
                <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateTime(latestUpload.imported_at)}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                <div className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Linhas
                </div>
                <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {latestUpload.total_rows}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                <div className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Tabelas
                </div>
                <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {latestUpload.total_tables ?? "-"}
                </div>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      <ComponentCard
        title="Cobertura semanal"
        desc="Resume a última semana disponível e deteta semanas em falta."
      >
        {!weeklyCoverage ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sem dados de cobertura para mostrar.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  Última semana com registo
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
                  {weeklyCoverage.latest_week?.label || "Sem dados"}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {weeklyCoverage.latest_week
                    ? `${weeklyCoverage.latest_week.date_from} até ${weeklyCoverage.latest_week.date_to}`
                    : "Sem datas válidas na importação."}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Semanas em falta até hoje
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
                  {weeklyCoverage.missing_recent_weeks_count}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Comparação entre a última semana importada e a semana atual.
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100 p-5 dark:border-sky-900/40 dark:bg-sky-950/20">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
                  Buracos históricos
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
                  {weeklyCoverage.missing_historical_weeks_count}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Entre {weeklyCoverage.first_request_date || "-"} e{" "}
                  {weeklyCoverage.last_request_date || "-"}.
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Semanas em falta até à atual
                </div>
                <WeekList
                  items={weeklyCoverage.missing_recent_weeks}
                  emptyLabel="Não há semanas recentes em falta."
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Pré-visualização de falhas históricas
                </div>
                <WeekList
                  items={weeklyCoverage.missing_historical_weeks}
                  emptyLabel="Não há falhas históricas detetadas."
                />
              </div>
            </div>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
