import { useEffect, useState } from "react";

import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import {
  createZebraPrinter,
  deleteZebraPrinter,
  fetchZebraPrinters,
  sendZebraPrinterTest,
  updateZebraPrinter,
} from "../../serviceapi/imprimir360";

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ZebraPrinter {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  is_active: boolean;
  is_default: boolean;
  notes: string;
}

const initialForm = {
  name: "",
  ip_address: "",
  port: "9100",
  notes: "",
  is_default: false,
};

export default function PrinterSettingsModal({
  isOpen,
  onClose,
}: PrinterSettingsModalProps) {
  const [printers, setPrinters] = useState<ZebraPrinter[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testingPrinterId, setTestingPrinterId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);

  async function loadPrinters() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const data = await fetchZebraPrinters();
      setPrinters(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar impressoras.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadPrinters();
    }
  }, [isOpen]);

  async function handleCreatePrinter() {
    if (!form.name.trim() || !form.ip_address.trim()) {
      setError("Nome e IP são obrigatórios.");
      setSuccess("");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await createZebraPrinter({
        name: form.name.trim(),
        ip_address: form.ip_address.trim(),
        port: Number(form.port || 9100),
        notes: form.notes.trim(),
        is_default: form.is_default,
      });
      setForm(initialForm);
      await loadPrinters();
    } catch (err: any) {
      setError(err.message || "Erro ao criar impressora.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePrinter(printerId: number, payload: Record<string, unknown>) {
    try {
      setError("");
      setSuccess("");
      await updateZebraPrinter(printerId, payload);
      await loadPrinters();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar impressora.");
    }
  }

  async function handleDeletePrinter(printerId: number) {
    if (!window.confirm("Apagar esta impressora?")) return;
    try {
      setError("");
      setSuccess("");
      await deleteZebraPrinter(printerId);
      await loadPrinters();
    } catch (err: any) {
      setError(err.message || "Erro ao apagar impressora.");
    }
  }

  async function handleTestPrint(printerId: number) {
    try {
      setTestingPrinterId(printerId);
      setError("");
      setSuccess("");
      const data = await sendZebraPrinterTest(printerId);
      setSuccess(data.detail || "Etiqueta de teste enviada.");
    } catch (err: any) {
      setError(err.message || "Erro ao enviar etiqueta de teste.");
    } finally {
      setTestingPrinterId(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white/90">
            Impressoras Zebra
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gere os IPs usados para impressão automática das etiquetas 360Imprimir.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {success}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white/90">
                Impressoras configuradas
              </h4>
              <button
                type="button"
                onClick={loadPrinters}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Atualizar
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">A carregar impressoras...</div>
            ) : printers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Ainda não existem impressoras registadas.
              </div>
            ) : (
              <div className="space-y-3">
                {printers.map((printer) => (
                  <div
                    key={printer.id}
                    className="rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900 dark:text-white/90">
                            {printer.name}
                          </h5>
                          {printer.is_default ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              Default
                            </span>
                          ) : null}
                          {!printer.is_active ? (
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Inativa
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {printer.ip_address}:{printer.port}
                        </p>
                        {printer.notes ? (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            {printer.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestPrint(printer.id)}
                          disabled={testingPrinterId === printer.id}
                        >
                          {testingPrinterId === printer.id ? "A enviar teste..." : "Etiqueta de teste"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdatePrinter(printer.id, { is_default: !printer.is_default })
                          }
                        >
                          {printer.is_default ? "Remover default" : "Tornar default"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdatePrinter(printer.id, { is_active: !printer.is_active })
                          }
                        >
                          {printer.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePrinter(printer.id)}
                        >
                          Apagar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white/90">
              Nova impressora
            </h4>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome
                </label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  placeholder="Zebra Expedição"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  IP
                </label>
                <input
                  value={form.ip_address}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, ip_address: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  placeholder="192.168.1.120"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Porta
                </label>
                <input
                  value={form.port}
                  onChange={(event) => setForm((prev) => ({ ...prev, port: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  placeholder="9100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notas
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="min-h-[96px] w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  placeholder="Opcional"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, is_default: event.target.checked }))
                  }
                />
                Definir como impressora default
              </label>
              <Button onClick={handleCreatePrinter} disabled={saving}>
                {saving ? "A guardar..." : "Adicionar impressora"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
