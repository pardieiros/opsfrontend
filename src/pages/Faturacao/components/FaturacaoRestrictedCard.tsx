import ComponentCard from "../../../components/common/ComponentCard";

export default function FaturacaoRestrictedCard() {
  return (
    <ComponentCard title="Acesso restrito">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Esta página está disponível apenas para super admins.
      </p>
    </ComponentCard>
  );
}
