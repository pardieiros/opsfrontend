import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";

import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { print360Scan, resolve360Barcode } from "../../serviceapi/imprimir360";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrinterOption {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  is_default: boolean;
}

interface ScanResponse {
  scan_event?: {
    id: number;
    message: string;
  };
  order_line?: {
    order_line_id: number;
    description: string;
    label_quantity: number;
    route_type: "stock" | "shipment" | "unknown";
  };
  printers?: PrinterOption[];
  message?: string;
  detail?: string;
  notFound?: boolean;
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (input: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

const supportedFormats = [
  "code_128",
  "code_39",
  "ean_13",
  "ean_8",
  "itf",
  "upc_a",
  "upc_e",
  "qr_code",
];

export default function BarcodeScannerModal({
  isOpen,
  onClose,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const detectingRef = useRef(false);
  const lastCodeRef = useRef("");

  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | undefined>(undefined);
  const [numberOfLabels, setNumberOfLabels] = useState("1");
  const [printFeedback, setPrintFeedback] = useState("");
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState(true);

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (zxingControlsRef.current) {
      zxingControlsRef.current.stop();
      zxingControlsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    detectingRef.current = false;
  };

  const handleResolveBarcode = async (barcode: string) => {
    if (!barcode.trim() || detectingRef.current) return;
    try {
      detectingRef.current = true;
      setIsResolving(true);
      setError("");
      setPrintFeedback("");
      const data = (await resolve360Barcode(barcode.trim())) as ScanResponse;
      setScanResult(data);

      const printers = data.printers || [];
      const defaultPrinter =
        printers.find((printer) => printer.is_default) || printers[0];
      setSelectedPrinterId(defaultPrinter?.id);

      const defaultLabels = data.order_line?.label_quantity || 1;
      setNumberOfLabels(String(defaultLabels));
      stopCamera();
    } catch (err: any) {
      setError(err.message || "Não foi possível processar o código.");
    } finally {
      setIsResolving(false);
      detectingRef.current = false;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setError("");
    setScanResult(null);
    setPrintFeedback("");
    lastCodeRef.current = "";

    const BarcodeDetectorApi = (window as any).BarcodeDetector as BarcodeDetectorCtor | undefined;
    setBarcodeDetectorSupported(Boolean(BarcodeDetectorApi));

    try {
      if (!BarcodeDetectorApi) {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.ITF,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);
        zxingReaderRef.current = reader;
        zxingControlsRef.current = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current || undefined,
          async (result, decodeError) => {
            if (!result) {
              if (decodeError && !(decodeError instanceof NotFoundException)) {
                setError("A leitura automática falhou. Tente aproximar mais o código ou use a entrada manual.");
              }
              return;
            }

            setError("");
            const rawValue = result.getText()?.trim();
            if (!rawValue || rawValue === lastCodeRef.current || detectingRef.current) {
              return;
            }

            lastCodeRef.current = rawValue;
            await handleResolveBarcode(rawValue);
          },
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new BarcodeDetectorApi({ formats: supportedFormats });
      const detectLoop = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || detectingRef.current) {
          animationRef.current = requestAnimationFrame(detectLoop);
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          const rawValue = codes[0]?.rawValue?.trim();
          if (rawValue && rawValue !== lastCodeRef.current) {
            lastCodeRef.current = rawValue;
            await handleResolveBarcode(rawValue);
            return;
          }
        } catch {
          // Ignore transient detector failures and continue scanning.
        }

        animationRef.current = requestAnimationFrame(detectLoop);
      };

      animationRef.current = requestAnimationFrame(detectLoop);
    } catch (err: any) {
      setError(err.message || "Não foi possível abrir a câmara.");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualCode("");
      setScanResult(null);
      setError("");
      setPrintFeedback("");
      return;
    }

    startCamera();
    return () => stopCamera();
  }, [isOpen]);

  const handleManualSubmit = async () => {
    await handleResolveBarcode(manualCode);
  };

  const handlePrint = async () => {
    if (!scanResult?.scan_event?.id) return;
    try {
      setIsPrinting(true);
      setError("");
      const job = await print360Scan({
        scan_event_id: scanResult.scan_event.id,
        printer_id: selectedPrinterId,
        number_of_labels: Number(numberOfLabels || 1),
      });
      setPrintFeedback(
        `Etiquetas enviadas com sucesso. Pedido #${job.id} para ${job.printer_name || "impressora selecionada"}.`,
      );
    } catch (err: any) {
      setError(err.message || "Erro ao imprimir etiquetas.");
    } finally {
      setIsPrinting(false);
    }
  };

  const resetScanner = async () => {
    setManualCode("");
    setScanResult(null);
    setSelectedPrinterId(undefined);
    setNumberOfLabels("1");
    setPrintFeedback("");
    await startCamera();
  };

  const printers = scanResult?.printers || [];
  const hasSinglePrinter = printers.length === 1;
  const canPrint = Boolean(scanResult?.order_line) && printers.length > 0;
  const isNotFound = Boolean(scanResult?.notFound || (!scanResult?.order_line && scanResult?.detail));
  const routeType = scanResult?.order_line?.route_type;
  const routeText =
    routeType === "shipment" ? "Vai hoje" : routeType === "stock" ? "Fica para stock" : "Sem rota";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="h-[100dvh] w-full max-w-none overflow-y-auto overscroll-y-contain rounded-none p-0 [-webkit-overflow-scrolling:touch] sm:h-auto sm:max-h-[92dvh] sm:w-[calc(100%-2rem)] sm:max-w-6xl sm:overflow-hidden sm:rounded-3xl"
    >
      <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-900">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
          <div className="pr-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 sm:text-2xl">
              Scan 360Imprimir
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              A leitura é automática mal o código de barras for detetado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Fechar scanner"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[34dvh] bg-gray-950 sm:min-h-[420px]">
          <video ref={videoRef} className="h-full min-h-[34dvh] w-full object-cover sm:min-h-[420px]" muted playsInline />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[150px] w-[260px] rounded-[24px] border-4 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)] sm:h-[220px] sm:w-[320px] sm:rounded-[28px]" />
          </div>
          {isResolving ? (
            <div className="absolute inset-x-4 top-4 z-10 rounded-2xl bg-black/65 px-4 py-3 text-sm text-white backdrop-blur">
              A validar encomenda...
            </div>
          ) : null}
          {scanResult ? (
            <div className="absolute inset-x-4 top-4 z-10 rounded-3xl border border-white/20 bg-slate-950/78 p-4 text-white shadow-2xl backdrop-blur">
              {isNotFound ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-200">
                    Encomenda não encontrada
                  </p>
                  <p className="text-sm text-white/80">
                    {scanResult.detail || "Não foi possível associar o código lido a uma encomenda."}
                  </p>
                  <Button variant="outline" onClick={resetScanner} className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-200">
                    Encomenda encontrada
                  </p>
                  <div>
                    <p className="text-xs text-white/60">OrderLine</p>
                    <p className="text-3xl font-semibold leading-none">
                      #{scanResult.order_line?.order_line_id}
                    </p>
                  </div>
                  <p className="text-sm text-white/80">
                    {routeText}. Pode imprimir ou fazer scan de outra encomenda.
                  </p>
                  <Button variant="outline" onClick={resetScanner} className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                    Scan outro
                  </Button>
                </div>
              )}
            </div>
          ) : null}
          <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/10 px-4 py-2 text-xs text-white backdrop-blur sm:bottom-4 sm:left-4 sm:right-auto sm:rounded-full sm:text-sm">
            Aponte a câmara traseira ao código de barras.
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-y-contain p-4 pb-8 [-webkit-overflow-scrolling:touch] sm:gap-5 sm:p-6">

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {printFeedback ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {printFeedback}
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Código manual
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleManualSubmit();
                  }
                }}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                placeholder={barcodeDetectorSupported ? "Introduzir só se necessário" : "Introduza o código de barras"}
              />
              <Button onClick={handleManualSubmit} disabled={isResolving} className="w-full sm:w-auto">
                {isResolving ? "A ler..." : "Ler"}
              </Button>
            </div>
          </div>

          {scanResult ? (
            <div className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Resultado</p>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white/90">
                    {routeText}
                  </h4>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    routeType === "shipment"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  }`}
                >
                  {routeType || "unknown"}
                </span>
              </div>

              {scanResult.order_line ? (
                <div className="space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    OrderLine #{scanResult.order_line.order_line_id}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-100">
                    {scanResult.order_line.description}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800/50 dark:text-gray-200">
                  {scanResult.detail || "Não foi possível associar o código a uma encomenda."}
                </div>
              )}

              {scanResult.order_line ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Número de etiquetas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numberOfLabels}
                      onChange={(event) => setNumberOfLabels(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                    />
                  </div>

                  {printers.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      Não existe impressora configurada na base de dados.
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {hasSinglePrinter ? "Impressora" : "Escolha a impressora"}
                      </label>
                      <select
                        value={selectedPrinterId || ""}
                        onChange={(event) => setSelectedPrinterId(Number(event.target.value))}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                      >
                        {printers.map((printer) => (
                          <option key={printer.id} value={printer.id}>
                            {printer.name} ({printer.ip_address}:{printer.port})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button variant="outline" onClick={resetScanner} className="w-full sm:w-auto">
                  {isNotFound ? "Tentar novamente" : "Scan outro"}
                </Button>
                <Button onClick={handlePrint} disabled={!canPrint || isPrinting} className="w-full sm:w-auto">
                  {isPrinting ? "A imprimir..." : "Imprimir etiquetas"}
                </Button>
              </div>
            </div>
          ) : null}

          {!scanResult && (
            <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Assim que o código for detetado, vai aparecer aqui a decisão se a encomenda vai hoje ou fica para stock.
            </div>
          )}
        </div>
        </div>
      </div>
    </Modal>
  );
}
