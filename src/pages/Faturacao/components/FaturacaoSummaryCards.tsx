import {
  formatCurrency,
  formatNumber,
  type ChartsResponse,
} from "../dashboardShared";

type FaturacaoSummaryCardsProps = {
  chartData: ChartsResponse;
};

export default function FaturacaoSummaryCards({
  chartData,
}: FaturacaoSummaryCardsProps) {
  const printtypegroupSeries = chartData.printtypegroup_chart;

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          País que mais comprou
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
          {chartData.summary.top_country || "Sem dados"}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {formatNumber(chartData.summary.top_country_quantity)} sacos no período
          selecionado
        </p>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100 p-5 dark:border-sky-900/40 dark:bg-sky-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
          Tamanho mais vendido
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
          {chartData.summary.top_size || "Sem dados"}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {formatNumber(chartData.summary.top_size_quantity)} sacos no período
          selecionado
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Sacos por printtypegroup
            </p>
            <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
              {chartData.summary.top_printtypegroup || "Sem dados"}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {formatNumber(chartData.summary.top_printtypegroup_quantity)} sacos
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Printcost:{" "}
              {formatCurrency(chartData.summary.top_printtypegroup_printcost)}
            </p>
          </div>
          <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm dark:bg-white/10 dark:text-amber-200">
            Top grupo
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {printtypegroupSeries.slice(0, 4).map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-sm dark:bg-white/5"
            >
              <div className="min-w-0 pr-4">
                <span className="block truncate text-gray-700 dark:text-gray-200">
                  {item.label}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Printcost: {formatCurrency(item.printcost)}
                </span>
              </div>
              <strong className="shrink-0 text-gray-900 dark:text-white">
                {formatNumber(item.value)}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
