import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
// @ts-ignore: legacy JS service module
import {
  createStockEntry,
  fetchFamilyDynamicFields,
  fetchStockEntries,
  fetchStockMerchandises,
  fetchSuppliers,
  updateStockMerchandise,
} from "../../../serviceapi/api";

interface StockFamily {
  id: number;
  name: string;
  description: string | null;
  product_type: string;
  has_certification?: boolean;
}

interface StockItem {
  id: number;
  size_label: string;
  name: string;
  reference: string;
  category: string;
  current_quantity: number;
  minimum_stock: number | null;
  maximum_stock: number | null;
  status: "below_minimum" | "within_range" | "above_maximum" | "no_limits";
  minimum_gap: number | null;
  maximum_gap: number | null;
  stock_last_update: string | null;
}

interface MerchandiseRecord {
  id: number;
  family_id?: number | null;
  family?: string | null;
  name: string;
  category: string;
  reference: string;
  minimum_stock: number;
  maximum_stock: number;
  certificate?: string | null;
  barcode?: string | null;
  guide_number?: string | null;
  guide?: string | null;
  current_quantity: number;
  is_active?: boolean;
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

interface Supplier {
  id: number;
  name: string;
}

interface BatchRow {
  id: number;
  label: string;
  quantity: string;
  entryData: Record<string, string>;
  certificationData: Record<string, string>;
}

interface StockEntryRecord {
  id: number;
  family: number | null;
  family_name: string | null;
  merchandise: number;
  merchandise_name: string;
  merchandise_reference: string;
  supplier: number | null;
  supplier_name: string | null;
  entry_date: string;
  invoice_number: string | null;
  reference_snapshot: string | null;
  quantity: number;
  unit: string | null;
  entry_data: Record<string, unknown>;
  certification_data: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  batches: Array<{
    id: number;
    label: string | null;
    quantity: number;
    metadata: Record<string, unknown>;
  }>;
}

interface MerchandiseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: StockFamily[];
  item: StockItem | null;
  onChanged: () => Promise<void> | void;
}

type DetailTab = "edit" | "items" | "add";

const detailTabs: Array<{ id: DetailTab; label: string; description: string }> = [
  {
    id: "edit",
    label: "Editar",
    description: "Atualiza os dados principais do artigo.",
  },
  {
    id: "items",
    label: "Itens Associados",
    description: "Mostra as bobines/lotes que compõem o stock registado.",
  },
  {
    id: "add",
    label: "Adicionar Item",
    description: "Regista novas bobines/lotes para este merchandise.",
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-PT");
}

function renderValue(value: unknown) {
  if (value == null || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function MerchandiseDetailModal({
  isOpen,
  onClose,
  families,
  item,
  onChanged,
}: MerchandiseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("edit");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [merchandise, setMerchandise] = useState<MerchandiseRecord | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [entryFields, setEntryFields] = useState<DynamicField[]>([]);
  const [certificationFields, setCertificationFields] = useState<DynamicField[]>([]);
  const [entries, setEntries] = useState<StockEntryRecord[]>([]);

  const [editForm, setEditForm] = useState({
    name: "",
    reference: "",
    category: "",
    minimum_stock: "",
    maximum_stock: "",
    barcode: "",
    is_active: true,
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [usesCertification, setUsesCertification] = useState(false);
  const [batches, setBatches] = useState<BatchRow[]>([
    {
      id: 1,
      label: "Bobine 1",
      quantity: "",
      entryData: {},
      certificationData: {},
    },
  ]);

  const selectedFamily = families.find(
    (family) => String(family.id) === String(merchandise?.family_id || ""),
  );
  const certificationEnabled = Boolean(selectedFamily?.has_certification);

  const loadModalData = async () => {
    if (!item) return;

    try {
      setLoading(true);
      setError(null);

      const [merchandiseList, suppliersData, entriesData] = await Promise.all([
        fetchStockMerchandises(),
        fetchSuppliers(),
        fetchStockEntries({ merchandiseId: item.id }),
      ]);

      const currentMerchandise = merchandiseList.find(
        (entry: MerchandiseRecord) => entry.id === item.id,
      );

      if (!currentMerchandise) {
        setError("Não foi possível carregar o artigo selecionado.");
        return;
      }

      setMerchandise(currentMerchandise);
      setSuppliers(suppliersData);
      setEntries(entriesData);
      setEditForm({
        name: currentMerchandise.name || "",
        reference: currentMerchandise.reference || "",
        category: currentMerchandise.category || "",
        minimum_stock: String(currentMerchandise.minimum_stock ?? ""),
        maximum_stock: String(currentMerchandise.maximum_stock ?? ""),
        barcode: currentMerchandise.barcode || "",
        is_active: currentMerchandise.is_active !== false,
      });

      if (currentMerchandise.family_id) {
        const [entryFieldData, certificationFieldData] = await Promise.all([
          fetchFamilyDynamicFields(String(currentMerchandise.family_id), "entry"),
          certificationEnabled
            ? fetchFamilyDynamicFields(String(currentMerchandise.family_id), "certification")
            : Promise.resolve([]),
        ]);
        setEntryFields(entryFieldData.filter((field: DynamicField) => field.is_active));
        setCertificationFields(
          certificationFieldData.filter((field: DynamicField) => field.is_active),
        );
      } else {
        setEntryFields([]);
        setCertificationFields([]);
      }
    } catch (err: any) {
      console.error("Erro ao carregar detalhe do merchandise:", err);
      setError(err.message || "Erro ao carregar detalhe do merchandise.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !item) return;

    setActiveTab("edit");
    setSuccess(null);
    setSelectedSupplierId("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setInvoiceNumber("");
    setUnit("");
    setNotes("");
    setEditForm({
      name: "",
      reference: "",
      category: "",
      minimum_stock: "",
      maximum_stock: "",
      barcode: "",
      is_active: true,
    });
    setUsesCertification(false);
    setBatches([
      {
        id: 1,
        label: "Bobine 1",
        quantity: "",
        entryData: {},
        certificationData: {},
      },
    ]);
    loadModalData();
  }, [certificationEnabled, isOpen, item?.id]);

  const totalQuantity = useMemo(
    () =>
      batches.reduce((sum, batch) => {
        const quantity = Number(batch.quantity || 0);
        return Number.isFinite(quantity) ? sum + quantity : sum;
      }, 0),
    [batches],
  );

  const totalAssociatedBatches = entries.reduce(
    (sum, entry) => sum + (entry.batches?.length || 0),
    0,
  );

  const addBatch = () => {
    setBatches((current) => [
      ...current,
      {
        id: Date.now(),
        label: `Bobine ${current.length + 1}`,
        quantity: "",
        entryData: {},
        certificationData: {},
      },
    ]);
  };

  const normalizeFieldValues = (
    fieldValues: Record<string, string>,
    fields: DynamicField[],
  ) =>
    fields.reduce<Record<string, string>>((accumulator, field) => {
      const value = fieldValues[field.key];
      if (value == null || value === "") {
        return accumulator;
      }

      accumulator[field.key] = value;
      return accumulator;
    }, {});

  const validateBatchDynamicFields = (
    batch: BatchRow,
    fields: DynamicField[],
    scopeLabel: string,
  ) => {
    for (const field of fields) {
      if (!field.is_required) {
        continue;
      }

      const scopeValues =
        scopeLabel === "certificação" ? batch.certificationData : batch.entryData;
      if (!scopeValues[field.key]?.trim()) {
        return `Preenche o campo obrigatório "${field.name}" na linha ${batch.label || "sem nome"}.`;
      }
    }

    return null;
  };

  const renderBatchDynamicFields = (
    batch: BatchRow,
    fields: DynamicField[],
    scope: "entryData" | "certificationData",
    title: string,
    emptyLabel: string,
  ) => {
    if (fields.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {emptyLabel}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {fields.map((field) => (
            <div key={`${batch.id}-${scope}-${field.id}`}>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.name}
                {field.is_required ? " *" : ""}
                {field.unit ? ` (${field.unit})` : ""}
              </label>
              {renderDynamicFieldInput(
                field,
                batch[scope],
                (updater) =>
                  setBatches((current) =>
                    current.map((currentBatch) =>
                      currentBatch.id === batch.id
                        ? {
                            ...currentBatch,
                            [scope]:
                              typeof updater === "function"
                                ? updater(currentBatch[scope])
                                : updater,
                          }
                        : currentBatch,
                    ),
                  ),
              )}
            </div>
          ))}
        </div>
      </div>
    );
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

  const handleSaveMerchandise = async () => {
    if (!merchandise) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await updateStockMerchandise(merchandise.id, {
        name: editForm.name.trim(),
        reference: editForm.reference.trim(),
        category: editForm.category.trim(),
        minimum_stock: Number(editForm.minimum_stock || 0),
        maximum_stock: Number(editForm.maximum_stock || 0),
        barcode: editForm.barcode.trim(),
        is_active: editForm.is_active,
      });

      setMerchandise((current) =>
        current
          ? {
              ...current,
              ...updated,
            }
          : current,
      );
      setSuccess("Artigo atualizado com sucesso.");
      await onChanged();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar o artigo.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!merchandise) return;

    const invalidRequiredField =
      batches
        .map((batch) => validateBatchDynamicFields(batch, entryFields, "entrada"))
        .find(Boolean) ||
      (usesCertification
        ? batches
            .map((batch) =>
              validateBatchDynamicFields(batch, certificationFields, "certificação"),
            )
            .find(Boolean)
        : null);

    if (invalidRequiredField) {
      setError(invalidRequiredField);
      return;
    }

    const normalizedBatches = batches
      .map((batch) => ({
        label: batch.label.trim(),
        quantity: Number(batch.quantity || 0),
        metadata: {
          entry_data: normalizeFieldValues(batch.entryData, entryFields),
          certification_data:
            usesCertification && certificationEnabled
              ? normalizeFieldValues(batch.certificationData, certificationFields)
              : {},
          uses_certification: usesCertification && certificationEnabled,
        },
      }))
      .filter((batch) => batch.quantity > 0);

    if (normalizedBatches.length === 0) {
      setError("Adicione pelo menos uma bobine ou lote com quantidade válida.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await createStockEntry({
        family_id: merchandise.family_id || null,
        merchandise_id: merchandise.id,
        supplier_id: selectedSupplierId ? Number(selectedSupplierId) : null,
        entry_date: entryDate,
        invoice_number: invoiceNumber.trim(),
        reference_snapshot: merchandise.reference,
        unit: unit.trim(),
        notes: notes.trim(),
        entry_data: {},
        certification_data: {},
        batches: normalizedBatches,
      });

      setSelectedSupplierId("");
      setEntryDate(new Date().toISOString().slice(0, 10));
      setInvoiceNumber("");
      setUnit("");
      setNotes("");
      setUsesCertification(false);
      setBatches([
        {
          id: 1,
          label: "Bobine 1",
          quantity: "",
          entryData: {},
          certificationData: {},
        },
      ]);
      setSuccess("Item adicionado com sucesso ao merchandise.");
      await loadModalData();
      await onChanged();
      setActiveTab("items");
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar item ao merchandise.");
    } finally {
      setSaving(false);
    }
  };

  const renderEditTab = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome
          </label>
          <input
            type="text"
            value={editForm.name}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, name: event.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Referência
          </label>
          <input
            type="text"
            value={editForm.reference}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, reference: event.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Categoria
          </label>
          <input
            type="text"
            value={editForm.category}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, category: event.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Código de Barras
          </label>
          <input
            type="text"
            value={editForm.barcode}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, barcode: event.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Stock Mínimo
          </label>
          <input
            type="number"
            min="0"
            value={editForm.minimum_stock}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, minimum_stock: event.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Stock Máximo
          </label>
          <input
            type="number"
            min="0"
            value={editForm.maximum_stock}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, maximum_stock: event.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm dark:border-gray-800 dark:bg-gray-900/40">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-gray-600 dark:text-gray-300">Família</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {selectedFamily?.name || merchandise?.family || "Sem família"}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-gray-600 dark:text-gray-300">Stock Atual</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {merchandise?.current_quantity ?? item?.current_quantity ?? 0}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-gray-600 dark:text-gray-300">Visibilidade</span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              editForm.is_active
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
            }`}
          >
            {editForm.is_active ? "Visível" : "Oculto"}
          </span>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <input
          type="checkbox"
          checked={editForm.is_active}
          onChange={(event) =>
            setEditForm((current) => ({
              ...current,
              is_active: event.target.checked,
            }))
          }
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>
          <span className="block font-medium text-gray-900 dark:text-white">
            Artigo visível
          </span>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            Se desativares, este artigo deixa de aparecer no dashboard e na seleção de entradas, mas continua guardado.
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <Button onClick={handleSaveMerchandise} disabled={saving}>
          {saving ? "A guardar..." : "Guardar Alterações"}
        </Button>
      </div>
    </div>
  );

  const renderItemsTab = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm dark:border-gray-800 dark:bg-gray-900/40">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-gray-600 dark:text-gray-300">Stock agregado</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {merchandise?.current_quantity ?? item?.current_quantity ?? 0}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-gray-600 dark:text-gray-300">Bobines/Lotes registados</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {totalAssociatedBatches}
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Este merchandise não tem itens associados registados. De momento só existe o stock agregado.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {entry.invoice_number || "Sem guia/fatura"} | {entry.quantity} {entry.unit || ""}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Data: {formatDateTime(entry.entry_date)} | Fornecedor: {entry.supplier_name || "Sem fornecedor"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Criado: {formatDateTime(entry.created_at)}
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  {entry.batches.length} bobines/lotes
                </span>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Bobines / Lotes
                  </p>
                  <div className="space-y-2">
                    {entry.batches.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        Sem detalhe de bobines/lotes.
                      </div>
                    ) : (
                      entry.batches.map((batch) => {
                        const metadata = batch.metadata || {};
                        const batchEntryData =
                          metadata.entry_data &&
                          typeof metadata.entry_data === "object" &&
                          !Array.isArray(metadata.entry_data)
                            ? (metadata.entry_data as Record<string, unknown>)
                            : {};
                        const batchCertificationData =
                          metadata.certification_data &&
                          typeof metadata.certification_data === "object" &&
                          !Array.isArray(metadata.certification_data)
                            ? (metadata.certification_data as Record<string, unknown>)
                            : {};

                        return (
                          <div
                            key={batch.id}
                            className="rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {batch.label || `Lote ${batch.id}`}
                            </div>
                            <div className="mt-1 text-gray-500 dark:text-gray-400">
                              Quantidade: {batch.quantity}
                            </div>

                            {Object.keys(batchEntryData).length > 0 ? (
                              <div className="mt-3 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Campos da linha
                                </p>
                                {Object.entries(batchEntryData).map(([key, value]) => (
                                  <div key={`${batch.id}-${key}`} className="text-xs text-gray-600 dark:text-gray-300">
                                    {key}: {renderValue(value)}
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {Object.keys(batchCertificationData).length > 0 ? (
                              <div className="mt-3 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Certificação da linha
                                </p>
                                {Object.entries(batchCertificationData).map(([key, value]) => (
                                  <div key={`${batch.id}-cert-${key}`} className="text-xs text-gray-600 dark:text-gray-300">
                                    {key}: {renderValue(value)}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Campos da Entrada
                    </p>
                    <div className="space-y-2">
                      {Object.keys(entry.entry_data || {}).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          Sem campos de entrada.
                        </div>
                      ) : (
                        Object.entries(entry.entry_data || {}).map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{key}</div>
                            <div className="mt-1 text-gray-500 dark:text-gray-400">
                              {renderValue(value)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Certificação
                    </p>
                    <div className="space-y-2">
                      {Object.keys(entry.certification_data || {}).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          Sem campos de certificação.
                        </div>
                      ) : (
                        Object.entries(entry.certification_data || {}).map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{key}</div>
                            <div className="mt-1 text-gray-500 dark:text-gray-400">
                              {renderValue(value)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAddTab = () => (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-4">
          <h5 className="text-base font-semibold text-gray-900 dark:text-white">
            Cabeçalho da Entrada
          </h5>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define os dados gerais desta receção. O stock lançado é sempre a soma das linhas abaixo.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
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

        {certificationEnabled ? (
          <label className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
            <input
              type="checkbox"
              checked={usesCertification}
              onChange={(event) => setUsesCertification(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Esta entrada usa certificação
          </label>
        ) : null}
      </section>

      <div className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h5 className="text-base font-semibold text-gray-900 dark:text-white">
              Bobines / Lotes
            </h5>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Regista quantas bobines compõem esta entrada para o merchandise.
            </p>
          </div>
          <Button variant="outline" onClick={addBatch}>
            Adicionar Linha
          </Button>
        </div>

        {batches.map((batch) => (
          <div
            key={batch.id}
            className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <input
                type="text"
                value={batch.label}
                onChange={(event) => updateBatch(batch.id, "label", event.target.value)}
                placeholder="Nome da bobine/lote"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              <input
                type="number"
                min="1"
                value={batch.quantity}
                onChange={(event) => updateBatch(batch.id, "quantity", event.target.value)}
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

            {renderBatchDynamicFields(
              batch,
              entryFields,
              "entryData",
              "Campos da Linha",
              "Esta família não tem campos dinâmicos de entrada configurados.",
            )}

            {usesCertification && certificationEnabled
              ? renderBatchDynamicFields(
                  batch,
                  certificationFields,
                  "certificationData",
                  "Certificação da Linha",
                  "Esta família não tem campos dinâmicos de certificação configurados.",
                )
              : null}
          </div>
        ))}

        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-300">Total desta entrada</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {totalQuantity} {unit || ""}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Observações
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleAddItem} disabled={saving}>
          {saving ? "A guardar..." : "Adicionar Item"}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[1240px]">
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {merchandise?.reference || item?.reference || "Merchandise"}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Edita o artigo, vê os itens associados ao stock e adiciona novas bobines/lotes.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
            <div className="font-medium text-gray-900 dark:text-white">
              Stock atual: {merchandise?.current_quantity ?? item?.current_quantity ?? 0}
            </div>
            <div className="mt-1 text-gray-500 dark:text-gray-400">
              Família: {selectedFamily?.name || merchandise?.family || "Sem família"}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
              {detailTabs.map((tab) => {
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

            <div className="min-w-0">
              {activeTab === "edit" ? renderEditTab() : null}
              {activeTab === "items" ? renderItemsTab() : null}
              {activeTab === "add" ? renderAddTab() : null}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
