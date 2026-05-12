import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
// @ts-ignore: legacy JS service module
import {
  createStockEntry,
  fetchFamilyDynamicFields,
  fetchStockMerchandises,
  fetchSuppliers,
} from "../../../serviceapi/api";

interface StockFamily {
  id: number;
  name: string;
  product_type?: string;
  has_certification?: boolean;
}

interface DynamicField {
  id: number;
  family: number;
  scope: "entry" | "certification";
  name: string;
  key: string;
  field_type: "text" | "textarea" | "number" | "date" | "select";
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
  placeholder: string;
  unit: string;
  is_active: boolean;
}

interface StockMerchandise {
  id: number;
  family_id?: number | null;
  family?: string | null;
  name: string;
  reference: string;
  current_quantity: number;
  is_active?: boolean;
}

interface Supplier {
  id: number;
  name: string;
}

interface BatchRow {
  id: number;
  label: string;
  quantity: string;
}

type EntryTab = "general" | "entry" | "certification" | "batches";

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: StockFamily[];
  defaultFamilyId?: string;
  onEntryCreated: () => Promise<void> | void;
}

const entryTabs: Array<{ id: EntryTab; label: string; description: string }> = [
  {
    id: "general",
    label: "Geral",
    description: "Família, artigo, fornecedor e dados base.",
  },
  {
    id: "entry",
    label: "Entrada",
    description: "Campos dinâmicos da entrada escolhidos pela família.",
  },
  {
    id: "certification",
    label: "Certificação",
    description: "Campos dinâmicos do certificado da matéria-prima.",
  },
  {
    id: "batches",
    label: "Bobines / Lotes",
    description: "Divide a quantidade por bobines ou lotes da mesma referência.",
  },
];

function renderDynamicFieldInput(
  field: DynamicField,
  values: Record<string, string>,
  setValues: Dispatch<SetStateAction<Record<string, string>>>,
) {
  const commonProps = {
    value: values[field.key] || "",
    onChange: (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) =>
      setValues((current) => ({
        ...current,
        [field.key]: event.target.value,
      })),
    className:
      "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
  };

  if (field.field_type === "textarea") {
    return <textarea {...commonProps} rows={4} placeholder={field.placeholder || field.name} />;
  }

  if (field.field_type === "select") {
    return (
      <select {...commonProps}>
        <option value="">Selecione</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...commonProps}
      type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
      placeholder={field.placeholder || field.name}
    />
  );
}

export default function StockEntryModal({
  isOpen,
  onClose,
  families,
  defaultFamilyId = "",
  onEntryCreated,
}: StockEntryModalProps) {
  const [activeTab, setActiveTab] = useState<EntryTab>("general");
  const [merchandises, setMerchandises] = useState<StockMerchandise[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [entryFields, setEntryFields] = useState<DynamicField[]>([]);
  const [certificationFields, setCertificationFields] = useState<DynamicField[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFamilyId, setSelectedFamilyId] = useState(defaultFamilyId);
  const [selectedMerchandiseId, setSelectedMerchandiseId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [entryValues, setEntryValues] = useState<Record<string, string>>({});
  const [certificationValues, setCertificationValues] = useState<Record<string, string>>({});
  const [batches, setBatches] = useState<BatchRow[]>([
    { id: 1, label: "Bobine 1", quantity: "" },
  ]);

  const selectedFamily = families.find(
    (family) => String(family.id) === String(selectedFamilyId),
  );
  const certificationEnabled = Boolean(selectedFamily?.has_certification);
  const visibleTabs = entryTabs.filter(
    (tab) => tab.id !== "certification" || certificationEnabled,
  );

  useEffect(() => {
    if (!isOpen) return;

    async function loadBaseData() {
      try {
        setLoading(true);
        setError(null);
        const [merchandisesData, suppliersData] = await Promise.all([
          fetchStockMerchandises(),
          fetchSuppliers(),
        ]);

        setMerchandises(merchandisesData);
        setSuppliers(suppliersData);
      } catch (err: any) {
        console.error("Erro ao carregar dados de entrada:", err);
        setError(err.message || "Erro ao carregar dados de entrada.");
      } finally {
        setLoading(false);
      }
    }

    setActiveTab("general");
    setSelectedFamilyId(defaultFamilyId);
    setSelectedMerchandiseId("");
    setSelectedSupplierId("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setInvoiceNumber("");
    setUnit("");
    setNotes("");
    setEntryValues({});
    setCertificationValues({});
    setBatches([{ id: 1, label: "Bobine 1", quantity: "" }]);
    loadBaseData();
  }, [defaultFamilyId, isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedFamilyId) {
      setEntryFields([]);
      setCertificationFields([]);
      setEntryValues({});
      setCertificationValues({});
      return;
    }

    async function loadDynamicFields() {
      try {
        setLoadingFields(true);
        const [entryData, certificationData] = await Promise.all([
          fetchFamilyDynamicFields(selectedFamilyId, "entry"),
          certificationEnabled
            ? fetchFamilyDynamicFields(selectedFamilyId, "certification")
            : Promise.resolve([]),
        ]);
        setEntryFields(entryData.filter((field: DynamicField) => field.is_active));
        setCertificationFields(
          certificationData.filter((field: DynamicField) => field.is_active),
        );
        setEntryValues({});
        setCertificationValues({});
      } catch (err: any) {
        console.error("Erro ao carregar campos da família:", err);
        setError(err.message || "Erro ao carregar campos da família.");
      } finally {
        setLoadingFields(false);
      }
    }

    loadDynamicFields();
  }, [certificationEnabled, isOpen, selectedFamilyId]);

  const filteredMerchandises = selectedFamilyId
    ? merchandises.filter(
        (merchandise) =>
          String(merchandise.family_id || "") === String(selectedFamilyId) &&
          merchandise.is_active !== false,
      )
    : merchandises.filter((merchandise) => merchandise.is_active !== false);

  const selectedMerchandise = merchandises.find(
    (merchandise) => String(merchandise.id) === selectedMerchandiseId,
  );

  useEffect(() => {
    if (activeTab === "certification" && !certificationEnabled) {
      setActiveTab("general");
    }
  }, [activeTab, certificationEnabled]);

  const totalQuantity = useMemo(
    () =>
      batches.reduce((sum, batch) => {
        const quantity = Number(batch.quantity || 0);
        return Number.isFinite(quantity) ? sum + quantity : sum;
      }, 0),
    [batches],
  );

  const addBatch = () => {
    setBatches((current) => [
      ...current,
      {
        id: Date.now(),
        label: `Bobine ${current.length + 1}`,
        quantity: "",
      },
    ]);
  };

  const updateBatch = (batchId: number, field: "label" | "quantity", value: string) => {
    setBatches((current) =>
      current.map((batch) =>
        batch.id === batchId ? { ...batch, [field]: value } : batch,
      ),
    );
  };

  const removeBatch = (batchId: number) => {
    setBatches((current) => current.filter((batch) => batch.id !== batchId));
  };

  const handleMerchandiseChange = (nextMerchandiseId: string) => {
    setSelectedMerchandiseId(nextMerchandiseId);
    const merchandise = merchandises.find(
      (item) => String(item.id) === nextMerchandiseId,
    );
    if (merchandise?.family_id) {
      setSelectedFamilyId(String(merchandise.family_id));
    }
  };

  const handleSubmit = async () => {
    const normalizedBatches = batches
      .map((batch) => ({
        label: batch.label.trim(),
        quantity: Number(batch.quantity || 0),
      }))
      .filter((batch) => batch.quantity > 0);

    if (!selectedMerchandiseId) {
      setError("Selecione um merchandise.");
      return;
    }

    if (normalizedBatches.length === 0) {
      setError("Adicione pelo menos uma bobine ou lote com quantidade válida.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createStockEntry({
        family_id: selectedFamilyId ? Number(selectedFamilyId) : null,
        merchandise_id: Number(selectedMerchandiseId),
        supplier_id: selectedSupplierId ? Number(selectedSupplierId) : null,
        entry_date: entryDate,
        invoice_number: invoiceNumber.trim(),
        reference_snapshot: selectedMerchandise?.reference || "",
        unit: unit.trim(),
        notes: notes.trim(),
        entry_data: entryValues,
        certification_data: certificationEnabled ? certificationValues : {},
        batches: normalizedBatches,
      });

      await onEntryCreated();
      onClose();
    } catch (err: any) {
      console.error("Erro ao criar entrada de stock:", err);
      setError(err.message || "Erro ao criar entrada de stock.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderGeneralTab = () => (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Família
          </label>
          <select
            value={selectedFamilyId}
            onChange={(event) => {
              setSelectedFamilyId(event.target.value);
              setSelectedMerchandiseId("");
            }}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Todas as famílias</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Merchandise
          </label>
          <select
            value={selectedMerchandiseId}
            onChange={(event) => handleMerchandiseChange(event.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">
              {loading ? "A carregar merchandises..." : "Selecione um merchandise"}
            </option>
            {filteredMerchandises.map((merchandise) => (
              <option key={merchandise.id} value={merchandise.id}>
                {merchandise.name} | {merchandise.reference}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fornecedor
          </label>
          <select
            value={selectedSupplierId}
            onChange={(event) => setSelectedSupplierId(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Sem fornecedor</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Data da Entrada
          </label>
          <input
            type="date"
            value={entryDate}
            onChange={(event) => setEntryDate(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Guia / Fatura
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            placeholder="Ex.: FT 2026/001"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Unidade
          </label>
          <input
            type="text"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder="kg, km, metros lineares..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {selectedMerchandise ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-gray-600 dark:text-gray-300">
              Referência selecionada
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedMerchandise.reference}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-gray-600 dark:text-gray-300">
              Stock atual agregado
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedMerchandise.current_quantity}
            </span>
          </div>
          {selectedFamily ? (
            <div className="mt-2 text-gray-500 dark:text-gray-400">
              Família: {selectedFamily.name}
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Observações
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Notas internas sobre esta entrada..."
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>
    </div>
  );

  const renderFieldSection = (
    title: string,
    description: string,
    fields: DynamicField[],
    values: Record<string, string>,
    setValues: Dispatch<SetStateAction<Record<string, string>>>,
  ) => (
    <div className="space-y-5">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      {loadingFields ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Esta família ainda não tem campos configurados para este separador.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id}>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.name}
                {field.is_required ? " *" : ""}
                {field.unit ? ` (${field.unit})` : ""}
              </label>
              {renderDynamicFieldInput(field, values, setValues)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBatchesTab = () => (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bobines / Lotes
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            A mesma referência pode entrar em várias bobines. O stock agregado
            é a soma destas linhas.
          </p>
        </div>
        <Button variant="outline" onClick={addBatch}>
          Adicionar Linha
        </Button>
      </div>

      <div className="space-y-3">
        {batches.map((batch, index) => (
          <div
            key={batch.id}
            className="grid gap-3 rounded-2xl border border-gray-200 p-4 md:grid-cols-[minmax(0,1fr)_180px_auto] dark:border-gray-800"
          >
            <input
              type="text"
              value={batch.label}
              onChange={(event) =>
                updateBatch(batch.id, "label", event.target.value)
              }
              placeholder={`Bobine ${index + 1}`}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <input
              type="number"
              min="1"
              value={batch.quantity}
              onChange={(event) =>
                updateBatch(batch.id, "quantity", event.target.value)
              }
              placeholder="Quantidade"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <Button
              variant="outline"
              onClick={() => removeBatch(batch.id)}
              disabled={batches.length === 1}
            >
              Remover
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-4 text-sm dark:border-gray-700">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-600 dark:text-gray-300">
            Quantidade total desta entrada
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {totalQuantity} {unit || ""}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[1180px]">
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Adicionar Entrada
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Regista a entrada por referência, divide por bobines e preenche os
            campos que cada família definiu para entrada e certificação.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-700 hover:bg-blue-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="text-sm font-semibold">{tab.label}</div>
                  <div
                    className={`mt-1 text-xs ${
                      isActive ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {tab.description}
                  </div>
                </button>
              );
            })}
          </aside>

          <div className="min-w-0 space-y-6">
            {activeTab === "general" ? renderGeneralTab() : null}
            {activeTab === "entry"
              ? renderFieldSection(
                  "Campos da Entrada",
                  "Aqui entram os campos operacionais da receção, definidos pela família.",
                  entryFields,
                  entryValues,
                  setEntryValues,
                )
              : null}
            {activeTab === "certification"
              ? renderFieldSection(
                  "Campos da Certificação",
                  "Usa estes campos para registar a certificação da matéria-prima deste artigo.",
                  certificationFields,
                  certificationValues,
                  setCertificationValues,
                )
              : null}
            {activeTab === "batches" ? renderBatchesTab() : null}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading || loadingFields}>
            {submitting ? "A guardar..." : "Adicionar Entrada"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
