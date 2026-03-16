import ComponentCard from "../../../components/common/ComponentCard";

type FaturacaoPlaceholderTabProps = {
  title: string;
  description: string;
};

export default function FaturacaoPlaceholderTab({
  title,
  description,
}: FaturacaoPlaceholderTabProps) {
  return (
    <ComponentCard title={title} desc={description}>
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
        Esta tab ficou preparada na navegação, mas ainda não tem blocos implementados.
      </div>
    </ComponentCard>
  );
}
