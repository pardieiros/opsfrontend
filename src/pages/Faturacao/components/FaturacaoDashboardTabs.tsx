import {
  FATURACAO_DASHBOARD_TABS,
  type FaturacaoDashboardTabId,
} from "../dashboardShared";

type FaturacaoDashboardTabsProps = {
  activeTab: FaturacaoDashboardTabId;
  onChange: (tab: FaturacaoDashboardTabId) => void;
};

export default function FaturacaoDashboardTabs({
  activeTab,
  onChange,
}: FaturacaoDashboardTabsProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white/80 p-2 dark:border-gray-800 dark:bg-white/[0.03]">
      <nav className="flex min-w-max gap-2">
        {FATURACAO_DASHBOARD_TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-xl px-4 py-3 text-left text-sm transition ${
                isActive
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <span className="block font-semibold">{tab.label}</span>
              <span
                className={`mt-1 block text-xs ${
                  isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
