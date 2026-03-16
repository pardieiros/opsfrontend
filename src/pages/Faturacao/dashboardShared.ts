export type FaturacaoLatestUpload = {
  id: number;
  filename: string;
  status?: string;
  total_rows: number;
  production_rows: number;
  incidences_rows: number;
  total_tables?: number;
  imported_at: string | null;
  created_at?: string;
  error_message?: string;
};

export type AuthResponse = {
  ok: boolean;
  upload: FaturacaoLatestUpload;
};

export type ChartDatum = {
  label: string;
  value: number;
};

export type PrinttypegroupDatum = ChartDatum & {
  printcost: number;
};

export type CountryChartDatum = ChartDatum & {
  breakdown: ChartDatum[];
};

export type ChartsResponse = {
  upload: {
    id: number;
    filename: string;
    imported_at: string;
  };
  filters: {
    date_from: string;
    date_to: string;
    table_kind: string;
  };
  summary: {
    matched_rows: number;
    quantity_total: number;
    printcost_total: number;
    top_size: string;
    top_size_quantity: number;
    top_country: string;
    top_country_quantity: number;
    top_printtypegroup: string;
    top_printtypegroup_quantity: number;
    top_printtypegroup_printcost: number;
  };
  size_chart: ChartDatum[];
  size_drilldown: Record<string, ChartDatum[]>;
  country_chart: CountryChartDatum[];
  printtypegroup_chart: PrinttypegroupDatum[];
  comparison: {
    filters: {
      date_from: string;
      date_to: string;
      table_kind: string;
    };
    summary: {
      matched_rows: number;
      quantity_total: number;
      printcost_total: number;
    };
    size_chart: {
      label: string;
      primary_value: number;
      secondary_value: number;
    }[];
  } | null;
};

export type PrinttypegroupComparisonResponse = {
  filters: {
    period_x: {
      date_from: string;
      date_to: string;
    };
    period_y: {
      date_from: string;
      date_to: string;
    };
    table_kind: string;
  };
  summary: {
    period_x_printcost: number;
    period_y_printcost: number;
    period_x_quantity: number;
    period_y_quantity: number;
    period_x_rows: number;
    period_y_rows: number;
  };
  sizes_chart: {
    label: string;
    period_x_quantity: number;
    period_y_quantity: number;
  }[];
  printtypegroup_chart: {
    label: string;
    period_x_quantity: number;
    period_x_printcost: number;
    period_y_quantity: number;
    period_y_printcost: number;
  }[];
};

export type YearlyAveragesResponse = {
  upload: {
    id: number;
    filename: string;
    imported_at: string;
  };
  summary: {
    combined_printcost: number;
    printtypes: {
      label: string;
      total_printcost: number;
    }[];
  };
  years: {
    year: number;
    label: string;
    months_count: number;
    printtypes: {
      label: string;
      total_printcost: number;
      avg_monthly_printcost: number;
      best_month: {
        label: string;
        value: number;
      };
      worst_month: {
        label: string;
        value: number;
      };
      monthly_breakdown: {
        label: string;
        value: number;
      }[];
    }[];
  }[];
};

export type FaturacaoWeekBucket = {
  label: string;
  date_from: string;
  date_to: string;
  row_count: number;
};

export type FaturacaoWeeklyCoverage = {
  first_request_date: string | null;
  last_request_date: string | null;
  latest_week: FaturacaoWeekBucket | null;
  missing_recent_weeks_count: number;
  missing_recent_weeks: FaturacaoWeekBucket[];
  missing_historical_weeks_count: number;
  missing_historical_weeks: FaturacaoWeekBucket[];
  total_weeks_with_data: number;
};

export type FaturacaoSettingsResponse = {
  latest_upload: FaturacaoLatestUpload | null;
  weekly_coverage: FaturacaoWeeklyCoverage;
};

export type FaturacaoDashboardTabId =
  | "faturacao"
  | "stock-cost-sacos"
  | "print-costs"
  | "handling"
  | "settings";

export const FATURACAO_DASHBOARD_TABS: {
  id: FaturacaoDashboardTabId;
  label: string;
  description: string;
}[] = [
  {
    id: "faturacao",
    label: "Faturação",
    description: "Dashboard principal com relatórios, filtros e comparações.",
  },
  {
    id: "stock-cost-sacos",
    label: "Stock Cost Sacos",
    description: "Espaço reservado para análise de custo de stock por saco.",
  },
  {
    id: "print-costs",
    label: "Print Costs",
    description: "Espaço reservado para dashboards específicos de print costs.",
  },
  {
    id: "handling",
    label: "Handling",
    description: "Espaço reservado para custos e indicadores de handling.",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Espaço reservado para configurações do módulo.",
  },
];

export const PASSWORD_KEY = "faturacao-dashboard-password";

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatCurrency(value: number) {
  return `${formatNumber(value)} €`;
}

export function formatRoundedCurrency(value: number) {
  return `${new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(value || 0))} €`;
}

export function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatMonthlyBreakdownTitle(
  items: { label: string; value: number }[]
) {
  if (!items.length) {
    return "Sem detalhe mensal";
  }

  return items
    .map((item) => `${item.label}: ${formatCurrency(item.value)}`)
    .join("\n");
}
