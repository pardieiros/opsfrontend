import React, { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
// @ts-ignore: no declaration file for module '../../serviceapi/api'
import {
  clearProject3DCache,
  createProject3DIframeDomain,
  deleteProject3DIframeDomain,
  generateProject3DGlb,
  generateProject3DIframeToken,
  getCores,
  getProject3DDesignConfig,
  getProject3DIframeDomains,
  getProject3DModels,
  getTamanhos,
  getTipoSacos,
  saveProject3DDesignConfig,
  uploadProject3DImage,
} from "../../serviceapi/api";

interface TipoSaco {
  id: number;
  nome: string;
}

interface Tamanho {
  id: number;
  tipo_saco: number;
  tipo_saco_nome: string;
  largura: number | null;
  fole: number | null;
  altura: number | null;
}

interface Cor {
  id: number;
  nome: string;
}

interface Project3DModel {
  key: string;
  label: string;
  handle_style: string;
}

type PrintMode = "small" | "large";

interface PrintConfig {
  x: number;
  y: number;
  scale: number;
}

interface Project3DImageAsset {
  id: number;
  image_url: string;
  checksum?: string;
  filename?: string;
}

interface Project3DDesignConfig {
  id?: number;
  model: string;
  tamanho_id: number;
  cor_id?: number;
  print_small: PrintConfig;
  print_large: PrintConfig;
  image_asset?: Project3DImageAsset | null;
}

interface Project3DResult {
  model: string;
  glb_url: string;
  glb_view_url?: string;
  color_hex: string;
  cached: boolean;
  dims_cm: {
    width: number;
    gusset: number;
    height: number;
  };
  print_mode?: PrintMode;
  print_small?: PrintConfig;
  print_large?: PrintConfig;
  image_asset?: Project3DImageAsset | null;
}

interface IframeDomain {
  id: number;
  domain: string;
  is_active: boolean;
  has_token: boolean;
  token_masked?: string | null;
}

const DEFAULT_MODELS: Project3DModel[] = [
  { key: "asa_torcida", label: "Saco Asa Torcida", handle_style: "twisted" },
  { key: "model_m", label: "Model M", handle_style: "ribbon" },
];

const DEFAULT_PRINT_SMALL: PrintConfig = { x: 0, y: 0.05, scale: 0.22 };
const DEFAULT_PRINT_LARGE: PrintConfig = { x: 0, y: 0, scale: 0.42 };

const ModelViewerTag: any = "model-viewer";

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const sanitizePrintConfig = (value: any, fallback: PrintConfig): PrintConfig => {
  const x = Number(value?.x);
  const y = Number(value?.y);
  const scale = Number(value?.scale);
  return {
    x: Number.isFinite(x) ? clamp(x, -1, 1) : fallback.x,
    y: Number.isFinite(y) ? clamp(y, -1, 1) : fallback.y,
    scale: Number.isFinite(scale) ? clamp(scale, 0.05, 0.9) : fallback.scale,
  };
};

const formatNumber = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  const n = Number(value);
  return Number.isInteger(n) ? n.toString() : n.toString();
};

const formatDims = (tamanho: Tamanho): string =>
  `${formatNumber(tamanho.largura)}×${formatNumber(tamanho.fole)}×${formatNumber(tamanho.altura)}`;

const printModeLabel = (mode: PrintMode): string => (mode === "small" ? "Impressão pequena" : "Impressão grande");

const Project3d: React.FC = () => {
  const [models, setModels] = useState<Project3DModel[]>(DEFAULT_MODELS);
  const [tiposSaco, setTiposSaco] = useState<TipoSaco[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>("asa_torcida");
  const [selectedTamanho, setSelectedTamanho] = useState<string>("");
  const [selectedCor, setSelectedCor] = useState<string>("");

  const [imageAsset, setImageAsset] = useState<Project3DImageAsset | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [printMode, setPrintMode] = useState<PrintMode>("small");
  const [smallConfig, setSmallConfig] = useState<PrintConfig>({ ...DEFAULT_PRINT_SMALL });
  const [largeConfig, setLargeConfig] = useState<PrintConfig>({ ...DEFAULT_PRINT_LARGE });

  const [editorMode, setEditorMode] = useState<PrintMode | null>(null);
  const [editorConfig, setEditorConfig] = useState<PrintConfig>({ ...DEFAULT_PRINT_SMALL });

  const [isSavingOverall, setIsSavingOverall] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Project3DResult | null>(null);

  const [viewerReady, setViewerReady] = useState<boolean>(
    typeof window !== "undefined" && Boolean(window.customElements?.get("model-viewer"))
  );
  const [viewerLoadError, setViewerLoadError] = useState<string | null>(null);
  const [viewerSource, setViewerSource] = useState<string>("");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [iframeDomains, setIframeDomains] = useState<IframeDomain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainsError, setDomainsError] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [domainActionId, setDomainActionId] = useState<number | null>(null);
  const [tokenByDomain, setTokenByDomain] = useState<Record<number, string>>({});
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(
          `script[src="${src}"], script[data-model-viewer-src="${src}"]`
        ) as
          | HTMLScriptElement
          | null;
        if (existing) {
          if (window.customElements?.get("model-viewer")) {
            resolve();
            return;
          }
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("failed")), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.type = "module";
        script.src = src;
        script.setAttribute("data-model-viewer-src", src);
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("failed"));
        document.head.appendChild(script);
      });

    const ensureViewer = async () => {
      if (window.customElements?.get("model-viewer")) {
        if (!cancelled) setViewerReady(true);
        return;
      }

      const sources = [
        "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js",
        "https://cdn.jsdelivr.net/npm/@google/model-viewer/dist/model-viewer.min.js",
      ];

      for (const src of sources) {
        try {
          await loadScript(src);
          if (window.customElements?.get("model-viewer")) break;
        } catch {
          // try next CDN
        }
      }

      const ready = Boolean(window.customElements?.get("model-viewer"));
      if (!cancelled) {
        setViewerReady(ready);
        if (!ready) {
          setViewerLoadError("Viewer 3D indisponível no browser/rede. Usa o link de download GLB.");
        }
      }
    };

    ensureViewer();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!result) {
      setViewerSource("");
      return;
    }
    const source = result.glb_view_url || result.glb_url;
    setViewerSource(source);
  }, [result]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken") || "";
        const [tamanhosData, tiposSacoData, coresData, modelsResponse] = await Promise.all([
          getTamanhos(token),
          getTipoSacos(token),
          getCores(token),
          getProject3DModels(token).catch(() => null),
        ]);

        setTamanhos(Array.isArray(tamanhosData) ? tamanhosData : []);
        setTiposSaco(Array.isArray(tiposSacoData) ? tiposSacoData : []);
        setCores(Array.isArray(coresData) ? coresData : []);
        if (modelsResponse && Array.isArray(modelsResponse.models) && modelsResponse.models.length > 0) {
          setModels(modelsResponse.models);
          setSelectedModel(modelsResponse.models[0].key);
        }
      } catch (err: any) {
        setError(err?.message || "Falha ao carregar dados do Project3d.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredTamanhos = useMemo(() => {
    const normalizedModel = normalizeText(selectedModel);
    if (normalizedModel === "asa_torcida" || normalizedModel === "asa torcida") {
      const tipoIds = tiposSaco
        .filter((t) => normalizeText(t.nome).includes("torcida"))
        .map((t) => t.id);
      const filtered = tamanhos.filter(
        (t) => tipoIds.includes(t.tipo_saco) || normalizeText(t.tipo_saco_nome).includes("torcida")
      );
      return filtered.length > 0 ? filtered : tamanhos;
    }

    if (normalizedModel === "model_m" || normalizedModel === "model m") {
      const tipoIds = tiposSaco
        .filter((t) => normalizeText(t.nome).includes("model m"))
        .map((t) => t.id);
      if (tipoIds.length > 0) {
        const filtered = tamanhos.filter((t) => tipoIds.includes(t.tipo_saco));
        if (filtered.length > 0) return filtered;
      }
      return tamanhos;
    }

    return tamanhos;
  }, [selectedModel, tamanhos, tiposSaco]);

  useEffect(() => {
    if (!selectedTamanho) return;
    const selectedId = Number(selectedTamanho);
    const exists = filteredTamanhos.some((t) => t.id === selectedId);
    if (!exists) setSelectedTamanho("");
  }, [filteredTamanhos, selectedTamanho]);

  useEffect(() => {
    if (!selectedModel || !selectedTamanho || !selectedCor) {
      setSmallConfig({ ...DEFAULT_PRINT_SMALL });
      setLargeConfig({ ...DEFAULT_PRINT_LARGE });
      setImageAsset(null);
      return;
    }

    let cancelled = false;

    const loadSavedDesign = async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const data = await getProject3DDesignConfig(
          {
            model: selectedModel,
            tamanho_id: Number(selectedTamanho),
            cor_id: Number(selectedCor),
          },
          token
        );

        if (cancelled) return;

        const design: Project3DDesignConfig | undefined = data?.design;
        if (!design) {
          setSmallConfig({ ...DEFAULT_PRINT_SMALL });
          setLargeConfig({ ...DEFAULT_PRINT_LARGE });
          setImageAsset(null);
          return;
        }

        setSmallConfig(sanitizePrintConfig(design.print_small, DEFAULT_PRINT_SMALL));
        setLargeConfig(sanitizePrintConfig(design.print_large, DEFAULT_PRINT_LARGE));
        setImageAsset(design.image_asset || null);

        if (data?.exists) {
          setStatusMessage("Configuração final carregada.");
        }
      } catch {
        if (!cancelled) {
          setSmallConfig({ ...DEFAULT_PRINT_SMALL });
          setLargeConfig({ ...DEFAULT_PRINT_LARGE });
          setImageAsset(null);
        }
      }
    };

    loadSavedDesign();

    return () => {
      cancelled = true;
    };
  }, [selectedModel, selectedTamanho, selectedCor]);

  useEffect(() => {
    if (!editorMode) return;
    setEditorConfig(editorMode === "small" ? { ...smallConfig } : { ...largeConfig });
  }, [editorMode, smallConfig, largeConfig]);

  const generatePreview = async (overrides?: {
    mode?: PrintMode;
    small?: PrintConfig;
    large?: PrintConfig;
    asset?: Project3DImageAsset | null;
  }) => {
    if (!selectedModel || !selectedTamanho || !selectedCor) {
      setError("Seleciona modelo, tamanho e cor para gerar o GLB.");
      return;
    }

    const token = localStorage.getItem("accessToken") || "";
    const mode = overrides?.mode || printMode;
    const small = overrides?.small || smallConfig;
    const large = overrides?.large || largeConfig;
    const asset = overrides?.asset !== undefined ? overrides.asset : imageAsset;

    setIsGenerating(true);
    setError(null);
    setViewerLoadError(null);

    try {
      const payload: any = {
        model: selectedModel,
        tamanho_id: Number(selectedTamanho),
        cor_id: Number(selectedCor),
        print_mode: mode,
        print_small: small,
        print_large: large,
      };
      if (asset?.id) payload.image_asset_id = asset.id;

      const data = await generateProject3DGlb(payload, token);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Falha ao gerar o GLB.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);
    setStatusMessage(null);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const data = await uploadProject3DImage(file, token);
      const asset = data?.asset || null;
      setImageAsset(asset);
      setStatusMessage("Imagem carregada. Usa 'Gerar Project3d' para renderizar no saco.");

      if (asset && selectedModel && selectedTamanho && selectedCor) {
        await generatePreview({ asset });
      }
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar imagem.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleApplyEditorToPreview = async () => {
    if (!editorMode) return;

    if (editorMode === "small") {
      setSmallConfig({ ...editorConfig });
      setPrintMode("small");
      await generatePreview({ mode: "small", small: { ...editorConfig } });
    } else {
      setLargeConfig({ ...editorConfig });
      setPrintMode("large");
      await generatePreview({ mode: "large", large: { ...editorConfig } });
    }
  };

  const handleSavePrintConfig = async () => {
    if (!editorMode) return;

    if (editorMode === "small") {
      setSmallConfig({ ...editorConfig });
      setPrintMode("small");
      setStatusMessage("Impressão pequena guardada localmente.");
      await generatePreview({ mode: "small", small: { ...editorConfig } });
    } else {
      setLargeConfig({ ...editorConfig });
      setPrintMode("large");
      setStatusMessage("Impressão grande guardada localmente.");
      await generatePreview({ mode: "large", large: { ...editorConfig } });
    }
  };

  const handleSaveOverall = async () => {
    if (!selectedModel || !selectedTamanho || !selectedCor) {
      setError("Seleciona modelo, tamanho e cor antes de guardar overall.");
      return;
    }

    setIsSavingOverall(true);
    setError(null);

    try {
      const effectiveSmall = editorMode === "small" ? { ...editorConfig } : { ...smallConfig };
      const effectiveLarge = editorMode === "large" ? { ...editorConfig } : { ...largeConfig };
      setSmallConfig(effectiveSmall);
      setLargeConfig(effectiveLarge);

      const token = localStorage.getItem("accessToken") || "";
      await saveProject3DDesignConfig(
        {
          model: selectedModel,
          tamanho_id: Number(selectedTamanho),
          cor_id: Number(selectedCor),
          image_asset_id: imageAsset?.id || null,
          print_small: effectiveSmall,
          print_large: effectiveLarge,
        },
        token
      );
      setStatusMessage("Configuração overall guardada com sucesso.");
    } catch (err: any) {
      setError(err?.message || "Falha ao guardar configuração overall.");
    } finally {
      setIsSavingOverall(false);
    }
  };

  const handleLoadDefault = () => {
    setSmallConfig({ ...DEFAULT_PRINT_SMALL });
    setLargeConfig({ ...DEFAULT_PRINT_LARGE });
    setImageAsset(null);
    setResult(null);
    setStatusMessage("Definições repostas para default. Clica em 'Gerar Project3d'.");
  };

  const loadIframeDomains = async () => {
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const data = await getProject3DIframeDomains(token);
      setIframeDomains(Array.isArray(data?.domains) ? data.domains : []);
    } catch (err: any) {
      setDomainsError(err?.message || "Falha ao carregar domínios.");
    } finally {
      setDomainsLoading(false);
    }
  };

  const openSettings = async () => {
    setSettingsOpen(true);
    await loadIframeDomains();
  };

  const handleCreateDomain = async () => {
    if (!newDomain.trim()) return;

    setDomainActionId(-1);
    setDomainsError(null);
    try {
      const token = localStorage.getItem("accessToken") || "";
      await createProject3DIframeDomain(newDomain.trim(), token);
      setNewDomain("");
      await loadIframeDomains();
    } catch (err: any) {
      setDomainsError(err?.message || "Falha ao criar domínio.");
    } finally {
      setDomainActionId(null);
    }
  };

  const handleDeleteDomain = async (domainId: number) => {
    setDomainActionId(domainId);
    setDomainsError(null);
    try {
      const token = localStorage.getItem("accessToken") || "";
      await deleteProject3DIframeDomain(domainId, token);
      setTokenByDomain((prev) => {
        const next = { ...prev };
        delete next[domainId];
        return next;
      });
      await loadIframeDomains();
    } catch (err: any) {
      setDomainsError(err?.message || "Falha ao eliminar domínio.");
    } finally {
      setDomainActionId(null);
    }
  };

  const handleGenerateDomainToken = async (domainId: number) => {
    setDomainActionId(domainId);
    setDomainsError(null);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const data = await generateProject3DIframeToken(domainId, token);
      if (data?.token) {
        setTokenByDomain((prev) => ({ ...prev, [domainId]: data.token }));
      }
      await loadIframeDomains();
    } catch (err: any) {
      setDomainsError(err?.message || "Falha ao gerar token.");
    } finally {
      setDomainActionId(null);
    }
  };

  const handleCopyToken = async (domainId: number) => {
    const raw = tokenByDomain[domainId];
    if (!raw) {
      setDomainsError("O token real só aparece no momento da geração. Gere um novo token para copiar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(raw);
      setDomainsError(null);
      setStatusMessage("Token copiado para o clipboard.");
    } catch {
      setDomainsError("Não foi possível copiar para o clipboard.");
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    setDomainsError(null);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const data = await clearProject3DCache(token);
      const removed = Number(data?.removed || 0);
      setStatusMessage(`Cache GLB limpa. ${removed} ficheiro(s) removido(s).`);
    } catch (err: any) {
      setDomainsError(err?.message || "Falha ao limpar cache GLB.");
    } finally {
      setIsClearingCache(false);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando Project3d...</div>;
  }

  return (
    <>
      <PageMeta title="Project3d" description="Geração e preview de saco 3D (GLB)" />
      <PageBreadcrumb pageTitle="Project3d" />

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openSettings}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          Definições iframe
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Configuração</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo</label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {models.map((model) => (
                    <option key={model.key} value={model.key}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Tamanho</label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={selectedTamanho}
                  onChange={(e) => setSelectedTamanho(e.target.value)}
                >
                  <option value="">Seleciona um tamanho</option>
                  {filteredTamanhos.map((tamanho) => (
                    <option key={tamanho.id} value={tamanho.id}>
                      {formatDims(tamanho)} ({tamanho.tipo_saco_nome})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Cor</label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={selectedCor}
                  onChange={(e) => setSelectedCor(e.target.value)}
                >
                  <option value="">Seleciona uma cor</option>
                  {cores.map((cor) => (
                    <option key={cor.id} value={cor.id}>
                      {cor.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Imagem para impressão</label>
                <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {imageAsset?.image_url ? (
                    <img src={imageAsset.image_url} alt="Imagem carregada" className="max-h-28 rounded-md object-contain" />
                  ) : (
                    <span>Clica para escolher a imagem (png/jpg/webp)</span>
                  )}
                  <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {isUploadingImage ? "A carregar imagem..." : imageAsset?.filename || "Sem imagem carregada"}
                  </span>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Preview da impressão</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintMode("small")}
                    className={`h-10 rounded-lg border text-sm font-medium ${
                      printMode === "small"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    Pequena
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintMode("large")}
                    className={`h-10 rounded-lg border text-sm font-medium ${
                      printMode === "large"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    Grande
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => generatePreview()}
                disabled={isGenerating}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isGenerating ? "A gerar GLB..." : "Gerar Project3d"}
              </button>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleSaveOverall}
                  disabled={isSavingOverall}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                >
                  {isSavingOverall ? "A guardar..." : "Guardar Overall"}
                </button>
                <button
                  type="button"
                  onClick={handleLoadDefault}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  Carregar Default
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200">
              {statusMessage}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
              GLB gerado com sucesso {result.cached ? "(cache)" : "(novo)"} para {printModeLabel(printMode)}.
            </div>
          )}
        </div>

        <div className="xl:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Preview 3D</h2>

            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_300px]">
              <div>
                {result ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                      {viewerReady ? (
                        <ModelViewerTag
                          src={viewerSource || result.glb_url}
                          alt={`Preview ${result.model}`}
                          camera-controls
                          auto-rotate
                          shadow-intensity="1"
                          exposure="1"
                          onError={() => setViewerLoadError("Falha no render 3D. Podes abrir o GLB no link abaixo.")}
                          style={{ width: "100%", height: "560px" }}
                        />
                      ) : (
                        <div className="flex h-[560px] items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                          Viewer 3D indisponível. Usa o link de download para abrir o GLB.
                        </div>
                      )}
                    </div>
                    {viewerLoadError && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-200">
                        {viewerLoadError}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span>
                        Dimensões: {result.dims_cm.width}x{result.dims_cm.gusset}x{result.dims_cm.height} cm
                      </span>
                      <span>Cor: {result.color_hex}</span>
                      <span>Modo: {printModeLabel(printMode)}</span>
                      <a
                        href={viewerSource || result.glb_url}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir/Download GLB
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[560px] items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Seleciona modelo, tamanho e cor, carrega imagem e gera o preview 3D.
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Barra lateral de impressão</h3>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorMode("small")}
                    className={`h-9 rounded-lg border text-xs font-medium ${
                      editorMode === "small"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Editar pequena
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode("large")}
                    className={`h-9 rounded-lg border text-xs font-medium ${
                      editorMode === "large"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Editar grande
                  </button>
                </div>

                {editorMode ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{printModeLabel(editorMode)}</p>

                    <div>
                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                        Horizontal: {editorConfig.x.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.01}
                        value={editorConfig.x}
                        onChange={(e) => setEditorConfig((prev) => ({ ...prev, x: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                        Vertical: {editorConfig.y.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.01}
                        value={editorConfig.y}
                        onChange={(e) => setEditorConfig((prev) => ({ ...prev, y: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                        Tamanho: {editorConfig.scale.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min={0.05}
                        max={0.9}
                        step={0.01}
                        value={editorConfig.scale}
                        onChange={(e) => setEditorConfig((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyEditorToPreview}
                      className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      Aplicar no preview
                    </button>

                    <button
                      type="button"
                      onClick={handleSavePrintConfig}
                      className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Guardar {editorMode === "small" ? "impressão pequena" : "impressão grande"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Seleciona uma impressão para ajustar posição e tamanho.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Definições de domínio/iframe</h3>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="my.plasticosdao.com"
                    className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCreateDomain}
                    disabled={domainActionId === -1}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    Adicionar domínio
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed dark:border-red-700 dark:bg-gray-800 dark:text-red-300"
                >
                  {isClearingCache ? "A limpar cache..." : "Apagar cache GLB"}
                </button>
              </div>

              {domainsError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                  {domainsError}
                </div>
              )}

              {domainsLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-300">A carregar domínios...</div>
              ) : iframeDomains.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
                  Ainda não há domínios configurados.
                </div>
              ) : (
                <div className="space-y-3">
                  {iframeDomains.map((domain) => {
                    const visibleToken = tokenByDomain[domain.id];
                    const tokenLabel = visibleToken || domain.token_masked || "Sem token";
                    return (
                      <div
                        key={domain.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{domain.domain}</p>
                            <p className="mt-1 break-all text-xs text-gray-600 dark:text-gray-300">Token: {tokenLabel}</p>
                            {visibleToken && (
                              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                O token em texto real só está visível agora.
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateDomainToken(domain.id)}
                              disabled={domainActionId === domain.id}
                              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                            >
                              Novo token
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyToken(domain.id)}
                              className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                            >
                              Copy clipboard
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDomain(domain.id)}
                              disabled={domainActionId === domain.id}
                              className="inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed dark:border-red-700 dark:bg-gray-900 dark:text-red-300"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Project3d;
