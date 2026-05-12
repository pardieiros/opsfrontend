import { fetchWithAuth } from "./api";

const BASE = "/api/360imprimir";

async function parseJsonResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Erro na integração 360Imprimir.");
  }
  return data;
}

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return `${BASE}${path}${queryString ? `?${queryString}` : ""}`;
}

export async function fetch360Summary() {
  const response = await fetchWithAuth(`${BASE}/summary/`, { method: "GET" });
  return parseJsonResponse(response);
}

export async function fetch360Orders(params: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  route_type?: string;
} = {}) {
  const response = await fetchWithAuth(withQuery("/orders/", params), { method: "GET" });
  return parseJsonResponse(response);
}

export async function fetch360ScanEvents(params: {
  page?: number;
  page_size?: number;
  search?: string;
} = {}) {
  const response = await fetchWithAuth(withQuery("/scan-events/", params), { method: "GET" });
  return parseJsonResponse(response);
}

export async function fetch360CalendarEvents() {
  const response = await fetchWithAuth(`${BASE}/calendar-events/`, { method: "GET" });
  return parseJsonResponse(response);
}

export async function trigger360Sync() {
  const response = await fetchWithAuth(`${BASE}/sync/trigger/`, { method: "POST" });
  return parseJsonResponse(response);
}

export async function trigger360BulkPick(destination_email: string) {
  const response = await fetchWithAuth(`${BASE}/bulk-pick/`, {
    method: "POST",
    body: JSON.stringify({ destination_email }),
  });
  return parseJsonResponse(response);
}

export async function fetchZebraPrinters() {
  const response = await fetchWithAuth(`${BASE}/printers/`, { method: "GET" });
  return parseJsonResponse(response);
}

export async function createZebraPrinter(payload: Record<string, unknown>) {
  const response = await fetchWithAuth(`${BASE}/printers/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response);
}

export async function updateZebraPrinter(printerId: number, payload: Record<string, unknown>) {
  const response = await fetchWithAuth(`${BASE}/printers/${printerId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response);
}

export async function deleteZebraPrinter(printerId: number) {
  const response = await fetchWithAuth(`${BASE}/printers/${printerId}/`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Não foi possível apagar a impressora.");
  }
}

export async function sendZebraPrinterTest(printerId: number) {
  const response = await fetchWithAuth(`${BASE}/printers/${printerId}/test-print/`, {
    method: "POST",
  });
  return parseJsonResponse(response);
}

export async function resolve360Barcode(barcode: string) {
  const response = await fetchWithAuth(`${BASE}/scan/resolve/`, {
    method: "POST",
    body: JSON.stringify({ barcode }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 404) {
    throw new Error(data.detail || "Não foi possível resolver o código de barras.");
  }
  return {
    ...data,
    notFound: response.status === 404,
  };
}

export async function print360Scan(payload: {
  scan_event_id: number;
  printer_id?: number;
  number_of_labels?: number;
}) {
  const response = await fetchWithAuth(`${BASE}/scan/print/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response);
}
