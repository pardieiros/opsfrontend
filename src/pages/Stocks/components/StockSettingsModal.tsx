import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
// @ts-ignore: legacy JS service module
import {
  assignMerchandisesToFamily,
  createFamilyDynamicField,
  createStockFamily,
  createStockMerchandise,
  deleteFamilyDynamicField,
  fetchFamilyDynamicFields,
  fetchOpsProducts,
  fetchOpsSizes,
  fetchStockFamilies,
  fetchStockMerchandises,
  updateFamilyDynamicField,
  updateOpsProductStockFamily,
  updateOpsSizeStockMerchandise,
  updateStockFamily,
} from "../../../serviceapi/api";

interface StockFamily {
  id: number;
  name: string;
  description: string | null;
  product_type: string;
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
  category: string;
  reference: string;
  minimum_stock: number;
  maximum_stock: number;
  is_active?: boolean;
}

interface OpsProduct {
  id: number;
  nome: string;
  descricao: string;
  stock_family?: number | null;
  stock_family_name?: string | null;
}

interface OpsSize {
  id: number;
  tipo_saco: number;
  tipo_saco_nome: string;
  grupo: string;
  largura: number | null;
  fole: number | null;
  altura: number | null;
  gramagens?: Array<{
    cor: number;
    cor_nome: string;
    gramagem: number;
    peso: number;
  }>;
  stock_merchandise?: number | null;
  stock_merchandise_name?: string | null;
}

type SettingsTab =
  | "families"
  | "entry-fields"
  | "certification-fields"
  | "merchandise"
  | "links";

interface StockSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => Promise<void> | void;
  initialFamilyId?: string;
  initialTab?: SettingsTab;
}

const productTypeOptions = [
  { value: "none", label: "Nenhum" },
  { value: "finished_product", label: "Finished Product" },
  { value: "paper_reel", label: "Paper Reel" },
  { value: "rope", label: "Rope" },
  { value: "reinforcement", label: "Reinforcement" },
  { value: "packing_box", label: "Packing Box" },
];

const sideTabs: Array<{ id: SettingsTab; label: string; description: string }> = [
  {
    id: "families",
    label: "Famílias",
    description: "Editar a família selecionada e criar novas.",
  },
  {
    id: "entry-fields",
    label: "Campos Entrada",
    description: "Campos dinâmicos para a entrada de stock.",
  },
  {
    id: "certification-fields",
    label: "Campos Certificação",
    description: "Campos dinâmicos para os certificados por família.",
  },
  {
    id: "merchandise",
    label: "Merchandise",
    description: "Criar artigos e atribuir famílias.",
  },
  {
    id: "links",
    label: "Ligações OP",
    description: "Associar famílias a produtos e tamanhos.",
  },
];

const emptyDynamicFieldForm = {
  name: "",
  field_type: "text" as DynamicField["field_type"],
  options: "",
  is_required: false,
  sort_order: "0",
  placeholder: "",
  unit: "",
  is_active: true,
};

function formatSizeLabel(size: OpsSize) {
  const parts = [size.largura, size.fole, size.altura]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value));

  const dimensions = parts.join(" x ");
  const colors = Array.from(
    new Set(
      (size.gramagens || [])
        .map((item) => item.cor_nome?.trim())
        .filter(Boolean),
    ),
  );
  const colorsLabel = colors.length > 0 ? ` | ${colors.join(", ")}` : "";

  return `${size.tipo_saco_nome} | ${dimensions || "Sem dimensões"} | ${size.grupo}${colorsLabel}`;
}

function parseOptions(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function StockSettingsModal({
  isOpen,
  onClose,
  onDataChanged,
  initialFamilyId = "",
  initialTab = "families",
}: StockSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [families, setFamilies] = useState<StockFamily[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [merchandises, setMerchandises] = useState<StockMerchandise[]>([]);
  const [products, setProducts] = useState<OpsProduct[]>([]);
  const [sizes, setSizes] = useState<OpsSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState(initialFamilyId);
  const [editingDynamicFieldId, setEditingDynamicFieldId] = useState<number | null>(null);

  const [familyForm, setFamilyForm] = useState({
    name: "",
    description: "",
    product_type: "none",
    has_certification: false,
  });
  const [createFamilyForm, setCreateFamilyForm] = useState({
    name: "",
    description: "",
    product_type: "none",
    has_certification: false,
  });
  const [dynamicFieldForm, setDynamicFieldForm] = useState(emptyDynamicFieldForm);
  const [merchandiseForm, setMerchandiseForm] = useState({
    name: "",
    reference: "",
    category: "",
    minimum_stock: "",
    maximum_stock: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    familyId: "",
  });
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkAssignSearch, setBulkAssignSearch] = useState("");
  const [bulkAssignSelectedIds, setBulkAssignSelectedIds] = useState<number[]>([]);
  const [productLinkForm, setProductLinkForm] = useState({
    productId: "",
    familyId: "",
  });
  const [sizeLinkForm, setSizeLinkForm] = useState({
    sizeId: "",
    merchandiseId: "",
  });
  const [isSizeLinkPickerOpen, setIsSizeLinkPickerOpen] = useState(false);
  const [sizeFilterProductId, setSizeFilterProductId] = useState("");
  const [sizeFilterAssociationStatus, setSizeFilterAssociationStatus] = useState<
    "all" | "linked" | "unlinked"
  >("all");
  const [sizeFilterSearch, setSizeFilterSearch] = useState("");
  const [merchandiseLinkSearch, setMerchandiseLinkSearch] = useState("");

  const selectedFamily = families.find(
    (family) => String(family.id) === String(selectedFamilyId),
  );
  const currentScope =
    activeTab === "certification-fields" ? "certification" : "entry";

  const visibleDynamicFields = useMemo(
    () => dynamicFields.filter((field) => field.scope === currentScope),
    [currentScope, dynamicFields],
  );

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(initialTab);

    async function loadData() {
      try {
        setLoading(true);
        const [familiesData, merchandisesData, productsData, sizesData] =
          await Promise.all([
            fetchStockFamilies(),
            fetchStockMerchandises(),
            fetchOpsProducts(),
            fetchOpsSizes(),
          ]);

        setFamilies(familiesData);
        setMerchandises(merchandisesData);
        setProducts(productsData);
        setSizes(sizesData);
        setFeedback(null);

        const nextFamilyId =
          initialFamilyId && familiesData.some((item) => String(item.id) === initialFamilyId)
            ? initialFamilyId
            : familiesData[0]
              ? String(familiesData[0].id)
              : "";
        setSelectedFamilyId(nextFamilyId);
      } catch (err: any) {
        console.error("Erro ao carregar definições de stock:", err);
        setFeedback({
          type: "error",
          message: err.message || "Erro ao carregar definições de stock.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [initialFamilyId, initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedFamilyId) {
      setDynamicFields([]);
      return;
    }

    async function loadDynamicFields() {
      try {
        const [entryFields, certificationFields] = await Promise.all([
          fetchFamilyDynamicFields(selectedFamilyId, "entry"),
          fetchFamilyDynamicFields(selectedFamilyId, "certification"),
        ]);
        setDynamicFields([...entryFields, ...certificationFields]);
      } catch (err: any) {
        console.error("Erro ao carregar campos dinâmicos:", err);
        setFeedback({
          type: "error",
          message: err.message || "Erro ao carregar campos dinâmicos.",
        });
      }
    }

    loadDynamicFields();
  }, [isOpen, selectedFamilyId]);

  useEffect(() => {
    if (!selectedFamily) {
      setFamilyForm({
        name: "",
        description: "",
        product_type: "none",
        has_certification: false,
      });
      return;
    }

    setFamilyForm({
      name: selectedFamily.name,
      description: selectedFamily.description || "",
      product_type: selectedFamily.product_type || "none",
      has_certification: Boolean(selectedFamily.has_certification),
    });
    setAssignmentForm((current) => ({
      ...current,
      familyId: String(selectedFamily.id),
    }));
  }, [selectedFamily]);

  useEffect(() => {
    setDynamicFieldForm(emptyDynamicFieldForm);
    setEditingDynamicFieldId(null);
  }, [currentScope, selectedFamilyId]);

  const refreshAll = async (successMessage: string, nextFamilyId?: string) => {
    const [familiesData, merchandisesData, productsData, sizesData] =
      await Promise.all([
        fetchStockFamilies(),
        fetchStockMerchandises(),
        fetchOpsProducts(),
        fetchOpsSizes(),
      ]);

    setFamilies(familiesData);
    setMerchandises(merchandisesData);
    setProducts(productsData);
    setSizes(sizesData);
    setFeedback({ type: "success", message: successMessage });

    const familyIdToLoad =
      nextFamilyId ||
      selectedFamilyId ||
      (familiesData[0] ? String(familiesData[0].id) : "");
    setSelectedFamilyId(familyIdToLoad);

    if (familyIdToLoad) {
      const [entryFields, certificationFields] = await Promise.all([
        fetchFamilyDynamicFields(familyIdToLoad, "entry"),
        fetchFamilyDynamicFields(familyIdToLoad, "certification"),
      ]);
      setDynamicFields([...entryFields, ...certificationFields]);
    } else {
      setDynamicFields([]);
    }

    await onDataChanged();
  };

  const handleCreateFamily = async () => {
    if (!createFamilyForm.name.trim()) {
      setFeedback({ type: "error", message: "Indique o nome da família." });
      return;
    }

    try {
      const createdFamily = await createStockFamily({
        name: createFamilyForm.name.trim(),
        description: createFamilyForm.description.trim(),
        product_type: createFamilyForm.product_type,
        has_certification: createFamilyForm.has_certification,
      });
      setCreateFamilyForm({
        name: "",
        description: "",
        product_type: "none",
        has_certification: false,
      });
      await refreshAll("Família criada com sucesso.", String(createdFamily.id));
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao criar família.",
      });
    }
  };

  const handleUpdateFamily = async () => {
    if (!selectedFamilyId) {
      setFeedback({ type: "error", message: "Escolha uma família para editar." });
      return;
    }

    if (!familyForm.name.trim()) {
      setFeedback({ type: "error", message: "Indique o nome da família." });
      return;
    }

    try {
      await updateStockFamily(selectedFamilyId, {
        name: familyForm.name.trim(),
        description: familyForm.description.trim(),
        product_type: familyForm.product_type,
        has_certification: familyForm.has_certification,
      });
      await refreshAll("Família atualizada com sucesso.", selectedFamilyId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao atualizar família.",
      });
    }
  };

  const handleSaveDynamicField = async () => {
    if (!selectedFamilyId) {
      setFeedback({ type: "error", message: "Escolha uma família primeiro." });
      return;
    }

    if (!dynamicFieldForm.name.trim()) {
      setFeedback({ type: "error", message: "Indique o nome do campo." });
      return;
    }

    if (currentScope === "certification" && !selectedFamily?.has_certification) {
      setFeedback({
        type: "error",
        message: "Ativa a certificação na família antes de criar campos de certificação.",
      });
      return;
    }

    const payload = {
      family: Number(selectedFamilyId),
      scope: currentScope,
      name: dynamicFieldForm.name.trim(),
      field_type: dynamicFieldForm.field_type,
      options:
        dynamicFieldForm.field_type === "select"
          ? parseOptions(dynamicFieldForm.options)
          : null,
      is_required: dynamicFieldForm.is_required,
      sort_order: Number(dynamicFieldForm.sort_order || 0),
      placeholder: dynamicFieldForm.placeholder.trim(),
      unit: dynamicFieldForm.unit.trim(),
      is_active: dynamicFieldForm.is_active,
    };

    try {
      if (editingDynamicFieldId) {
        await updateFamilyDynamicField(editingDynamicFieldId, payload);
      } else {
        await createFamilyDynamicField(selectedFamilyId, payload);
      }

      setDynamicFieldForm(emptyDynamicFieldForm);
      setEditingDynamicFieldId(null);
      await refreshAll(
        editingDynamicFieldId
          ? "Campo dinâmico atualizado com sucesso."
          : "Campo dinâmico criado com sucesso.",
        selectedFamilyId,
      );
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao guardar campo dinâmico.",
      });
    }
  };

  const handleEditDynamicField = (field: DynamicField) => {
    setEditingDynamicFieldId(field.id);
    setDynamicFieldForm({
      name: field.name,
      field_type: field.field_type,
      options: (field.options || []).join(", "),
      is_required: field.is_required,
      sort_order: String(field.sort_order),
      placeholder: field.placeholder || "",
      unit: field.unit || "",
      is_active: field.is_active,
    });
  };

  const handleDeleteDynamicField = async (fieldId: number) => {
    try {
      await deleteFamilyDynamicField(fieldId);
      if (editingDynamicFieldId === fieldId) {
        setEditingDynamicFieldId(null);
        setDynamicFieldForm(emptyDynamicFieldForm);
      }
      await refreshAll("Campo dinâmico removido com sucesso.", selectedFamilyId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao remover campo dinâmico.",
      });
    }
  };

  const handleCreateMerchandise = async () => {
    if (
      !merchandiseForm.name.trim() ||
      !merchandiseForm.reference.trim() ||
      !merchandiseForm.category.trim()
    ) {
      setFeedback({
        type: "error",
        message: "Preencha nome, referência e categoria do merchandise.",
      });
      return;
    }

    try {
      await createStockMerchandise({
        name: merchandiseForm.name.trim(),
        reference: merchandiseForm.reference.trim(),
        category: merchandiseForm.category.trim(),
        minimum_stock: Number(merchandiseForm.minimum_stock || 0),
        maximum_stock: Number(merchandiseForm.maximum_stock || 0),
      });
      setMerchandiseForm({
        name: "",
        reference: "",
        category: "",
        minimum_stock: "",
        maximum_stock: "",
      });
      await refreshAll("Merchandise criado com sucesso.", selectedFamilyId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao criar merchandise.",
      });
    }
  };

  const handleAssignMerchandiseToFamily = async () => {
    if (!assignmentForm.familyId || bulkAssignSelectedIds.length === 0) {
      setFeedback({
        type: "error",
        message: "Escolha a família e adicione pelo menos um merchandise.",
      });
      return;
    }

    try {
      await assignMerchandisesToFamily(
        assignmentForm.familyId,
        bulkAssignSelectedIds,
      );
      setBulkAssignSelectedIds([]);
      setBulkAssignSearch("");
      setIsBulkAssignOpen(false);
      await refreshAll("Merchandise atribuído à família com sucesso.", assignmentForm.familyId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao atribuir merchandise à família.",
      });
    }
  };

  const handleLinkFamilyToProduct = async () => {
    if (!productLinkForm.productId) {
      setFeedback({ type: "error", message: "Escolha um produto das OPs." });
      return;
    }

    try {
      await updateOpsProductStockFamily(
        productLinkForm.productId,
        productLinkForm.familyId ? Number(productLinkForm.familyId) : null,
      );
      await refreshAll("Família ligada ao produto com sucesso.", selectedFamilyId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao ligar família ao produto.",
      });
    }
  };

  const handleLinkMerchandiseToSize = async () => {
    if (!sizeLinkForm.sizeId) {
      setFeedback({ type: "error", message: "Escolha um tamanho." });
      return false;
    }

    try {
      await updateOpsSizeStockMerchandise(
        sizeLinkForm.sizeId,
        sizeLinkForm.merchandiseId ? Number(sizeLinkForm.merchandiseId) : null,
      );
      await refreshAll("Merchandise ligado ao tamanho com sucesso.", selectedFamilyId);
      return true;
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao ligar merchandise ao tamanho.",
      });
      return false;
    }
  };

  const selectedProduct = products.find(
    (product) => String(product.id) === productLinkForm.productId,
  );
  const selectedSize = sizes.find(
    (size) => String(size.id) === sizeLinkForm.sizeId,
  );
  const selectedLinkMerchandise = merchandises.find(
    (merchandise) => String(merchandise.id) === sizeLinkForm.merchandiseId,
  );
  const assignmentFamily = families.find(
    (family) => String(family.id) === assignmentForm.familyId,
  );

  const bulkAssignResults = merchandises.filter((merchandise) => {
    const searchValue = bulkAssignSearch.toLowerCase();
    return (
      merchandise.reference.toLowerCase().includes(searchValue) ||
      merchandise.name.toLowerCase().includes(searchValue)
    );
  });

  const bulkAssignSelectedMerchandises = merchandises.filter((merchandise) =>
    bulkAssignSelectedIds.includes(merchandise.id),
  );

  const addMerchandiseToBulkAssign = (merchandiseId: number) => {
    setBulkAssignSelectedIds((current) =>
      current.includes(merchandiseId) ? current : [...current, merchandiseId],
    );
  };

  const removeMerchandiseFromBulkAssign = (merchandiseId: number) => {
    setBulkAssignSelectedIds((current) =>
      current.filter((id) => id !== merchandiseId),
    );
  };

  const openSizeLinkPicker = () => {
    setSizeFilterProductId("");
    setSizeFilterAssociationStatus("all");
    setSizeFilterSearch("");
    setMerchandiseLinkSearch("");
    setIsSizeLinkPickerOpen(true);
  };

  const filteredSizesForLink = sizes.filter((size) => {
    const matchesProduct =
      !sizeFilterProductId || String(size.tipo_saco) === String(sizeFilterProductId);
    const matchesAssociation =
      sizeFilterAssociationStatus === "all"
        ? true
        : sizeFilterAssociationStatus === "linked"
          ? Boolean(size.stock_merchandise)
          : !size.stock_merchandise;
    const normalizedSearch = sizeFilterSearch.toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      formatSizeLabel(size).toLowerCase().includes(normalizedSearch);

    return matchesProduct && matchesAssociation && matchesSearch;
  });

  const filteredMerchandisesForLink = merchandises.filter((merchandise) => {
    const normalizedSearch = merchandiseLinkSearch.toLowerCase();
    return (
      !normalizedSearch ||
      merchandise.name.toLowerCase().includes(normalizedSearch) ||
      merchandise.reference.toLowerCase().includes(normalizedSearch) ||
      merchandise.category.toLowerCase().includes(normalizedSearch)
    );
  });

  const renderFamilySection = () => (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Família Selecionada
        </h4>
        <div className="mt-4 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <select
            value={selectedFamilyId}
            onChange={(event) => setSelectedFamilyId(event.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Escolha uma família</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              value={familyForm.name}
              onChange={(event) =>
                setFamilyForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Nome da família"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
            />
            <select
              value={familyForm.product_type}
              onChange={(event) =>
                setFamilyForm((current) => ({
                  ...current,
                  product_type: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
            >
              {productTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <textarea
              value={familyForm.description}
              onChange={(event) =>
                setFamilyForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              placeholder="Descrição da família"
              className="md:col-span-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
            />
            <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
              <input
                type="checkbox"
                checked={familyForm.has_certification}
                onChange={(event) =>
                  setFamilyForm((current) => ({
                    ...current,
                    has_certification: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Esta família usa certificação
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleUpdateFamily} disabled={!selectedFamilyId}>
            Guardar Família
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Criar Nova Família
        </h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            type="text"
            value={createFamilyForm.name}
            onChange={(event) =>
              setCreateFamilyForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Nome"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={createFamilyForm.product_type}
            onChange={(event) =>
              setCreateFamilyForm((current) => ({
                ...current,
                product_type: event.target.value,
              }))
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          >
            {productTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            value={createFamilyForm.description}
            onChange={(event) =>
              setCreateFamilyForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={4}
            placeholder="Descrição"
            className="md:col-span-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          />
          <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
            <input
              type="checkbox"
              checked={createFamilyForm.has_certification}
              onChange={(event) =>
                setCreateFamilyForm((current) => ({
                  ...current,
                  has_certification: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Esta família usa certificação
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleCreateFamily}>Criar Família</Button>
        </div>
      </section>
    </div>
  );

  const renderDynamicFieldsSection = () => (
    <div className="space-y-6">
      {currentScope === "certification" && selectedFamilyId && !selectedFamily?.has_certification ? (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-6 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          A certificação está desativada para esta família. Ativa essa opção em `Famílias` para usar campos de certificação.
        </div>
      ) : null}
      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentScope === "entry"
                ? "Campos Dinâmicos da Entrada"
                : "Campos Dinâmicos da Certificação"}
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cada família define os seus próprios campos. Papel e cordão podem
              ter layouts diferentes sem mudar o código.
            </p>
          </div>
          <select
            value={selectedFamilyId}
            onChange={(event) => setSelectedFamilyId(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 lg:max-w-xs dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Escolha uma família</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedFamilyId ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Escolhe primeiro uma família para configurar os campos.
          </div>
        ) : (
          <div className="mt-5 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                  {editingDynamicFieldId ? "Editar Campo" : "Novo Campo"}
                </h5>
                {editingDynamicFieldId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDynamicFieldId(null);
                      setDynamicFieldForm(emptyDynamicFieldForm);
                    }}
                    className="text-sm text-blue-600 dark:text-blue-300"
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={dynamicFieldForm.name}
                  onChange={(event) =>
                    setDynamicFieldForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nome do campo"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                />
                <select
                  value={dynamicFieldForm.field_type}
                  onChange={(event) =>
                    setDynamicFieldForm((current) => ({
                      ...current,
                      field_type: event.target.value as DynamicField["field_type"],
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="text">Texto</option>
                  <option value="textarea">Texto Longo</option>
                  <option value="number">Número</option>
                  <option value="date">Data</option>
                  <option value="select">Escolha</option>
                </select>
                {dynamicFieldForm.field_type === "select" ? (
                  <input
                    type="text"
                    value={dynamicFieldForm.options}
                    onChange={(event) =>
                      setDynamicFieldForm((current) => ({
                        ...current,
                        options: event.target.value,
                      }))
                    }
                    placeholder="Opções separadas por vírgula"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                  />
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="number"
                    min="0"
                    value={dynamicFieldForm.sort_order}
                    onChange={(event) =>
                      setDynamicFieldForm((current) => ({
                        ...current,
                        sort_order: event.target.value,
                      }))
                    }
                    placeholder="Ordem"
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                  />
                  <input
                    type="text"
                    value={dynamicFieldForm.unit}
                    onChange={(event) =>
                      setDynamicFieldForm((current) => ({
                        ...current,
                        unit: event.target.value,
                      }))
                    }
                    placeholder="Unidade"
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <input
                  type="text"
                  value={dynamicFieldForm.placeholder}
                  onChange={(event) =>
                    setDynamicFieldForm((current) => ({
                      ...current,
                      placeholder: event.target.value,
                    }))
                  }
                  placeholder="Placeholder"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
                    <input
                      type="checkbox"
                      checked={dynamicFieldForm.is_required}
                      onChange={(event) =>
                        setDynamicFieldForm((current) => ({
                          ...current,
                          is_required: event.target.checked,
                        }))
                      }
                    />
                    Obrigatório
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
                    <input
                      type="checkbox"
                      checked={dynamicFieldForm.is_active}
                      onChange={(event) =>
                        setDynamicFieldForm((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                    />
                    Ativo
                  </label>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveDynamicField}>
                    {editingDynamicFieldId ? "Atualizar Campo" : "Criar Campo"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                  Campos Atuais
                </h5>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {visibleDynamicFields.length} campos
                </span>
              </div>
              {visibleDynamicFields.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Ainda não existem campos para esta família neste separador.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleDynamicFields.map((field) => (
                    <div
                      key={field.id}
                      className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {field.name}
                            </span>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                              {field.field_type}
                            </span>
                            {field.is_required ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                Obrigatório
                              </span>
                            ) : null}
                            {!field.is_active ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-500/10 dark:text-slate-300">
                                Inativo
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Chave: {field.key}
                            {field.unit ? ` | Unidade: ${field.unit}` : ""}
                            {field.placeholder
                              ? ` | Placeholder: ${field.placeholder}`
                              : ""}
                          </div>
                          {field.options && field.options.length > 0 ? (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Opções: {field.options.join(", ")}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDynamicField(field)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDynamicField(field.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );

  const renderMerchandiseSection = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Criar Merchandise
        </h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            type="text"
            value={merchandiseForm.name}
            onChange={(event) =>
              setMerchandiseForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Nome"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          />
          <input
            type="text"
            value={merchandiseForm.reference}
            onChange={(event) =>
              setMerchandiseForm((current) => ({
                ...current,
                reference: event.target.value,
              }))
            }
            placeholder="Referência"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          />
          <input
            type="text"
            value={merchandiseForm.category}
            onChange={(event) =>
              setMerchandiseForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
            placeholder="Categoria"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          />
          <input
            type="number"
            min="0"
            value={merchandiseForm.minimum_stock}
            onChange={(event) =>
              setMerchandiseForm((current) => ({
                ...current,
                minimum_stock: event.target.value,
              }))
            }
            placeholder="Stock mínimo"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          />
          <input
            type="number"
            min="0"
            value={merchandiseForm.maximum_stock}
            onChange={(event) =>
              setMerchandiseForm((current) => ({
                ...current,
                maximum_stock: event.target.value,
              }))
            }
            placeholder="Stock máximo"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleCreateMerchandise}>Criar Merchandise</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Atribuir Merchandise a Família
        </h4>
        <div className="mt-4 space-y-4">
          <select
            value={assignmentForm.familyId}
            onChange={(event) =>
              setAssignmentForm((current) => ({
                ...current,
                familyId: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Selecione a família</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {bulkAssignSelectedIds.length === 0
              ? "Nenhum merchandise preparado para adicionar."
              : `${bulkAssignSelectedIds.length} merchandises preparados para adicionar à família.`}
          </div>
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (!assignmentForm.familyId) {
                  setFeedback({
                    type: "error",
                    message: "Escolhe primeiro a família.",
                  });
                  return;
                }
                setIsBulkAssignOpen(true);
              }}
            >
              Adicionar Vários
            </Button>
            <Button
              onClick={handleAssignMerchandiseToFamily}
              disabled={bulkAssignSelectedIds.length === 0}
            >
              Guardar Todos
            </Button>
          </div>
        </div>
      </section>
    </div>
  );

  const renderLinksSection = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ligar Famílias aos Produtos das OPs
        </h4>
        <div className="mt-4 space-y-4">
          <select
            value={productLinkForm.productId}
            onChange={(event) =>
              setProductLinkForm((current) => ({
                ...current,
                productId: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Selecione o produto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.nome}
              </option>
            ))}
          </select>
          <select
            value={productLinkForm.familyId}
            onChange={(event) =>
              setProductLinkForm((current) => ({
                ...current,
                familyId: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Sem família ligada</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
          {selectedProduct ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Atual: {selectedProduct.stock_family_name || "Sem família"}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button onClick={handleLinkFamilyToProduct}>Guardar Ligação</Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ligar Merchandise aos Tamanhos das OPs
        </h4>
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-4 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tamanho selecionado
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {selectedSize ? formatSizeLabel(selectedSize) : "Nenhum tamanho selecionado"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Merchandise selecionado
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {selectedLinkMerchandise
                    ? `${selectedLinkMerchandise.name} | ${selectedLinkMerchandise.reference}`
                    : selectedSize?.stock_merchandise_name || "Sem merchandise"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={openSizeLinkPicker}>
              Escolher em Lista
            </Button>
            <Button onClick={handleLinkMerchandiseToSize} disabled={!sizeLinkForm.sizeId}>
              Guardar Ligação
            </Button>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[1380px]">
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Definições de Stock
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Configura famílias, campos dinâmicos, merchandises e ligações
                com as OPs num único fluxo.
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "A carregar..." : "Pronto"}
            </div>
          </div>

          {feedback ? (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
              {sideTabs.map((tab) => {
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
              {activeTab === "families" ? renderFamilySection() : null}
              {activeTab === "entry-fields" || activeTab === "certification-fields"
                ? renderDynamicFieldsSection()
                : null}
              {activeTab === "merchandise" ? renderMerchandiseSection() : null}
              {activeTab === "links" ? renderLinksSection() : null}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        className="m-4 max-w-[1100px]"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Adicionar Merchandises a {assignmentFamily?.name || "Família"}
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Pesquisa por referência, adiciona para a coluna da direita e
              depois guarda tudo de uma vez.
            </p>
          </div>

          <div className="mb-5">
            <input
              type="text"
              value={bulkAssignSearch}
              onChange={(event) => setBulkAssignSearch(event.target.value)}
              placeholder="Pesquisar por referência ou nome..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                  Resultados
                </h5>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {bulkAssignResults.length} artigos
                </span>
              </div>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {bulkAssignResults.map((merchandise) => {
                  const alreadySelected = bulkAssignSelectedIds.includes(
                    merchandise.id,
                  );

                  return (
                    <div
                      key={merchandise.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {merchandise.reference}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {merchandise.name} | Atual:{" "}
                          {merchandise.family || "Sem família"}
                        </p>
                      </div>
                      <Button
                        variant={alreadySelected ? "outline" : "primary"}
                        size="sm"
                        onClick={() => addMerchandiseToBulkAssign(merchandise.id)}
                        disabled={alreadySelected}
                      >
                        {alreadySelected ? "Adicionado" : "Adicionar"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                  A Adicionar
                </h5>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {bulkAssignSelectedMerchandises.length} selecionados
                </span>
              </div>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {bulkAssignSelectedMerchandises.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Ainda não adicionaste nenhum artigo.
                  </div>
                ) : (
                  bulkAssignSelectedMerchandises.map((merchandise) => (
                    <div
                      key={merchandise.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {merchandise.reference}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {merchandise.name}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removeMerchandiseFromBulkAssign(merchandise.id)
                        }
                      >
                        Remover
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSizeLinkPickerOpen}
        onClose={() => setIsSizeLinkPickerOpen(false)}
        className="m-4 max-w-[1320px]"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Ligar Merchandise aos Tamanhos
              </h4>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Escolhe um tamanho à esquerda e o merchandise à direita. Podes
                filtrar os tamanhos por produto e por estado de associação.
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredSizesForLink.length} tamanhos |{" "}
              {filteredMerchandisesForLink.length} merchandises
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                  Tamanhos
                </h5>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Produto + associação
                </span>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-[220px_180px_minmax(0,1fr)]">
                <select
                  value={sizeFilterProductId}
                  onChange={(event) => setSizeFilterProductId(event.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">Todos os produtos</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nome}
                    </option>
                  ))}
                </select>
                <select
                  value={sizeFilterAssociationStatus}
                  onChange={(event) =>
                    setSizeFilterAssociationStatus(
                      event.target.value as "all" | "linked" | "unlinked",
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="all">Todos</option>
                  <option value="linked">Com merchandise</option>
                  <option value="unlinked">Sem merchandise</option>
                </select>
                <input
                  type="text"
                  value={sizeFilterSearch}
                  onChange={(event) => setSizeFilterSearch(event.target.value)}
                  placeholder="Pesquisar tamanho..."
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {filteredSizesForLink.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Nenhum tamanho encontrado com estes filtros.
                  </div>
                ) : (
                  filteredSizesForLink.map((size) => {
                    const isSelected = String(size.id) === sizeLinkForm.sizeId;
                    const colors = Array.from(
                      new Set(
                        (size.gramagens || [])
                          .map((item) => item.cor_nome?.trim())
                          .filter(Boolean),
                      ),
                    );

                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() =>
                          setSizeLinkForm((current) => ({
                            ...current,
                            sizeId: String(size.id),
                            merchandiseId: size.stock_merchandise
                              ? String(size.stock_merchandise)
                              : current.sizeId === String(size.id)
                                ? current.merchandiseId
                                : "",
                          }))
                        }
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-800 dark:hover:border-blue-500/30 dark:hover:bg-gray-900"
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatSizeLabel(size)}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300">
                            Produto: {size.tipo_saco_nome}
                          </span>
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                            Cores: {colors.length > 0 ? colors.join(", ") : "Sem cores"}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 ${
                              size.stock_merchandise
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            }`}
                          >
                            {size.stock_merchandise_name || "Sem merchandise"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                  Merchandises
                </h5>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Filtro por texto
                </span>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={merchandiseLinkSearch}
                  onChange={(event) => setMerchandiseLinkSearch(event.target.value)}
                  placeholder="Pesquisar nome, referência ou categoria..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              <div className="mb-4 rounded-2xl border border-dashed border-gray-300 px-4 py-4 text-sm dark:border-gray-700">
                <div className="text-gray-600 dark:text-gray-300">
                  Tamanho atual:
                </div>
                <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {selectedSize ? formatSizeLabel(selectedSize) : "Nenhum tamanho selecionado"}
                </div>
              </div>

              <div className="max-h-[456px] space-y-2 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() =>
                    setSizeLinkForm((current) => ({
                      ...current,
                      merchandiseId: "",
                    }))
                  }
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    sizeLinkForm.merchandiseId === ""
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                      : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-800 dark:hover:border-blue-500/30 dark:hover:bg-gray-900"
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Sem merchandise
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Remove a associação atual do tamanho selecionado.
                  </div>
                </button>

                {filteredMerchandisesForLink.map((merchandise) => {
                  const isSelected =
                    String(merchandise.id) === sizeLinkForm.merchandiseId;

                  return (
                    <button
                      key={merchandise.id}
                      type="button"
                      onClick={() =>
                        setSizeLinkForm((current) => ({
                          ...current,
                          merchandiseId: String(merchandise.id),
                        }))
                      }
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                          : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-800 dark:hover:border-blue-500/30 dark:hover:bg-gray-900"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {merchandise.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {merchandise.reference} | {merchandise.category}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Família: {merchandise.family || "Sem família"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsSizeLinkPickerOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={async () => {
                const saved = await handleLinkMerchandiseToSize();
                if (saved) {
                  setIsSizeLinkPickerOpen(false);
                }
              }}
              disabled={!sizeLinkForm.sizeId}
            >
              Guardar Ligação
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
