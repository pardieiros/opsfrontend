import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { type CountryChartDatum } from "../dashboardShared";

type FaturacaoCountryChartSectionProps = {
  countryChartOptions: ApexOptions;
  countrySeries: CountryChartDatum[];
};

export default function FaturacaoCountryChartSection({
  countryChartOptions,
  countrySeries,
}: FaturacaoCountryChartSectionProps) {
  return (
    <Chart
      options={countryChartOptions}
      series={countrySeries.map((item) => item.value)}
      type="donut"
      height={420}
    />
  );
}
