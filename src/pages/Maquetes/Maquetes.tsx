import React, { useState, useEffect, useMemo, useRef } from "react";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { fetchAllOrdensProducao } from "../../serviceapi/api";
import CardOP from "../../components/Ops/Card";
import { getOrdemProducao, uploadMaquete, getClientEmails, createClientEmail } from "../../serviceapi/api";
import Spinner from "../../components/ui/loaders/Spinner";
import Modal from "../../components/ui/modal/index";
import MaqueteCard from "../../components/Maquete/anexarmaquete";
import SendEmailMaquete from '../../components/Email/Sendemailmaquete';

export default function Maquetes() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Allowed statuses for Maquetes
  const allowedStatuses = [
    "Aguardando Maquete",
    "Maquete não enviada",
    "Maquete em aprovação",
    "Maquete Aprovada",
    "Maquete Reprovada",
  ];

  // Dropdown open state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Collapse email panel when maquete exists
  const [emailCollapsed, setEmailCollapsed] = useState<boolean>(false);

  // Status filtering
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  // Email compose modal
  const [composeOp, setComposeOp] = useState<any | null>(null);
  // File attachment for maquete
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [maqueteFile, setMaqueteFile] = useState<File | null>(null);

  // PDF preview state
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  const [loadingOpDetails, setLoadingOpDetails] = useState<boolean>(false);
  // Client emails modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [clientEmailList, setClientEmailList] = useState<{id: number; email: string;}[]>([]);
  const [recipientEmail, setRecipientEmail] = useState<string>("");

  // Handler to upload maquete and refresh OP details
  const handleSend = async (colors: string[], sacoLiso: boolean) => {
    if (!maqueteFile || !composeOp) return;
    const token = localStorage.getItem("accessToken") || "";
    const formData = new FormData();
    formData.append("file", maqueteFile);
    formData.append("ordem", String(composeOp.id));
    formData.append("saco_liso", sacoLiso.toString());
    colors.forEach(color => {
      if (color.trim()) formData.append("cores_impressao", color.trim());
    });
    // Debug: show payload entries
    console.log("Maquete payload entries:");
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }
    try {
      await uploadMaquete(formData, token);
      // Prompt to save new client email if it doesn't already exist
      if (recipientEmail && !clientEmailList.some(e => e.email === recipientEmail)) {
        if (window.confirm(`Deseja associar ${recipientEmail} ao cliente?`)) {
          const fdEmail = new FormData();
          fdEmail.append("client", String(composeOp.id));
          fdEmail.append("email", recipientEmail);
          await createClientEmail(fdEmail, token);
        }
      }
      // Refresh OP details to get new maqueta_file_url
      await handleOpSelect(composeOp.id);
      setMaqueteFile(null);
    } catch (err) {
      console.error("Erro ao enviar maquete:", err);
    }
  };

  // Fetch full OP details including maqueta_file_url
  const handleOpSelect = async (id: number) => {
    setLoadingOpDetails(true);
    const token = localStorage.getItem("accessToken") || "";
    try {
      const data = await getOrdemProducao(id, token);
      setComposeOp(data);
      setRecipientEmail(data.email_encomenda || "");
      // Fetch client emails
      const emails = await getClientEmails(token, data.cliente);
      setClientEmailList(emails);
    } catch (err) {
      console.error("Erro ao buscar detalhes da OP", err);
    } finally {
      setLoadingOpDetails(false);
    }
  };

  // Fetch maquete PDF when composeOp.maqueta_file_url changes
  useEffect(() => {
    if (!composeOp?.maqueta_file_url) {
      setPdfBlobUrl(null);
      return;
    }
    setLoadingPreview(true);
    (async () => {
      try {
        const resp = await fetch(composeOp.maqueta_file_url);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (err) {
        console.error("Erro ao carregar preview da maquete:", err);
      } finally {
        setLoadingPreview(false);
      }
    })();
    // Cleanup
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [composeOp?.maqueta_file_url]);

  // Auto-collapse on maquete presence
  useEffect(() => {
    if (composeOp?.maqueta_file_url) {
      setEmailCollapsed(true);
    } else {
      setEmailCollapsed(false);
    }
  }, [composeOp?.maqueta_file_url]);

  useEffect(() => {
    async function fetchOrdens() {
      try {
        const allOps = await fetchAllOrdensProducao();
        const filtered = allOps.filter(op => allowedStatuses.includes(op.status));
        setOrdens(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrdens();
  }, []);

  const grouped = useMemo(() => {
    return ordens.reduce<Record<string, any[]>>((acc, op) => {
      const status = op.status || "Sem status";
      if (!acc[status]) acc[status] = [];
      acc[status].push(op);
      return acc;
    }, {});
  }, [ordens]);

  const statuses = Object.keys(grouped);
  // Only show statuses once the user has selected at least one
  const displayStatuses = selectedStatuses.length > 0 ? selectedStatuses : [];

  if (loading) {
    return <div className="p-4">Carregando maquetes…</div>;
  }

  return (
    <>
      <PageMeta title="Maquetes" description="Consultas de Maquetes" />
      <PageBreadcrumb pageTitle="Maquetes" />
      <div className="flex p-4 space-x-6">
        {/* Left: status dropdown + columns */}
        <div className="flex-initial">
          <div className="relative inline-block">
            <button
              type="button"
              className="dropdown-toggle px-4 py-2 border rounded bg-white dark:bg-gray-800"
              onClick={() => setStatusDropdownOpen(open => !open)}
            >
              Status
            </button>
            <Dropdown isOpen={statusDropdownOpen} onClose={() => setStatusDropdownOpen(false)}>
              {statuses.map(status => (
                <DropdownItem
                  key={status}
                  onItemClick={() => {
                    setSelectedStatuses([status]);
                    setStatusDropdownOpen(false);
                  }}
                >
                  {status} ({grouped[status].length})
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
          {/* columns: use displayStatuses */}
          <div className="flex space-x-6 overflow-x-auto mt-4">
            {displayStatuses.map(status => (
              <div key={status} className="flex-shrink-0 w-80">
                <h3 className="text-xl font-semibold mb-2">{status}</h3>
                <div className="space-y-4">
                  <div
                    key={status}
                  >
                    {grouped[status].map(op => (
                      <div
                        key={op.id}
                        onClick={() => handleOpSelect(op.id)}
                        className="cursor-pointer"
                      >
                        <CardOP op={op} highlighted={composeOp?.id === op.id} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Right: email compose panel */}
        <div className="w-1/2">
          {loadingOpDetails ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : composeOp ? (
            <>
              {/* Maquete Card */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-lg font-semibold mb-2">Maquete OP #{composeOp.id}</h3>
                <MaqueteCard
                  previewUrl={pdfBlobUrl}
                  maquetaFileUrl={composeOp.maqueta_file_url}
                  onFileSelect={() => fileInputRef.current?.click()}
                  maqueteFileName={maqueteFile?.name}
                  onConfirm={handleSend}
                />
                {/* Hidden file input for maquete upload */}
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={e => setMaqueteFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
              {/* Email Approval Section */}
              {composeOp.maqueta_file_url && (
                <SendEmailMaquete
                  clientId={composeOp.cliente}
                  ordemId={composeOp.id}
                  onSent={() => handleOpSelect(composeOp.id)}
                />
              )}
            </>
          ) : (
            <p className="text-gray-500">Selecione uma OP à esquerda para compor email.</p>
          )}
        </div>
      </div>
    </>
  );
}
