import type { ApexOptions } from "apexcharts";
import ComponentCard from "../../../components/common/ComponentCard";
import {
  type ChartDatum,
  type ChartsResponse,
  type CountryChartDatum,
  type PrinttypegroupComparisonResponse,
} from "../dashboardShared";
import FaturacaoComparisonSection from "./FaturacaoComparisonSection";
import FaturacaoCountryChartSection from "./FaturacaoCountryChartSection";
import FaturacaoSearchSection from "./FaturacaoSearchSection";
import FaturacaoSizeChartSection from "./FaturacaoSizeChartSection";
import FaturacaoSummaryCards from "./FaturacaoSummaryCards";

type FaturacaoDashboardContentProps = {
  activeSizeSeries: ChartDatum[];
  authFilename: string;
  chartData: ChartsResponse | null;
  comparisonChartOptions: ApexOptions;
  comparisonData: PrinttypegroupComparisonResponse | null;
  comparisonDateFrom: string;
  comparisonDateFromB: string;
  comparisonDateTo: string;
  comparisonDateToB: string;
  comparisonError: string;
  comparisonPrinttypeChartOptions: ApexOptions;
  countryChartOptions: ApexOptions;
  countrySeries: CountryChartDatum[];
  dateFrom: string;
  dateTo: string;
  hasCompared: boolean;
  hasSearched: boolean;
  loadingCharts: boolean;
  loadingComparison: boolean;
  pageError: string;
  selectedSize: string | null;
  sizeChartHeight: number;
  sizeChartOptions: ApexOptions;
  onClearSelectedSize: () => void;
  onCompare: () => void;
  onComparisonDateFromBChange: (value: string) => void;
  onComparisonDateFromChange: (value: string) => void;
  onComparisonDateToBChange: (value: string) => void;
  onComparisonDateToChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSearch: () => void;
};

export default function FaturacaoDashboardContent({
  activeSizeSeries,
  authFilename,
  chartData,
  comparisonChartOptions,
  comparisonData,
  comparisonDateFrom,
  comparisonDateFromB,
  comparisonDateTo,
  comparisonDateToB,
  comparisonError,
  comparisonPrinttypeChartOptions,
  countryChartOptions,
  countrySeries,
  dateFrom,
  dateTo,
  hasCompared,
  hasSearched,
  loadingCharts,
  loadingComparison,
  pageError,
  selectedSize,
  sizeChartHeight,
  sizeChartOptions,
  onClearSelectedSize,
  onCompare,
  onComparisonDateFromBChange,
  onComparisonDateFromChange,
  onComparisonDateToBChange,
  onComparisonDateToChange,
  onDateFromChange,
  onDateToChange,
  onSearch,
}: FaturacaoDashboardContentProps) {
  return (
    <>
      <ComponentCard title="Pesquisar por request date">
        <FaturacaoSearchSection
          authFilename={authFilename}
          dateFrom={dateFrom}
          dateTo={dateTo}
          hasSearched={hasSearched}
          loadingCharts={loadingCharts}
          pageError={pageError}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onSearch={onSearch}
        />
      </ComponentCard>

      {hasSearched && chartData && (
        <>
          <FaturacaoSummaryCards chartData={chartData} />

          <ComponentCard
            title={selectedSize ? `Papercode do size ${selectedSize}` : "Sizes mais vendidos"}
            desc={
              selectedSize
                ? "O gráfico mostra a quantity somada por papercode dentro do size selecionado."
                : "Clica num size para abrir o detalhe por papercode."
            }
          >
            <FaturacaoSizeChartSection
              activeSizeSeries={activeSizeSeries}
              chartData={chartData}
              selectedSize={selectedSize}
              sizeChartHeight={sizeChartHeight}
              sizeChartOptions={sizeChartOptions}
              onClearSelectedSize={onClearSelectedSize}
            />
          </ComponentCard>

          <ComponentCard
            title="Distribuição por país"
            desc="Passa o cursor por um país para ver a quantity somada por printtypegroup."
          >
            <FaturacaoCountryChartSection
              countryChartOptions={countryChartOptions}
              countrySeries={countrySeries}
            />
          </ComponentCard>
        </>
      )}

      <ComponentCard
        title="Comparar períodos por printtypegroup"
        desc="Bloco extra. Compara apenas o printcost somado por printtypegroup entre dois intervalos."
      >
        <FaturacaoComparisonSection
          comparisonChartOptions={comparisonChartOptions}
          comparisonData={comparisonData}
          comparisonDateFrom={comparisonDateFrom}
          comparisonDateFromB={comparisonDateFromB}
          comparisonDateTo={comparisonDateTo}
          comparisonDateToB={comparisonDateToB}
          comparisonError={comparisonError}
          comparisonPrinttypeChartOptions={comparisonPrinttypeChartOptions}
          hasCompared={hasCompared}
          loadingComparison={loadingComparison}
          onCompare={onCompare}
          onComparisonDateFromBChange={onComparisonDateFromBChange}
          onComparisonDateFromChange={onComparisonDateFromChange}
          onComparisonDateToBChange={onComparisonDateToBChange}
          onComparisonDateToChange={onComparisonDateToChange}
        />
      </ComponentCard>
    </>
  );
}
