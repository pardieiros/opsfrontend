import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";

type FaturacaoSearchSectionProps = {
  authFilename: string;
  dateFrom: string;
  dateTo: string;
  hasSearched: boolean;
  loadingCharts: boolean;
  pageError: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSearch: () => void;
};

export default function FaturacaoSearchSection({
  authFilename,
  dateFrom,
  dateTo,
  hasSearched,
  loadingCharts,
  pageError,
  onDateFromChange,
  onDateToChange,
  onSearch,
}: FaturacaoSearchSectionProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Data inicial
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => onDateFromChange(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Data final
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
          />
        </div>

        <Button onClick={onSearch} disabled={loadingCharts}>
          {loadingCharts ? "A preencher os dados..." : "Pesquisar"}
        </Button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Importação ativa: {authFilename}. O gráfico usa apenas linhas de
        production.
      </p>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {pageError}
        </div>
      )}

      {loadingCharts && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Os gráficos estão a ser preenchidos em segundo plano.
        </p>
      )}

      {!hasSearched && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Escolhe um intervalo de datas pelo campo <strong>request date</strong>{" "}
          para carregar os gráficos.
        </p>
      )}
    </>
  );
}
