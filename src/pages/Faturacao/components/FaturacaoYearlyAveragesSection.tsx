import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/button/Button";
import {
  formatMonthlyBreakdownTitle,
  formatRoundedCurrency,
  type YearlyAveragesResponse,
} from "../dashboardShared";

type FaturacaoYearlyAveragesSectionProps = {
  loadingYearlyAverages: boolean;
  openYearlyBreakdownKey: string | null;
  showYearlyAverages: boolean;
  yearlyAveragesData: YearlyAveragesResponse | null;
  yearlyAveragesError: string;
  onLoadYearlyAverages: () => void;
  onToggleBreakdown: (key: string) => void;
};

export default function FaturacaoYearlyAveragesSection({
  loadingYearlyAverages,
  openYearlyBreakdownKey,
  showYearlyAverages,
  yearlyAveragesData,
  yearlyAveragesError,
  onLoadYearlyAverages,
  onToggleBreakdown,
}: FaturacaoYearlyAveragesSectionProps) {
  const [selectedYear, setSelectedYear] = useState("all");

  const availableYears = useMemo(
    () =>
      yearlyAveragesData?.years.map((yearItem) => ({
        value: String(yearItem.year),
        label: yearItem.label,
      })) ?? [],
    [yearlyAveragesData]
  );

  useEffect(() => {
    if (selectedYear === "all") {
      return;
    }

    const hasSelectedYear = availableYears.some(
      (yearItem) => yearItem.value === selectedYear
    );
    if (!hasSelectedYear) {
      setSelectedYear("all");
    }
  }, [availableYears, selectedYear]);

  const visibleYears = useMemo(() => {
    if (!yearlyAveragesData) {
      return [];
    }
    if (selectedYear === "all") {
      return yearlyAveragesData.years;
    }
    return yearlyAveragesData.years.filter(
      (yearItem) => String(yearItem.year) === selectedYear
    );
  }, [selectedYear, yearlyAveragesData]);

  const filteredSummaryPrinttypes = useMemo(() => {
    if (!visibleYears.length) {
      return [];
    }

    const totals = new Map<string, number>();
    visibleYears.forEach((yearItem) => {
      yearItem.printtypes.forEach((printtype) => {
        totals.set(
          printtype.label,
          (totals.get(printtype.label) || 0) + printtype.total_printcost
        );
      });
    });

    return Array.from(totals.entries()).map(([label, total_printcost]) => ({
      label,
      total_printcost,
    }));
  }, [visibleYears]);

  const filteredCombinedPrintcost = useMemo(
    () =>
      filteredSummaryPrinttypes.reduce(
        (sum, item) => sum + item.total_printcost,
        0
      ),
    [filteredSummaryPrinttypes]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onLoadYearlyAverages} disabled={loadingYearlyAverages}>
          {loadingYearlyAverages ? "A preencher os dados..." : "Relatório printcost"}
        </Button>
        {yearlyAveragesData && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Base ativa: {yearlyAveragesData.upload.filename}
          </span>
        )}
      </div>

      {yearlyAveragesError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {yearlyAveragesError}
        </div>
      )}

      {loadingYearlyAverages && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          O relatório está a ser preparado em segundo plano.
        </p>
      )}

      {showYearlyAverages && yearlyAveragesData && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="all">Todos os anos</option>
                {availableYears.map((yearItem) => (
                  <option key={yearItem.value} value={yearItem.value}>
                    {yearItem.label}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              O relatório usa toda a base importada e podes filtrar um ano específico
              ou ver todos os anos em conjunto.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {visibleYears.map((yearItem) => (
              <div
                key={yearItem.year}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Ano
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                      {yearItem.label}
                    </h3>
                  </div>
                  <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-white/5 dark:text-gray-300">
                    {yearItem.months_count} meses
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {yearItem.printtypes.map((printtype) => {
                    const breakdownKey = `${yearItem.year}-${printtype.label}`;
                    const isOpen = openYearlyBreakdownKey === breakdownKey;

                    return (
                      <div
                        key={breakdownKey}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/5"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {printtype.label}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <button
                            type="button"
                            title={formatMonthlyBreakdownTitle(
                              printtype.monthly_breakdown
                            )}
                            onClick={() => onToggleBreakdown(breakdownKey)}
                            className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-white/5 dark:hover:bg-emerald-950/20"
                          >
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                              Total
                            </div>
                            <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                              {formatRoundedCurrency(printtype.total_printcost)}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Clica para ver os meses
                            </div>
                          </button>

                          <div className="rounded-xl border border-sky-200 bg-white px-4 py-3 dark:border-sky-900/40 dark:bg-white/5">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                              Média mensal
                            </div>
                            <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                              {formatRoundedCurrency(
                                printtype.avg_monthly_printcost
                              )}
                            </div>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-black/10">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                              Totais por mês
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              {printtype.monthly_breakdown.map((item) => {
                                const isBest =
                                  item.label === printtype.best_month.label;
                                const isWorst =
                                  item.label === printtype.worst_month.label;

                                return (
                                  <div
                                    key={`${breakdownKey}-${item.label}`}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                      isBest
                                        ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                                        : isWorst
                                          ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                          : "bg-gray-50 dark:bg-white/5"
                                    }`}
                                  >
                                    <span
                                      className={
                                        isBest
                                          ? "text-green-700 dark:text-green-200"
                                          : isWorst
                                            ? "text-red-700 dark:text-red-200"
                                            : "text-gray-600 dark:text-gray-300"
                                      }
                                    >
                                      {item.label}
                                    </span>
                                    <strong
                                      className={
                                        isBest
                                          ? "text-green-800 dark:text-green-100"
                                          : isWorst
                                            ? "text-red-800 dark:text-red-100"
                                            : "text-gray-900 dark:text-white"
                                      }
                                    >
                                      {formatRoundedCurrency(item.value)}
                                    </strong>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 text-sm font-medium text-green-700 dark:text-green-300">
                          Melhor mês: {printtype.best_month.label || "-"} (
                          {formatRoundedCurrency(printtype.best_month.value)})
                        </div>
                        <div className="text-sm font-medium text-red-700 dark:text-red-300">
                          Pior mês: {printtype.worst_month.label || "-"} (
                          {formatRoundedCurrency(printtype.worst_month.value)})
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-100 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                    Soma global printcost
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    {yearItem.printtypes.map((printtype) => (
                      <div
                        key={`${yearItem.year}-summary-${printtype.label}`}
                        className="rounded-xl bg-white/80 px-4 py-3 dark:bg-white/5"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {printtype.label}
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {formatRoundedCurrency(printtype.total_printcost)}
                        </div>
                      </div>
                    ))}
                    <div className="rounded-xl bg-emerald-600 px-4 py-3 text-white">
                      <div className="text-sm font-medium">Total</div>
                      <div className="mt-1 text-lg font-semibold">
                        {formatRoundedCurrency(
                          yearItem.printtypes.reduce(
                            (sum, printtype) => sum + printtype.total_printcost,
                            0
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-100 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                {selectedYear === "all"
                  ? "Soma global printcost"
                  : `Soma global printcost ${selectedYear}`}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                {filteredSummaryPrinttypes.map((item) => (
                  <div
                    key={`summary-${item.label}`}
                    className="rounded-xl bg-white/80 px-4 py-3 dark:bg-white/5"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {formatRoundedCurrency(item.total_printcost)}
                  </div>
                </div>
              ))}
                <div className="rounded-xl bg-emerald-600 px-4 py-3 text-white">
                  <div className="text-sm font-medium">Total</div>
                  <div className="mt-1 text-lg font-semibold">
                    {formatRoundedCurrency(filteredCombinedPrintcost)}
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
