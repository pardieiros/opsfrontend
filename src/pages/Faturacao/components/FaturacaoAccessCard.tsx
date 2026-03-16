import ComponentCard from "../../../components/common/ComponentCard";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";

type FaturacaoAccessCardProps = {
  authError: string;
  loadingAuth: boolean;
  passwordInput: string;
  onAuthenticate: () => void;
  onPasswordChange: (value: string) => void;
};

export default function FaturacaoAccessCard({
  authError,
  loadingAuth,
  passwordInput,
  onAuthenticate,
  onPasswordChange,
}: FaturacaoAccessCardProps) {
  return (
    <ComponentCard
      title="Desbloquear faturação"
      desc="Introduz a password secundária para consultar os gráficos de faturação."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password secundária
          </label>
          <Input
            type="password"
            value={passwordInput}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Password"
          />
        </div>

        {authError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {authError}
          </div>
        )}

        <Button onClick={onAuthenticate} disabled={loadingAuth}>
          {loadingAuth ? "A validar..." : "Entrar"}
        </Button>
      </div>
    </ComponentCard>
  );
}
