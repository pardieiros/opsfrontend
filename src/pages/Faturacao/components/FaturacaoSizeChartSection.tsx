import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import Button from "../../../components/ui/button/Button";
import {
  formatNumber,
  type ChartDatum,
  type ChartsResponse,
} from "../dashboardShared";

type FaturacaoSizeChartSectionProps = {
  activeSizeSeries: ChartDatum[];
  chartData: ChartsResponse;
  selectedSize: string | null;
  sizeChartHeight: number;
  sizeChartOptions: ApexOptions;
  onClearSelectedSize: () => void;
};

export default function FaturacaoSizeChartSection({
  activeSizeSeries,
  chartData,
  selectedSize,
  sizeChartHeight,
  sizeChartOptions,
  onClearSelectedSize,
}: FaturacaoSizeChartSectionProps) {
  return (
    <>
      {selectedSize && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClearSelectedSize}>
            Voltar aos sizes
          </Button>
        </div>
      )}

      <Chart
        options={sizeChartOptions}
        series={[
          {
            name: selectedSize ? "Quantity por papercode" : "Quantity por size",
            data: activeSizeSeries.map((item) => item.value),
          },
        ]}
        type="bar"
        height={sizeChartHeight}
      />

      {activeSizeSeries.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total no período:{" "}
          <strong>{formatNumber(chartData.summary.quantity_total)}</strong>{" "}
          unidades em{" "}
          <strong>{formatNumber(chartData.summary.matched_rows)}</strong> linhas.
        </p>
      )}
    </>
  );
}
