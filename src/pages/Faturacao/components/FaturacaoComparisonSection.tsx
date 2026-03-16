import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import {
  formatCurrency,
  formatNumber,
  type PrinttypegroupComparisonResponse,
} from "../dashboardShared";

type FaturacaoComparisonSectionProps = {
  comparisonChartOptions: ApexOptions;
  comparisonData: PrinttypegroupComparisonResponse | null;
  comparisonDateFrom: string;
  comparisonDateFromB: string;
  comparisonDateTo: string;
  comparisonDateToB: string;
  comparisonError: string;
  comparisonPrinttypeChartOptions: ApexOptions;
  hasCompared: boolean;
  loadingComparison: boolean;
  onCompare: () => void;
  onComparisonDateFromBChange: (value: string) => void;
  onComparisonDateFromChange: (value: string) => void;
  onComparisonDateToBChange: (value: string) => void;
  onComparisonDateToChange: (value: string) => void;
};

export default function FaturacaoComparisonSection({
  comparisonChartOptions,
  comparisonData,
  comparisonDateFrom,
  comparisonDateFromB,
  comparisonDateTo,
  comparisonDateToB,
  comparisonError,
  comparisonPrinttypeChartOptions,
  hasCompared,
  loadingComparison,
  onCompare,
  onComparisonDateFromBChange,
  onComparisonDateFromChange,
  onComparisonDateToBChange,
  onComparisonDateToChange,
}: FaturacaoComparisonSectionProps) {
  const comparisonSizeSeries = comparisonData?.sizes_chart ?? [];
  const comparisonPrinttypeSeries = comparisonData?.printtypegroup_chart ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="mb-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Período X
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data inicial
              </label>
              <Input
                type="date"
                value={comparisonDateFrom}
                onChange={(event) =>
                  onComparisonDateFromChange(event.target.value)
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data final
              </label>
              <Input
                type="date"
                value={comparisonDateTo}
                onChange={(event) => onComparisonDateToChange(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
            Período Y
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data inicial
              </label>
              <Input
                type="date"
                value={comparisonDateFromB}
                onChange={(event) =>
                  onComparisonDateFromBChange(event.target.value)
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data final
              </label>
              <Input
                type="date"
                value={comparisonDateToB}
                onChange={(event) =>
                  onComparisonDateToBChange(event.target.value)
                }
              />
            </div>
          </div>
        </div>

        <Button onClick={onCompare} disabled={loadingComparison}>
          {loadingComparison ? "A preencher os dados..." : "Comparar"}
        </Button>
      </div>

      {comparisonError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {comparisonError}
        </div>
      )}

      {loadingComparison && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          A comparação está a ser preparada em segundo plano.
        </p>
      )}

      {!hasCompared && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Este bloco é independente da análise principal e só compara o{" "}
          <strong>printcost</strong> por <strong>printtypegroup</strong>.
        </p>
      )}

      {hasCompared && comparisonData && (
        <>
          <div className="space-y-4">
            <Chart
              options={comparisonChartOptions}
              series={[
                {
                  name: `${comparisonData.filters.period_x.date_from} -> ${comparisonData.filters.period_x.date_to}`,
                  data: comparisonSizeSeries.map((item) => item.period_x_quantity),
                },
                {
                  name: `${comparisonData.filters.period_y.date_from} -> ${comparisonData.filters.period_y.date_to}`,
                  data: comparisonSizeSeries.map((item) => item.period_y_quantity),
                },
              ]}
              type="bar"
              height={440}
            />
          </div>

          <div className="space-y-4">
            <Chart
              options={comparisonPrinttypeChartOptions}
              series={[
                {
                  name: `Quantity ${comparisonData.filters.period_x.date_from} -> ${comparisonData.filters.period_x.date_to}`,
                  type: "column",
                  data: comparisonPrinttypeSeries.map(
                    (item) => item.period_x_quantity
                  ),
                },
                {
                  name: `Quantity ${comparisonData.filters.period_y.date_from} -> ${comparisonData.filters.period_y.date_to}`,
                  type: "column",
                  data: comparisonPrinttypeSeries.map(
                    (item) => item.period_y_quantity
                  ),
                },
                {
                  name: `Printcost ${comparisonData.filters.period_x.date_from} -> ${comparisonData.filters.period_x.date_to}`,
                  type: "line",
                  data: comparisonPrinttypeSeries.map(
                    (item) => item.period_x_printcost
                  ),
                },
                {
                  name: `Printcost ${comparisonData.filters.period_y.date_from} -> ${comparisonData.filters.period_y.date_to}`,
                  type: "line",
                  data: comparisonPrinttypeSeries.map(
                    (item) => item.period_y_printcost
                  ),
                },
              ]}
              type="line"
              height={460}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {comparisonData.filters.period_x.date_from} {" -> "}
                  {comparisonData.filters.period_x.date_to}
                </p>
                <div className="mt-4 space-y-3">
                  {comparisonPrinttypeSeries.map((item) => (
                    <div
                      key={`period-x-${item.label}`}
                      className="rounded-xl bg-white/80 px-4 py-3 text-sm dark:bg-white/5"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="mt-1 text-gray-600 dark:text-gray-300">
                        Qnty: {formatNumber(item.period_x_quantity)}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        Printcost: {formatCurrency(item.period_x_printcost)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  {comparisonData.filters.period_y.date_from} {" -> "}
                  {comparisonData.filters.period_y.date_to}
                </p>
                <div className="mt-4 space-y-3">
                  {comparisonPrinttypeSeries.map((item) => (
                    <div
                      key={`period-y-${item.label}`}
                      className="rounded-xl bg-white/80 px-4 py-3 text-sm dark:bg-white/5"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="mt-1 text-gray-600 dark:text-gray-300">
                        Qnty: {formatNumber(item.period_y_quantity)}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        Printcost: {formatCurrency(item.period_y_printcost)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-white/5">
                <span className="block text-gray-500 dark:text-gray-400">
                  Período X
                </span>
                <strong className="text-gray-900 dark:text-white">
                  {formatNumber(comparisonData.summary.period_x_quantity)} sacos
                </strong>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  | Printcost{" "}
                  {formatCurrency(comparisonData.summary.period_x_printcost)}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-white/5">
                <span className="block text-gray-500 dark:text-gray-400">
                  Período Y
                </span>
                <strong className="text-gray-900 dark:text-white">
                  {formatNumber(comparisonData.summary.period_y_quantity)} sacos
                </strong>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  | Printcost{" "}
                  {formatCurrency(comparisonData.summary.period_y_printcost)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
