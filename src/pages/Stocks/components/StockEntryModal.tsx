import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
// @ts-ignore: legacy JS service module
import {
  createStockEntry,
  fetchStockMerchandises,
} from "../../../serviceapi/api";

interface StockFamily {
  id: number;
  name: string;
}

interface StockMerchandise {
  id: number;
  family_id?: number | null;
  family?: string | null;
  name: string;
  reference: string;
  current_quantity: number;
}

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: StockFamily[];
  defaultFamilyId?: string;
  onEntryCreated: () => Promise<void> | void;
}

export default function StockEntryModal({
  isOpen,
  onClose,
  families,
  defaultFamilyId = "",
  onEntryCreated,
}: StockEntryModalProps) {
  const [merchandises, setMerchandises] = useState<StockMerchandise[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState(defaultFamilyId);
  const [selectedMerchandiseId, setSelectedMerchandiseId] = useState("");
  const [numberOfBoxes, setNumberOfBoxes] = useState("1");
  const [quantityPerBox, setQuantityPerBox] = useState("1");

  useEffect(() => {
    if (!isOpen) return;

    async function loadMerchandises() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStockMerchandises();
        setMerchandises(data);
      } catch (err: any) {
        console.error("Erro ao carregar merchandises:", err);
        setError(err.message || "Erro ao carregar merchandises.");
      } finally {
        setLoading(false);
      }
    }

    setSelectedFamilyId(defaultFamilyId);
    setSelectedMerchandiseId("");
    setNumberOfBoxes("1");
    setQuantityPerBox("1");
    loadMerchandises();
  }, [isOpen, defaultFamilyId]);

  const filteredMerchandises = selectedFamilyId
    ? merchandises.filter(
        (merchandise) =>
          String(merchandise.family_id || "") === String(selectedFamilyId),
      )
    : merchandises;

  const handleSubmit = async () => {
    const parsedNumberOfBoxes = Number(numberOfBoxes);
    const parsedQuantityPerBox = Number(quantityPerBox);
    if (!selectedMerchandiseId) {
      setError("Selecione um merchandise.");
      return;
    }

    if (!Number.isFinite(parsedNumberOfBoxes) || parsedNumberOfBoxes <= 0) {
      setError("O nº de caixas tem de ser superior a zero.");
      return;
    }

    if (!Number.isFinite(parsedQuantityPerBox) || parsedQuantityPerBox <= 0) {
      setError("A quantidade por caixa tem de ser superior a zero.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const selectedMerchandise = merchandises.find(
        (merchandise) => String(merchandise.id) === selectedMerchandiseId,
      );

      if (!selectedMerchandise) {
        setError("Merchandise inválido.");
        return;
      }

      await createStockEntry({
        product_name: selectedMerchandise.name,
        number_of_boxes: parsedNumberOfBoxes,
        quantity_per_box: parsedQuantityPerBox,
        box_type: "Caixa",
        obs: "",
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[640px]">
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Adicionar Entrada
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Escolha a family, o merchandise, o nº de caixas e a quantidade por
            caixa.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Family
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
              onChange={(event) => setSelectedMerchandiseId(event.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">
                {loading
                  ? "A carregar merchandises..."
                  : "Selecione um merchandise"}
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
              Nº de Caixas
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={numberOfBoxes}
              onChange={(event) => setNumberOfBoxes(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantidade por Caixa
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantityPerBox}
              onChange={(event) => setQuantityPerBox(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || loading}>
              {submitting ? "A guardar..." : "Adicionar Entrada"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
