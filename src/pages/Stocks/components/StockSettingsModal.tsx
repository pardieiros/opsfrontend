import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
// @ts-ignore: legacy JS service module
import {
  assignMerchandisesToFamily,
  createStockFamily,
  createStockMerchandise,
  fetchOpsProducts,
  fetchOpsSizes,
  fetchStockFamilies,
  fetchStockMerchandises,
  updateOpsProductStockFamily,
  updateOpsSizeStockMerchandise,
} from "../../../serviceapi/api";

interface StockFamily {
  id: number;
  name: string;
  description: string | null;
  product_type: string;
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
  stock_merchandise?: number | null;
  stock_merchandise_name?: string | null;
}

interface StockSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => Promise<void> | void;
}

const productTypeOptions = [
  { value: "none", label: "Nenhum" },
  { value: "finished_product", label: "Finished Product" },
  { value: "paper_reel", label: "Paper Reel" },
  { value: "rope", label: "Rope" },
  { value: "reinforcement", label: "Reinforcement" },
  { value: "packing_box", label: "Packing Box" },
];

function formatSizeLabel(size: OpsSize) {
  const parts = [size.largura, size.fole, size.altura]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value));

  const dimensions = parts.join(" x ");
  return `${size.tipo_saco_nome} | ${dimensions || "Sem dimensões"} | ${size.grupo}`;
}

export default function StockSettingsModal({
  isOpen,
  onClose,
  onDataChanged,
}: StockSettingsModalProps) {
  const [families, setFamilies] = useState<StockFamily[]>([]);
  const [merchandises, setMerchandises] = useState<StockMerchandise[]>([]);
  const [products, setProducts] = useState<OpsProduct[]>([]);
  const [sizes, setSizes] = useState<OpsSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [familyForm, setFamilyForm] = useState({
    name: "",
    description: "",
    product_type: "none",
  });
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

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  const refreshAll = async (successMessage: string) => {
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
    await onDataChanged();
  };

  const handleCreateFamily = async () => {
    if (!familyForm.name.trim()) {
      setFeedback({ type: "error", message: "Indique o nome da família." });
      return;
    }

    try {
      await createStockFamily({
        name: familyForm.name.trim(),
        description: familyForm.description.trim(),
        product_type: familyForm.product_type,
      });
      setFamilyForm({ name: "", description: "", product_type: "none" });
      await refreshAll("Família criada com sucesso.");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao criar família.",
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
      await refreshAll("Merchandise criado com sucesso.");
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
      await refreshAll("Merchandise atribuído à família com sucesso.");
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
      await refreshAll("Família ligada ao produto com sucesso.");
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
      return;
    }

    try {
      await updateOpsSizeStockMerchandise(
        sizeLinkForm.sizeId,
        sizeLinkForm.merchandiseId ? Number(sizeLinkForm.merchandiseId) : null,
      );
      await refreshAll("Merchandise ligado ao tamanho com sucesso.");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao ligar merchandise ao tamanho.",
      });
    }
  };

  const selectedProduct = products.find(
    (product) => String(product.id) === productLinkForm.productId,
  );
  const selectedSize = sizes.find(
    (size) => String(size.id) === sizeLinkForm.sizeId,
  );
  const assignmentFamily = families.find(
    (family) => String(family.id) === assignmentForm.familyId,
  );
  const bulkAssignResults = merchandises.filter((merchandise) => {
    const matchesSearch = merchandise.reference
      .toLowerCase()
      .includes(bulkAssignSearch.toLowerCase());

    return matchesSearch;
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[1200px]">
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Definições de Stock
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Criar famílias e merchandises, atribuir famílias aos produtos das
              OPs e merchandises aos tamanhos.
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "A carregar..." : "Pronto"}
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Criar Family
            </h4>
            <div className="mt-4 space-y-4">
              <input
                type="text"
                value={familyForm.name}
                onChange={(event) =>
                  setFamilyForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Nome da family"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
              />
              <textarea
                value={familyForm.description}
                onChange={(event) =>
                  setFamilyForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Descrição"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
              />
              <select
                value={familyForm.product_type}
                onChange={(event) =>
                  setFamilyForm((current) => ({
                    ...current,
                    product_type: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
              >
                {productTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="flex justify-end">
                <Button onClick={handleCreateFamily}>Criar Family</Button>
              </div>
            </div>
          </section>

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
              <Button onClick={handleCreateMerchandise}>
                Criar Merchandise
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atribuir Merchandise a Family
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
                <option value="">Selecione a family</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {bulkAssignSelectedIds.length === 0
                  ? "Nenhum merchandise preparado para adicionar."
                  : `${bulkAssignSelectedIds.length} merchandises preparados para adicionar à family.`}
              </div>
              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!assignmentForm.familyId) {
                      setFeedback({
                        type: "error",
                        message: "Escolhe primeiro a family.",
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

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ligar Families aos Produtos das OPs
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
                <option value="">Sem family ligada</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Atual: {selectedProduct.stock_family_name || "Sem family"}
                </p>
              )}
              <div className="flex justify-end">
                <Button onClick={handleLinkFamilyToProduct}>
                  Guardar Ligação
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:col-span-2">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ligar Merchandises aos Tamanhos das OPs
            </h4>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr_auto]">
              <select
                value={sizeLinkForm.sizeId}
                onChange={(event) =>
                  setSizeLinkForm((current) => ({
                    ...current,
                    sizeId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Selecione o tamanho</option>
                {sizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {formatSizeLabel(size)}
                  </option>
                ))}
              </select>
              <select
                value={sizeLinkForm.merchandiseId}
                onChange={(event) =>
                  setSizeLinkForm((current) => ({
                    ...current,
                    merchandiseId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Sem merchandise ligado</option>
                {merchandises.map((merchandise) => (
                  <option key={merchandise.id} value={merchandise.id}>
                    {merchandise.name} | {merchandise.reference}
                  </option>
                ))}
              </select>
              <Button onClick={handleLinkMerchandiseToSize}>
                Guardar
              </Button>
            </div>
            {selectedSize && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Atual: {selectedSize.stock_merchandise_name || "Sem merchandise"}
              </p>
            )}
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        className="m-4 max-w-[1100px]"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Adicionar Merchandises a {assignmentFamily?.name || "Family"}
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Pesquisa por referência, adiciona para a coluna da direita e
              depois guarda todos de uma vez.
            </p>
          </div>

          <div className="mb-5">
            <input
              type="text"
              value={bulkAssignSearch}
              onChange={(event) => setBulkAssignSearch(event.target.value)}
              placeholder="Pesquisar por reference..."
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
                          {merchandise.family || "Sem family"}
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

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsBulkAssignOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={handleAssignMerchandiseToFamily}
              disabled={bulkAssignSelectedIds.length === 0}
            >
              Adicionar Todos
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
