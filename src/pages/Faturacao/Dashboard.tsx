import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  authenticateFaturacaoDashboard,
  getFaturacaoDashboardCharts,
  getFaturacaoPrinttypegroupComparison,
  getFaturacaoPrinttypegroupDetails,
  getFaturacaoDashboardSettings,
  getFaturacaoYearlyAverages,
  uploadFaturacaoDashboardExcel,
} from "../../serviceapi/api";
import { Modal } from "../../components/ui/modal";
import Spinner from "../../components/ui/loaders/Spinner";
import FaturacaoAccessCard from "./components/FaturacaoAccessCard";
import FaturacaoDashboardContent from "./components/FaturacaoDashboardContent";
import FaturacaoDashboardTabs from "./components/FaturacaoDashboardTabs";
import FaturacaoPlaceholderTab from "./components/FaturacaoPlaceholderTab";
import FaturacaoPrintCostsTab from "./components/FaturacaoPrintCostsTab";
import FaturacaoRestrictedCard from "./components/FaturacaoRestrictedCard";
import FaturacaoSettingsTab from "./components/FaturacaoSettingsTab";
import {
  FATURACAO_DASHBOARD_TABS,
  PASSWORD_KEY,
  escapeHtml,
  formatCurrency,
  formatNumber,
  readStoredUser,
  type AuthResponse,
  type ChartsResponse,
  type FaturacaoDashboardTabId,
  type FaturacaoSettingsResponse,
  type PrinttypegroupComparisonResponse,
  type PrinttypegroupDetailsResponse,
  type YearlyAveragesResponse,
} from "./dashboardShared";

export default function FaturacaoDashboardPage() {
  const currentUser = useMemo(() => readStoredUser(), []);
  const isSuperuser = Boolean(currentUser?.is_superuser);

  const [activeTab, setActiveTab] =
    useState<FaturacaoDashboardTabId>("faturacao");
  const [passwordInput, setPasswordInput] = useState("");
  const [accessPassword, setAccessPassword] = useState(
    () => sessionStorage.getItem(PASSWORD_KEY) || ""
  );
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [chartData, setChartData] = useState<ChartsResponse | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [pageError, setPageError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [comparisonDateFrom, setComparisonDateFrom] = useState("");
  const [comparisonDateTo, setComparisonDateTo] = useState("");
  const [comparisonDateFromB, setComparisonDateFromB] = useState("");
  const [comparisonDateToB, setComparisonDateToB] = useState("");
  const [comparisonData, setComparisonData] =
    useState<PrinttypegroupComparisonResponse | null>(null);
  const [comparisonError, setComparisonError] = useState("");
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<PrinttypegroupDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [detailsSelectedSize, setDetailsSelectedSize] = useState<string | null>(null);
  const [detailsTitle, setDetailsTitle] = useState("");

  const [yearlyAveragesData, setYearlyAveragesData] =
    useState<YearlyAveragesResponse | null>(null);
  const [loadingYearlyAverages, setLoadingYearlyAverages] = useState(false);
  const [yearlyAveragesError, setYearlyAveragesError] = useState("");
  const [showYearlyAverages, setShowYearlyAverages] = useState(false);
  const [openYearlyBreakdownKey, setOpenYearlyBreakdownKey] = useState<
    string | null
  >(null);
  const [settingsData, setSettingsData] =
    useState<FaturacaoSettingsResponse | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadingSettingsFile, setUploadingSettingsFile] = useState(false);
  const [settingsUploadError, setSettingsUploadError] = useState("");
  const [settingsUploadSuccess, setSettingsUploadSuccess] = useState("");

  useEffect(() => {
    if (!isSuperuser || !accessPassword || authData) {
      return;
    }

    let active = true;
    setLoadingAuth(true);
    setAuthError("");

    authenticateFaturacaoDashboard(accessPassword)
      .then((response: AuthResponse) => {
        if (!active) {
          return;
        }

        setAuthData(response);
      })
      .catch((error: Error) => {
        if (!active) {
          return;
        }

        sessionStorage.removeItem(PASSWORD_KEY);
        setAccessPassword("");
        setAuthData(null);
        setAuthError(error.message || "Password inválida.");
      })
      .finally(() => {
        if (active) {
          setLoadingAuth(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessPassword, authData, isSuperuser]);

  const handleAuthenticate = async () => {
    if (!passwordInput.trim()) {
      setAuthError("Indica a password secundária.");
      return;
    }

    setLoadingAuth(true);
    setAuthError("");

    try {
      const response: AuthResponse = await authenticateFaturacaoDashboard(
        passwordInput
      );
      sessionStorage.setItem(PASSWORD_KEY, passwordInput);
      setAccessPassword(passwordInput);
      setAuthData(response);
      setPasswordInput("");
    } catch (error: any) {
      setAuthError(error?.message || "Password inválida.");
      setAuthData(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSearch = async () => {
    if (!accessPassword) {
      setPageError("Autentica primeiro o acesso à faturação.");
      return;
    }

    if (!dateFrom || !dateTo) {
      setPageError("Indica a data inicial e a data final.");
      return;
    }

    setLoadingCharts(true);
    setPageError("");
    setHasSearched(true);
    setSelectedSize(null);

    try {
      const response: ChartsResponse = await getFaturacaoDashboardCharts(
        {
          date_from: dateFrom,
          date_to: dateTo,
        },
        accessPassword
      );

      setChartData(response);
    } catch (error: any) {
      setChartData(null);
      setPageError(error?.message || "Falha ao carregar os gráficos.");
    } finally {
      setLoadingCharts(false);
    }
  };

  const handleCompare = async () => {
    if (!accessPassword) {
      setComparisonError("Autentica primeiro o acesso à faturação.");
      return;
    }

    if (
      !comparisonDateFrom ||
      !comparisonDateTo ||
      !comparisonDateFromB ||
      !comparisonDateToB
    ) {
      setComparisonError(
        "Preenche os dois intervalos completos para comparar."
      );
      return;
    }

    setLoadingComparison(true);
    setComparisonError("");
    setHasCompared(true);

    try {
      const response: PrinttypegroupComparisonResponse =
        await getFaturacaoPrinttypegroupComparison(
          {
            date_from: comparisonDateFrom,
            date_to: comparisonDateTo,
            compare_date_from: comparisonDateFromB,
            compare_date_to: comparisonDateToB,
          },
          accessPassword
        );

      setComparisonData(response);
    } catch (error: any) {
      setComparisonData(null);
      setComparisonError(error?.message || "Falha ao comparar períodos.");
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleOpenPrinttypeDetails = async (period: "x" | "y", label: string) => {
    const dateFrom = period === "x" ? comparisonDateFrom : comparisonDateFromB;
    const dateTo = period === "x" ? comparisonDateTo : comparisonDateToB;

    if (!accessPassword) {
      setDetailsError("Autentica primeiro o acesso à faturação.");
      setDetailsModalOpen(true);
      return;
    }
    if (!dateFrom || !dateTo) {
      setDetailsError("Preenche o intervalo de datas do período selecionado.");
      setDetailsModalOpen(true);
      return;
    }

    setDetailsModalOpen(true);
    setDetailsError("");
    setDetailsData(null);
    setDetailsSelectedSize(null);
    setLoadingDetails(true);
    setDetailsTitle(`${label} — ${dateFrom} → ${dateTo}`);

    try {
      const response: PrinttypegroupDetailsResponse =
        await getFaturacaoPrinttypegroupDetails(
          { date_from: dateFrom, date_to: dateTo, printtypegroup: label },
          accessPassword
        );
      setDetailsData(response);
      if (response.size_chart?.length) {
        setDetailsSelectedSize(response.size_chart[0].label);
      }
    } catch (error: any) {
      setDetailsError(error?.message || "Falha ao carregar o detalhe.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setDetailsError("");
    setDetailsData(null);
    setDetailsSelectedSize(null);
    setDetailsTitle("");
  };

  const handleLoadYearlyAverages = async () => {
    if (!accessPassword) {
      setYearlyAveragesError("Autentica primeiro o acesso à faturação.");
      return;
    }

    setLoadingYearlyAverages(true);
    setYearlyAveragesError("");
    setShowYearlyAverages(true);

    try {
      const response: YearlyAveragesResponse =
        await getFaturacaoYearlyAverages(accessPassword);
      setYearlyAveragesData(response);
      setOpenYearlyBreakdownKey(null);
    } catch (error: any) {
      setYearlyAveragesData(null);
      setYearlyAveragesError(
        error?.message || "Falha ao carregar as médias anuais."
      );
    } finally {
      setLoadingYearlyAverages(false);
    }
  };

  const handleToggleYearlyBreakdown = (key: string) => {
    setOpenYearlyBreakdownKey((current) => (current === key ? null : key));
  };

  const loadSettings = async () => {
    if (!accessPassword) {
      setSettingsError("Autentica primeiro o acesso à faturação.");
      return;
    }

    setLoadingSettings(true);
    setSettingsError("");
    try {
      const response: FaturacaoSettingsResponse =
        await getFaturacaoDashboardSettings(accessPassword);
      setSettingsData(response);
    } catch (error: any) {
      setSettingsError(error?.message || "Falha ao carregar as definições.");
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleUploadSettingsFile = async () => {
    if (!accessPassword) {
      setSettingsUploadError("Autentica primeiro o acesso à faturação.");
      return;
    }
    if (!selectedUploadFile) {
      setSettingsUploadError("Seleciona um ficheiro Excel antes de importar.");
      return;
    }

    setUploadingSettingsFile(true);
    setSettingsUploadError("");
    setSettingsUploadSuccess("");

    try {
      const response: FaturacaoSettingsResponse =
        await uploadFaturacaoDashboardExcel(selectedUploadFile, accessPassword);
      setSettingsData(response);
      if (response.latest_upload) {
        setAuthData({
          ok: true,
          upload: {
            id: response.latest_upload.id,
            filename: response.latest_upload.filename,
            total_rows: response.latest_upload.total_rows,
            production_rows: response.latest_upload.production_rows,
            incidences_rows: response.latest_upload.incidences_rows,
            imported_at: response.latest_upload.imported_at,
          },
        });
      }
      setSelectedUploadFile(null);
      setSettingsUploadSuccess("Importação concluída com sucesso.");
    } catch (error: any) {
      setSettingsUploadError(error?.message || "Falha ao importar o Excel.");
    } finally {
      setUploadingSettingsFile(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "settings" || !accessPassword || !authData) {
      return;
    }

    void loadSettings();
  }, [activeTab, accessPassword, authData]);

  const sizeOverview = chartData?.size_chart ?? [];
  const sizeDrilldown = selectedSize
    ? chartData?.size_drilldown[selectedSize] ?? []
    : [];
  const activeSizeSeries = selectedSize ? sizeDrilldown : sizeOverview;
  const countrySeries = chartData?.country_chart ?? [];
  const comparisonSizeSeries = comparisonData?.sizes_chart ?? [];
  const comparisonPrinttypeSeries = comparisonData?.printtypegroup_chart ?? [];
  const sizeChartHeight = Math.max(360, activeSizeSeries.length * 34);

  const sizeChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
        animations: { easing: "easeinout", speed: 450 },
        events: {
          dataPointSelection: (_event, _chartContext, config) => {
            if (selectedSize) {
              return;
            }

            const nextSize = sizeOverview[config.dataPointIndex]?.label;
            if (nextSize) {
              setSelectedSize(nextSize);
            }
          },
        },
      },
      colors: selectedSize
        ? ["#0f766e"]
        : ["#0f766e", "#14b8a6", "#22c55e", "#84cc16", "#f59e0b"],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          distributed: !selectedSize,
          barHeight: "72%",
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
      },
      xaxis: {
        categories: activeSizeSeries.map((item) => item.label),
        labels: {
          formatter: (value) => formatNumber(Number(value)),
        },
        title: {
          text: "Quantity somada",
        },
      },
      yaxis: {
        labels: {
          maxWidth: 260,
        },
      },
      tooltip: {
        y: {
          formatter: (value) => `${formatNumber(Number(value))} unidades`,
        },
      },
      legend: { show: false },
      states: {
        hover: {
          filter: {
            type: "lighten",
            value: 0.04,
          },
        },
      },
      noData: {
        text: "Sem dados para o periodo selecionado.",
      },
    }),
    [activeSizeSeries, selectedSize, sizeOverview]
  );

  const countryChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
      },
      labels: countrySeries.map((item) => item.label),
      colors: [
        "#0f766e",
        "#14b8a6",
        "#0ea5e9",
        "#2563eb",
        "#f59e0b",
        "#f97316",
        "#dc2626",
        "#8b5cf6",
        "#6366f1",
        "#84cc16",
        "#475569",
        "#a855f7",
      ],
      legend: {
        position: "bottom",
      },
      dataLabels: {
        enabled: true,
        formatter: (_value, options) =>
          countrySeries[options.seriesIndex]?.label || "",
      },
      tooltip: {
        custom: ({ seriesIndex }) => {
          const country = countrySeries[seriesIndex];
          if (!country) {
            return "";
          }

          const rows = country.breakdown
            .map(
              (item) =>
                `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:6px;"><span>${escapeHtml(
                  item.label
                )}</span><strong>${escapeHtml(
                  formatNumber(item.value)
                )}</strong></div>`
            )
            .join("");

          return `
            <div style="padding:12px 14px;min-width:260px;">
              <div style="font-weight:700;margin-bottom:8px;">${escapeHtml(
                country.label
              )}</div>
              <div style="display:flex;justify-content:space-between;gap:16px;">
                <span>Total quantity</span>
                <strong>${escapeHtml(formatNumber(country.value))}</strong>
              </div>
              <div style="margin-top:10px;font-size:12px;color:#475569;">Printtypegroup</div>
              ${rows || '<div style="margin-top:6px;">Sem detalhe.</div>'}
            </div>
          `;
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "58%",
          },
        },
      },
      stroke: {
        colors: ["#ffffff"],
      },
      noData: {
        text: "Sem dados para o periodo selecionado.",
      },
    }),
    [countrySeries]
  );

  const comparisonChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
      },
      colors: ["#0f766e", "#f59e0b"],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: "68%",
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
      },
      xaxis: {
        categories: comparisonSizeSeries.map((item) => item.label),
        title: {
          text: "Quantity somada",
        },
        labels: {
          formatter: (value) => formatNumber(Number(value)),
        },
      },
      yaxis: {
        labels: {
          maxWidth: 260,
        },
      },
      legend: {
        position: "top",
      },
      tooltip: {
        y: {
          formatter: (value) => `${formatNumber(Number(value))} unidades`,
        },
      },
      noData: {
        text: "Preenche os dois intervalos para comparar sizes.",
      },
    }),
    [comparisonSizeSeries]
  );

  const comparisonPrinttypeChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
      },
      colors: ["#0f766e", "#f59e0b", "#14b8a6", "#f97316"],
      stroke: {
        width: [0, 0, 3, 3],
        curve: "smooth",
      },
      plotOptions: {
        bar: {
          columnWidth: "42%",
          borderRadius: 6,
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: comparisonPrinttypeSeries.map((item) => item.label),
      },
      yaxis: [
        {
          title: {
            text: "Quantity",
          },
          labels: {
            formatter: (value) => formatNumber(Number(value)),
          },
        },
        {
          opposite: true,
          title: {
            text: "Printcost",
          },
          labels: {
            formatter: (value) => formatNumber(Number(value)),
          },
        },
      ],
      legend: {
        position: "top",
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (value) => formatNumber(Number(value)),
        },
      },
      noData: {
        text: "Sem dados para as artes de impressao nos periodos selecionados.",
      },
    }),
    [comparisonPrinttypeSeries]
  );

  const detailsSizeChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
        events: {
          dataPointSelection: (_event, _ctx, config) => {
            const sizeLabel = detailsData?.size_chart[config.dataPointIndex]?.label;
            if (sizeLabel) {
              setDetailsSelectedSize(sizeLabel);
            }
          },
        },
      },
      colors: ["#0ea5e9"],
      plotOptions: {
        bar: {
          columnWidth: "48%",
          borderRadius: 6,
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: detailsData?.size_chart.map((item) => item.label) ?? [],
        title: { text: "Sizes" },
      },
      yaxis: {
        title: { text: "Sacos" },
        labels: { formatter: (value) => formatNumber(Number(value)) },
      },
      tooltip: {
        y: {
          formatter: (value) => `${formatNumber(Number(value))} sacos`,
        },
      },
      noData: { text: "Sem dados para o printtypegroup selecionado." },
    }),
    [detailsData]
  );

  if (!isSuperuser) {
    return (
      <div>
        <PageMeta
          title="Faturação Analytics - Portal do Trabalhador"
          description="Dashboard reservado a super admins"
        />
        <PageBreadcrumb pageTitle="Faturação Analytics" />
        <FaturacaoRestrictedCard />
      </div>
    );
  }

  if (!accessPassword || !authData) {
    return (
      <div>
        <PageMeta
          title="Faturação Analytics - Portal do Trabalhador"
          description="Dashboard analítico da faturação"
        />
        <PageBreadcrumb pageTitle="Faturação Analytics" />
        <FaturacaoAccessCard
          authError={authError}
          loadingAuth={loadingAuth}
          passwordInput={passwordInput}
          onAuthenticate={handleAuthenticate}
          onPasswordChange={setPasswordInput}
        />
      </div>
    );
  }

  const selectedTabMeta = FATURACAO_DASHBOARD_TABS.find(
    (tab) => tab.id === activeTab
  );

  return (
    <div className="space-y-6">
      <PageMeta
        title="Faturação Analytics - Portal do Trabalhador"
        description="Dashboard analítico da faturação"
      />
      <PageBreadcrumb pageTitle="Faturação Analytics" />

      <FaturacaoDashboardTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "faturacao" ? (
        <FaturacaoDashboardContent
          activeSizeSeries={activeSizeSeries}
          authFilename={authData.upload.filename}
          chartData={chartData}
          comparisonChartOptions={comparisonChartOptions}
          comparisonData={comparisonData}
          comparisonDateFrom={comparisonDateFrom}
          comparisonDateFromB={comparisonDateFromB}
          comparisonDateTo={comparisonDateTo}
          comparisonDateToB={comparisonDateToB}
          comparisonError={comparisonError}
          comparisonPrinttypeChartOptions={comparisonPrinttypeChartOptions}
          countryChartOptions={countryChartOptions}
          countrySeries={countrySeries}
          dateFrom={dateFrom}
          dateTo={dateTo}
          hasCompared={hasCompared}
          hasSearched={hasSearched}
          loadingCharts={loadingCharts}
          loadingComparison={loadingComparison}
          pageError={pageError}
          selectedSize={selectedSize}
          sizeChartHeight={sizeChartHeight}
          sizeChartOptions={sizeChartOptions}
          onClearSelectedSize={() => setSelectedSize(null)}
          onCompare={handleCompare}
          onComparisonDateFromBChange={setComparisonDateFromB}
          onComparisonDateFromChange={setComparisonDateFrom}
          onComparisonDateToBChange={setComparisonDateToB}
          onComparisonDateToChange={setComparisonDateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onOpenDetails={handleOpenPrinttypeDetails}
          onSearch={handleSearch}
        />
      ) : activeTab === "print-costs" ? (
        <FaturacaoPrintCostsTab
          loadingYearlyAverages={loadingYearlyAverages}
          openYearlyBreakdownKey={openYearlyBreakdownKey}
          showYearlyAverages={showYearlyAverages}
          yearlyAveragesData={yearlyAveragesData}
          yearlyAveragesError={yearlyAveragesError}
          onLoadYearlyAverages={handleLoadYearlyAverages}
          onToggleYearlyBreakdown={handleToggleYearlyBreakdown}
        />
      ) : activeTab === "settings" ? (
        <FaturacaoSettingsTab
          loadingSettings={loadingSettings}
          settingsData={settingsData}
          settingsError={settingsError}
          uploadError={settingsUploadError}
          uploadSuccess={settingsUploadSuccess}
          uploadingFile={uploadingSettingsFile}
          selectedFileName={selectedUploadFile?.name || ""}
          onFileChange={setSelectedUploadFile}
          onRefresh={loadSettings}
          onUpload={handleUploadSettingsFile}
        />
      ) : (
        <FaturacaoPlaceholderTab
          title={selectedTabMeta?.label || "Dashboard"}
          description={selectedTabMeta?.description || "Tab sem descrição."}
        />
      )}

      <Modal isOpen={detailsModalOpen} onClose={handleCloseDetails}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {detailsTitle || "Detalhe de sacos"}
          </h3>
        </div>
        {loadingDetails && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200 space-y-3">
            <div className="flex items-center gap-3">
              <Spinner />
              <span>A preencher os dados, aguarda um momento...</span>
            </div>
            <div className="h-2 w-full rounded-full bg-blue-100 dark:bg-blue-900/40 overflow-hidden">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500/80 dark:bg-blue-400/60" />
            </div>
          </div>
        )}

        {detailsError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {detailsError}
          </div>
        )}

        {detailsData && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-white/5">
                <div className="text-gray-500 dark:text-gray-400">Planos</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(detailsData.summary.planos)}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-white/5">
                <div className="text-gray-500 dark:text-gray-400">Sacos</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(detailsData.summary.quantity)}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-white/5">
                <div className="text-gray-500 dark:text-gray-400">Printcost</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(detailsData.summary.printcost)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Stockcost {formatCurrency(detailsData.summary.stockcost)} | Handling{" "}
                  {formatCurrency(detailsData.summary.handlingcost)}
                </div>
              </div>
            </div>

            <Chart
              options={detailsSizeChartOptions}
              series={[
                {
                  name: "Sacos",
                  data: detailsData.size_chart.map((item) => item.value),
                },
              ]}
              type="bar"
              height={320}
            />

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Papercodes do size {detailsSelectedSize || "—"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Clica numa barra do gráfico para mudar de size.
                </div>
              </div>
              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                {(detailsSelectedSize
                  ? detailsData.size_drilldown[detailsSelectedSize] || []
                  : []
                ).map((item) => (
                  <div
                    key={`${detailsSelectedSize}-${item.label}`}
                    className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-white/5"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.label} {item.color ? `(${item.color})` : ""}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                      Sacos: {formatNumber(item.quantity)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Printcost {formatCurrency(item.printcost)} | Stockcost{" "}
                      {formatCurrency(item.stockcost)} | Handling {formatCurrency(item.handlingcost)}
                      {" "} | Planos {formatNumber(item.planos)}
                    </div>
                  </div>
                ))}
                {!detailsSelectedSize && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Seleciona um size no gráfico para ver o detalhe por papercode.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
