import ComponentCard from "../../../components/common/ComponentCard";
import type { YearlyAveragesResponse } from "../dashboardShared";
import FaturacaoYearlyAveragesSection from "./FaturacaoYearlyAveragesSection";

type FaturacaoPrintCostsTabProps = {
  loadingYearlyAverages: boolean;
  openYearlyBreakdownKey: string | null;
  showYearlyAverages: boolean;
  yearlyAveragesData: YearlyAveragesResponse | null;
  yearlyAveragesError: string;
  onLoadYearlyAverages: () => void;
  onToggleYearlyBreakdown: (key: string) => void;
};

export default function FaturacaoPrintCostsTab({
  loadingYearlyAverages,
  openYearlyBreakdownKey,
  showYearlyAverages,
  yearlyAveragesData,
  yearlyAveragesError,
  onLoadYearlyAverages,
  onToggleYearlyBreakdown,
}: FaturacaoPrintCostsTabProps) {
  return (
    <ComponentCard
      title="Relatório printcost"
      desc="Carrega por ano o total, média mensal, melhor mês e pior mês de FLEXOGRAFIA, DIGITAL e SERIGRAFIA."
    >
      <FaturacaoYearlyAveragesSection
        loadingYearlyAverages={loadingYearlyAverages}
        openYearlyBreakdownKey={openYearlyBreakdownKey}
        showYearlyAverages={showYearlyAverages}
        yearlyAveragesData={yearlyAveragesData}
        yearlyAveragesError={yearlyAveragesError}
        onLoadYearlyAverages={onLoadYearlyAverages}
        onToggleBreakdown={onToggleYearlyBreakdown}
      />
    </ComponentCard>
  );
}
