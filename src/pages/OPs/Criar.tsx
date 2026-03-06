import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import '../../pdfjsConfig';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Document, Page } from "react-pdf";
import Cropper from "react-easy-crop";
import Modal from "../../components/ui/modal/index"; // or your modal component
// @ts-ignore: no declaration file for module '../../serviceapi/api'
import { getEmailAccounts, getEmails, createOrdemProducao, updateOrdemProducao, getTipoSacos, getTamanhos, getTipoImpressao, getCores, getEstadosImpressaoAtivos, getClientLabelTemplates, createClientLabelTemplate } from "../../serviceapi/api";
import { fetchWithAuth } from "../../serviceapi/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ClientsTable, { Client } from "../../components/clients/Clientstable";
import Spinner from "../../components/ui/loaders/Spinner"; // or your theme spinner
import Alert from "../../components/ui/alert/Alert";
import FilterModal from "./FilterModal";
import LabelEditor from "../../components/labels/LabelEditor";

import { formatNumber } from "../Tamanhos/Consultar";
import { testPdfCompatibility, logCompatibilityResult, showCompatibilityAlert } from "../../utils/pdfTest";

// Interface para atributos do tipo de saco
interface AtributoTipoSaco {
  id: number;
  nome: string;
  tipo_dado: string;
  opcoes: string[] | null;
  tipo_saco: number;
}

// Interface para valores dos atributos
interface ValorAtributo {
  atributo_id: number;
  valor: string | number | boolean;
}

const Criar: React.FC = (): React.ReactElement => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use useState to persist editMode and orderToEdit across re-renders
  const [editMode, setEditMode] = useState<boolean>(false);
  const [orderToEdit, setOrderToEdit] = useState<any>(null);
  
  // Initialize editMode and orderToEdit from location.state only once
  useEffect(() => {
    const stateOrderToEdit = location.state as any;
    if (stateOrderToEdit && !editMode) {
      setOrderToEdit(stateOrderToEdit);
      setEditMode(true);
      console.log("🔍 EditMode initialized:", true);
      console.log("📦 OrderToEdit initialized:", stateOrderToEdit);
    }
  }, [location.state, editMode]);
  
  console.log("🔍 EditMode:", editMode);
  console.log("📦 OrderToEdit:", orderToEdit);
  
  // Debug: Log when editMode changes
  useEffect(() => {
    console.log("🔄 EditMode changed to:", editMode);
  }, [editMode]);
  
  useEffect(() => {
    if (!orderToEdit) return;
    
    // Prefill basic scalar fields
    setNomeTrabalho(orderToEdit.nome_trabalho);
    setQuantidade(orderToEdit.quantidade);
    setMargem(orderToEdit.margem || 0);
    setObsOP(orderToEdit.obs || "");
    setEmailEncomenda(orderToEdit.email_encomenda || "");
    setDataSaida(orderToEdit.data_expedicao ? orderToEdit.data_expedicao.split('T')[0] : "");
    setNumeroFaces(orderToEdit.numero_faces || 1);
    
    // Prefill cliente - usando cliente_nome2 como nome
    if (orderToEdit.cliente_nome2) {
      setSelectedClient({
        id: orderToEdit.cliente,
        nome2: orderToEdit.cliente_nome2,
        name: orderToEdit.cliente_nome2,
        phone: ""
      });
    }
    
    // Prefill select fields usando os detalhes
    if (orderToEdit.tipo_saco_detail) {
      setSelectedTipoSaco(orderToEdit.tipo_saco_detail.id);
    }
    
    if (orderToEdit.tamanho_detail) {
      setSelectedGrupo(orderToEdit.tamanho_detail.grupo);
      setSelectedTamanho(orderToEdit.tamanho_detail.id);
    }
    
    if (orderToEdit.tipo_impressao_detail) {
      setSelectedPrintType(orderToEdit.tipo_impressao_detail.id);
    }
    
    // Prefill cor/gramagem
    if (orderToEdit.cor_gramagem_cor && orderToEdit.cor_gramagem_valor) {
      setSelectedGramagem(`${orderToEdit.cor_gramagem_cor}-${orderToEdit.cor_gramagem_valor}`);
    }
    
    // Prefill cordao/asa torcida if present
    if (orderToEdit.cordao_asa_torcida) {
      setCordaoCor(orderToEdit.cordao_asa_torcida.cor);
      setCordaoMaterial(orderToEdit.cordao_asa_torcida.material);
    }
    
    // Prefill cordao/fita if present
    if (orderToEdit.cordao_fita) {
      setCordaoFitaColor(orderToEdit.cordao_fita.cor);
      setCordaoFitaType(orderToEdit.cordao_fita.tipo);
      setCordaoFitaThickness(orderToEdit.cordao_fita.espessura);
      setCordaoFitaLength(orderToEdit.cordao_fita.comprimento);
    }
    
    // Prefill saco plastico if present
    if (orderToEdit.tipo_saco_plastico) {
      setSelectedPlasticBagType(orderToEdit.tipo_saco_plastico);
    }
    
    // Prefill cor asa flexivel if present
    if (orderToEdit.cor_asa_flexivel) {
      setAsaFlexColor(orderToEdit.cor_asa_flexivel);
    }
    
    // Prefill maquete attached + colors + preview snapshot
    if (orderToEdit.maqueta_file_url) {
      setIsMaqueteAttached(true);
      // Extrair nome do arquivo da URL
      const fileName = orderToEdit.maqueta_file_url.split('/').pop() || '';
      setMaqueteFile(new File([], fileName));
    }
    
    if (orderToEdit.maquete_colors) {
      setMaqueteColors(orderToEdit.maquete_colors);
    }
    
    if (orderToEdit.maquete_preview) {
      fetch(orderToEdit.maquete_preview)
        .then(r => r.blob())
        .then(blob => setCroppedImageBlob(blob));
    }
    
    // Prefill email attached if present
    if (orderToEdit.email_anexado) {
      setEmailAttached(true);
      setSelectedEmail(orderToEdit.email_anexado);
    }
  }, [orderToEdit]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Label template selection
  const [labelTemplates, setLabelTemplates] = useState<{ id: number; name: string; is_default: boolean; template_data?: any }[]>([]);
  const [selectedLabelTemplate, setSelectedLabelTemplate] = useState<number | null>(null);
  const [isLabelEditorOpen, setIsLabelEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ id: number; name: string; template_data: any } | null>(null);

  // Tipo de saco
  const [tipoSacos, setTipoSacos] = useState<{ id: number; nome: string }[]>([]);
  const [selectedTipoSaco, setSelectedTipoSaco] = useState<number | null>(null);

  // Atributos do tipo de saco selecionado
  const [atributosTipoSaco, setAtributosTipoSaco] = useState<AtributoTipoSaco[]>([]);
  const [loadingAtributos, setLoadingAtributos] = useState(false);
  const [valoresAtributos, setValoresAtributos] = useState<{ [key: number]: any }>({});

  // Tamanhos
  interface Gramagem {
    cor: string;
    gramagem: number;
    cor_nome: string;
  }
  interface Tamanho {
    id: number;
    tipo_saco: number;
    tipo_saco_nome: string;
    grupo: string;
    largura: string;
    fole: string;
    altura: string;
    gramagens: Gramagem[];
  }
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [selectedTamanho, setSelectedTamanho] = useState<number | null>(null);
  // Grupo de tamanho
  const [selectedGrupo, setSelectedGrupo] = useState<string>("");
  // Cor / Gramagem
  const [selectedGramagem, setSelectedGramagem] = useState<string>("");

  // Tipos de impressão
  const [printTypes, setPrintTypes] = useState<{ id: number; nome: string; descricao: string }[]>([]);
  const [selectedPrintType, setSelectedPrintType] = useState<number | null>(null);

  const [nomeTrabalho, setNomeTrabalho] = useState<string>("");
  const [emailEncomenda, setEmailEncomenda] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [obsOP, setObsOP] = useState<string>("");
  const [cordaoMaterial, setCordaoMaterial] = useState<string>("papel");

  // Cores para cordão
  const [cores, setCores] = useState<{ id: number; nome: string }[]>([]);
  const [cordaoCor, setCordaoCor] = useState<string>("");
  const [cordaoCorCustom, setCordaoCorCustom] = useState<string>("");

  // Cordão/Fita options for tipo 3 and 4
  const [cordaoFitaColor, setCordaoFitaColor] = useState<string>("");
  const [cordaoFitaColorCustom, setCordaoFitaColorCustom] = useState<string>("");
  const [cordaoFitaType, setCordaoFitaType] = useState<'cordao' | 'fita'>("cordao");
  const [cordaoFitaThickness, setCordaoFitaThickness] = useState<number>(5);
  const [cordaoFitaLength, setCordaoFitaLength] = useState<number>(30);
  // Opções de saco plástico para tipo 2
  const [selectedPlasticBagType, setSelectedPlasticBagType] = useState<string>("");
  const [asaFlexColor, setAsaFlexColor] = useState<string>("");
  const [asaFlexColorCustom, setAsaFlexColorCustom] = useState<string>("");
  // Data de saída default (hoje + 14 dias)
  const [dataSaida, setDataSaida] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [numeroFaces, setNumeroFaces] = useState<number>(1);
  const [margem, setMargem] = useState<number>(0);
  
  // Estado para verificar se tamanho está em uso
  const [tamanhoEmUso, setTamanhoEmUso] = useState<{
    isInUse: boolean;
    maquinaNome: string;
    corNome: string;
  }>({ isInUse: false, maquinaNome: "", corNome: "" });
  // Email modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<{ id: string; address: string }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [emails, setEmails] = useState<{ id: string; subject: string; snippet: string }[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState<boolean>(false);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTipoImpressao, setFilterTipoImpressao] = useState<string>("");
  const [filterClient, setFilterClient] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState<"name" | "date" | null>(null);

  // Carrega tipos de saco quando cliente selecionado
  useEffect(() => {
    if (!selectedClient) return;
    async function fetchTipos() {
      const token = localStorage.getItem("accessToken") || "";
      const tipos = await getTipoSacos(token);
      setTipoSacos(tipos);
    }
    fetchTipos();
  }, [selectedClient]);

  // Carrega etiquetas do cliente quando cliente selecionado
  useEffect(() => {
    if (!selectedClient) {
      setLabelTemplates([]);
      setSelectedLabelTemplate(null);
      return;
    }
    async function fetchLabelTemplates() {
      if (!selectedClient) return;
      const token = localStorage.getItem("accessToken") || "";
      try {
        const templates = await getClientLabelTemplates(selectedClient.id, token);
        setLabelTemplates(templates);
        // Selecionar template padrão se existir
        const defaultTemplate = templates.find((t: any) => t.is_default);
        if (defaultTemplate) {
          setSelectedLabelTemplate(defaultTemplate.id);
        }
      } catch (error) {
        console.error('Erro ao carregar etiquetas do cliente:', error);
        setLabelTemplates([]);
      }
    }
    fetchLabelTemplates();
    setEditingTemplate(null);
  }, [selectedClient]);

  // Carrega atributos quando tipo de saco selecionado
  useEffect(() => {
    if (!selectedTipoSaco) {
      setAtributosTipoSaco([]);
      setValoresAtributos({});
      return;
    }
    
    async function fetchAtributos() {
      setLoadingAtributos(true);
      try {
        const res = await fetchWithAuth(`/api/op/atributos-tipo-saco/?tipo_saco=${selectedTipoSaco}`);
        if (!res.ok) throw new Error('Falha ao carregar atributos');
        const data: AtributoTipoSaco[] = await res.json();
        const filtered = data.filter(at => at.tipo_saco === selectedTipoSaco);
        console.log(`Atributos carregados para tipo ${selectedTipoSaco}:`, filtered);
        setAtributosTipoSaco(filtered);
        
        // Inicializa valores vazios para cada atributo
        const valoresIniciais: { [key: number]: any } = {};
        filtered.forEach(at => {
          valoresIniciais[at.id] = '';
        });
        setValoresAtributos(valoresIniciais);
      } catch (err: any) {
        console.error('Erro ao carregar atributos:', err);
        setAtributosTipoSaco([]);
      } finally {
        setLoadingAtributos(false);
      }
    }
    fetchAtributos();
  }, [selectedTipoSaco]);

  // Carrega tamanhos quando tipo de saco selecionado
  useEffect(() => {
    if (!selectedTipoSaco) return;
    async function fetchTams() {
      const token = localStorage.getItem("accessToken") || "";
      const all: Tamanho[] = await getTamanhos(token);
      // Filtra tamanhos cujo tipo_saco corresponda ao tipo selecionado (ID)
      const filtered = all.filter((t: Tamanho) => t.tipo_saco === selectedTipoSaco);
      setTamanhos(filtered);
    }
    fetchTams();
  }, [selectedTipoSaco]);

  // Carrega tipos de impressão no mount
  useEffect(() => {
    async function fetchPrintTypes() {
      const token = localStorage.getItem("accessToken") || "";
      const data = await getTipoImpressao(token);
      // console.log("Tipos de Impressão:", data);
      setPrintTypes(data);
    }
    fetchPrintTypes();
  }, []);

  // Carrega cores no mount
  useEffect(() => {
    async function fetchCores() {
      const token = localStorage.getItem("accessToken") || "";
      const data = await getCores(token);
      setCores(data);
    }
    fetchCores();
  }, []);

  // Função para verificar se um tamanho está em uso
  const checkTamanhoEmUso = async (tamanhoId: number) => {
    console.log('🔍 Verificando se tamanho', tamanhoId, 'está em uso...');
    try {
      const token = localStorage.getItem("accessToken") || "";
      console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
      
      // Usar a função getEstadosImpressaoAtivos que já existe na API
      const estadosAtivos = await getEstadosImpressaoAtivos(token);
      console.log('📊 Estados ativos carregados:', estadosAtivos);
      
      // Verificar se algum estado ativo usa este tamanho
      const tamanhoEmUso = estadosAtivos.find(estado => estado.tamanho === tamanhoId);
      
      if (tamanhoEmUso) {
        console.log('⚠️ Tamanho em uso!', tamanhoEmUso);
        setTamanhoEmUso({
          isInUse: true,
          maquinaNome: tamanhoEmUso.maquina_nome,
          corNome: tamanhoEmUso.cor_nome
        });
      } else {
        console.log('✅ Tamanho livre');
        setTamanhoEmUso({
          isInUse: false,
          maquinaNome: "",
          corNome: ""
        });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar se tamanho está em uso:', error);
      setTamanhoEmUso({
        isInUse: false,
        maquinaNome: "",
        corNome: ""
      });
    }
  };

  // Função para atualizar valor de um atributo
  const handleAtributoChange = (atributoId: number, valor: any) => {
    setValoresAtributos(prev => ({
      ...prev,
      [atributoId]: valor
    }));
  };

  // Função para renderizar campo baseado no tipo de dado
  const renderAtributoField = (atributo: AtributoTipoSaco) => {
    const valor = valoresAtributos[atributo.id] || '';
    
    switch (atributo.tipo_dado) {
      case 'string':
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleAtributoChange(atributo.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder={`Digite ${atributo.nome.toLowerCase()}`}
          />
        );
      
      case 'integer':
        return (
          <input
            type="number"
            value={valor}
            onChange={(e) => handleAtributoChange(atributo.id, parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Digite um número inteiro"
          />
        );
      
      case 'decimal':
        return (
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => handleAtributoChange(atributo.id, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Digite um número decimal"
          />
        );
      
      case 'boolean':
        return (
          <select
            value={valor ? 'true' : 'false'}
            onChange={(e) => handleAtributoChange(atributo.id, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        );
      
      case 'choice':
        return (
          <select
            value={valor}
            onChange={(e) => handleAtributoChange(atributo.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Selecione uma opção</option>
            {atributo.opcoes?.map((opcao, index) => (
              <option key={index} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleAtributoChange(atributo.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder={`Digite ${atributo.nome.toLowerCase()}`}
          />
        );
    }
  };

  useEffect(() => {
    if (selectedTamanho && selectedGramagem) {
      const t = tamanhos.find(t => t.id === selectedTamanho);
      const g = t?.gramagens.find(g => `${g.cor}-${g.gramagem}` === selectedGramagem);
      if (g) setCordaoCor(g.cor_nome);
    } else {
      setCordaoCor("");
      setCordaoCorCustom("");
    }
  }, [selectedTamanho, selectedGramagem]);

  // Opções de grupos a partir dos tamanhos carregados
  const grupoOptions = Array.from(new Set(tamanhos.map(t => t.grupo)));

  useEffect(() => {
    if (!isEmailModalOpen) return;
    (async () => {
      setIsLoadingAccounts(true);
      const token = localStorage.getItem("accessToken") || "";
      const accounts = await getEmailAccounts(token);
      setEmailAccounts(accounts);
      setIsLoadingAccounts(false);
    })();
  }, [isEmailModalOpen]);

  useEffect(() => {
    if (!selectedAccount) return;
    (async () => {
      setIsLoadingEmails(true);
      const token = localStorage.getItem("accessToken") || "";
      const items = await getEmails(selectedAccount, token);
      setEmails(items);
      setIsLoadingEmails(false);
    })();
  }, [selectedAccount]);
  const [emailAttached, setEmailAttached] = useState<boolean>(false);
  const [isMaqueteAttached, setIsMaqueteAttached] = useState<boolean>(false);
  const [maqueteFile, setMaqueteFile] = useState<File | null>(null);

  const [fileToProcess, setFileToProcess] = useState<File | null>(null);
  const [pdfImageUrl, setPdfImageUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [maqueteColors, setMaqueteColors] = useState<string[]>(['']);

  // Função para tratar erros de carregamento do PDF
  const handlePdfLoadError = (file: File) => {
    console.error('PDF load failed, trying alternative method');
    setPdfLoading(false);
    
    // Criar uma imagem placeholder com informações do arquivo
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fundo branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 800, 600);
        
        // Borda
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 780, 580);
        
        // Texto informativo
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ PDF não pôde ser carregado', 400, 200);
        
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(`Arquivo: ${file.name}`, 400, 240);
        ctx.fillText(`Tamanho: ${(file.size / 1024).toFixed(1)} KB`, 400, 260);
        ctx.fillText(`Tipo: ${file.type}`, 400, 280);
        
        // Instruções
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('Para resolver este problema:', 400, 320);
        ctx.fillText('1. Tente usar uma imagem (JPG, PNG) em vez de PDF', 400, 340);
        ctx.fillText('2. Verifique se o arquivo não está corrompido', 400, 360);
        ctx.fillText('3. Tente abrir o PDF em outro programa primeiro', 400, 380);
        
        // Botão visual
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(300, 420, 200, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.fillText('Fechar e tentar novamente', 400, 445);
      }
      
      const dataUrl = canvas.toDataURL("image/jpeg");
      setPdfImageUrl(dataUrl);
      
      // Mostrar alerta informativo
      setTimeout(() => {
        const shouldRetry = window.confirm(
          'O PDF não pôde ser carregado. Isso pode acontecer por:\n\n' +
          '• Navegador não suporta PDF.js adequadamente\n' +
          '• Arquivo PDF corrompido ou protegido\n' +
          '• Problemas de compatibilidade do sistema\n\n' +
          'Recomendamos:\n' +
          '• Usar uma imagem (JPG, PNG) em vez de PDF\n' +
          '• Converter o PDF para imagem primeiro\n' +
          '• Tentar em outro navegador\n\n' +
          'Deseja fechar e tentar com outro arquivo?'
        );
        
        if (shouldRetry) {
          setIsCropModalOpen(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Fallback PDF conversion failed:', error);
      alert('Erro crítico ao processar PDF. Tente usar uma imagem (JPG, PNG) em vez de PDF.');
      setIsCropModalOpen(false);
    }
  };

  // Helper to generate cropped image/blob
  const getCroppedImg = async (file: File, areaPixels: any): Promise<Blob> => {
    // Se for PDF, use a imagem gerada a partir do PDF (pdfImageUrl)
    if (file.type === "application/pdf") {
      if (!pdfImageUrl) throw new Error("PDF image not ready for recorte");
      // Load the off-screen PDF image
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const imgEl = new Image();
        imgEl.onload = () => resolve(imgEl);
        imgEl.onerror = (err) => reject(err);
        imgEl.src = pdfImageUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = areaPixels.width;
      canvas.height = areaPixels.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        image,
        areaPixels.x,
        areaPixels.y,
        areaPixels.width,
        areaPixels.height,
        0,
        0,
        areaPixels.width,
        areaPixels.height
      );
      return new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg"));
    }
    // Para imagens, mantém a lógica original
    const image = await new Promise<HTMLImageElement>((res) => {
      const imgEl = new Image();
      imgEl.onload = () => res(imgEl);
      imgEl.src = URL.createObjectURL(file);
    });
    const canvas = document.createElement("canvas");
    canvas.width = areaPixels.width;
    canvas.height = areaPixels.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      image,
      areaPixels.x,
      areaPixels.y,
      areaPixels.width,
      areaPixels.height,
      0,
      0,
      areaPixels.width,
      areaPixels.height
    );
    return new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg"));
  };

  // When file input changes
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    
    // Verificar se é um PDF e testar compatibilidade
    if (file.type === "application/pdf") {
      try {
        const compatibilityResult = await testPdfCompatibility();
        logCompatibilityResult(compatibilityResult);
        
        if (!compatibilityResult.isCompatible) {
          const shouldContinue = window.confirm(
            'Detectamos problemas de compatibilidade com PDFs no seu navegador:\n\n' +
            compatibilityResult.issues.join('\n') + '\n\n' +
            'Recomendamos usar uma imagem (JPG, PNG) em vez de PDF.\n' +
            'Deseja continuar mesmo assim?'
          );
          
          if (!shouldContinue) {
            e.target.value = ''; // Limpar o input
            return;
          }
        }
      } catch (error) {
        console.warn('Erro ao testar compatibilidade PDF:', error);
        // Continuar mesmo com erro no teste
      }
    }
    
    // Reset previous crop and preview
    setPdfImageUrl(null);
    setPdfLoading(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedImageBlob(null);
    // Process new file
    setFileToProcess(file);
    setIsCropModalOpen(true);
  };

  // MaqueteCard component (refactored as per instructions)
  const MaqueteCard: React.FC<{
    previewUrl: string | null;
    maqueteFileName: string | null;
    sacoLiso: boolean;
    setSacoLiso: (v: boolean) => void;
    colors: string[];
    setColors: (v: string[]) => void;
    onFileSelect: () => void;
    onConfirm: (colors: string[], sacoLiso: boolean) => void;
  }> = ({
    previewUrl,
    maqueteFileName,
    sacoLiso,
    setSacoLiso,
    colors,
    setColors,
    onFileSelect,
    onConfirm,
  }) => {
    return (
      <div>
        <span className="block font-medium mb-2">Maquete</span>
        {!previewUrl ? (
          <>
            <p className="text-gray-500 mb-2">Ainda nenhuma maquete adicionada</p>
            <button
              type="button"
              onClick={onFileSelect}
              className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
            >
              Carregar Maquete
            </button>
            {maqueteFileName && (
              <span className="ml-2 text-sm text-gray-600">{maqueteFileName}</span>
            )}
          </>
        ) : (
          <>
            <div className="w-full h-48 mb-4 overflow-hidden rounded border">
              <img
                src={previewUrl}
                alt="Preview Maquete"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={sacoLiso}
                  onChange={e => setSacoLiso(e.target.checked)}
                  className="form-checkbox"
                />
                <span className="ml-2">Saco Liso</span>
              </label>
            </div>
            {colors.map((color, index) => (
              <input
                key={index}
                type="text"
                placeholder="Cor de impressão"
                value={color}
                onChange={e => {
                  const newColors = [...colors];
                  newColors[index] = e.target.value;
                  setColors(newColors);
                }}
                className="w-full border rounded p-2 mb-2"
              />
            ))}
            <button
              type="button"
              onClick={() => setColors([...colors, ''])}
              className="mb-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Adicionar cor
            </button>
            <button
              type="button"
              onClick={() => onConfirm(colors, sacoLiso)}
              disabled={!(sacoLiso || colors.some(c => c.trim() !== ''))}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Confirmar Maquete
            </button>
          </>
        )}
      </div>
    );
  };

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [alertConfig, setAlertConfig] = useState<{
    variant: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertConfig(null);
    // Extrai cor e valor de gramagem selecionados
    const [corSelecionada, valorGram] = selectedGramagem.split('-');
    const gramagemNumber = valorGram ? parseFloat(valorGram) : undefined;
    // Preparar valores dos atributos para envio
    const valoresAtributosParaEnvio = Object.entries(valoresAtributos)
      .filter(([_, valor]) => valor !== '' && valor !== null && valor !== undefined)
      .map(([atributoId, valor]) => ({
        atributo: parseInt(atributoId),
        valor: String(valor)
      }));

    const payload = {
      cliente: selectedClient?.id,
      tipo_saco: selectedTipoSaco,
      grupo: selectedGrupo,
      tamanho: selectedTamanho,
      print_type: selectedPrintType,
      cor_gramagem_cor: corSelecionada,
      cor_gramagem_valor: gramagemNumber,
      nome_trabalho: nomeTrabalho,
      numero_faces: numeroFaces,
      email_encomenda: emailEncomenda,
      quantidade,
      margem,
      obs: obsOP,
      data_saida: dataSaida,
      cordao_asa_torcida: selectedTipoSaco === /* asa torcida ID */ 5 ? {
        cor: cordaoCor === "outro" ? cordaoCorCustom : cordaoCor,
        material: cordaoMaterial
      } : undefined,
      // Cordão/Fita para tipos 3 e 4
      cordao_fita: (selectedTipoSaco === 3 || selectedTipoSaco === 4) ? {
        cor: cordaoFitaColor === 'outro' ? cordaoFitaColorCustom : cordaoFitaColor,
        tipo: cordaoFitaType,
        espessura: cordaoFitaThickness,
        comprimento: cordaoFitaLength
      } : undefined,
      // Saco plástico para tipo 2
      tipo_saco_plastico: selectedTipoSaco === 2 ? selectedPlasticBagType : undefined,
      cor_asa_flexivel: selectedTipoSaco === 2 && selectedPlasticBagType === 'asa flexivel' ?
        (asaFlexColor === 'outro' ? asaFlexColorCustom : asaFlexColor)
        : undefined,
      maquete_attached: isMaqueteAttached || Boolean(croppedImageBlob),
      maquete_file_name: maqueteFile?.name,
      attached_email_id: emailAttached ? selectedEmail : undefined,
      // Valores dos atributos customizados
      atributos_valores: valoresAtributosParaEnvio,
      // Template de etiqueta do cliente
      label_template: selectedLabelTemplate || undefined,
    };
    try {
      const token = localStorage.getItem("accessToken") || "";
      let result;
      
      console.log("🚀 Submitting form - EditMode:", editMode);
      console.log("📋 OrderToEdit ID:", orderToEdit?.id);
      
      if (editMode) {
        if (fileToProcess || croppedImageBlob) {
          const form = new FormData();
          form.append('cliente', String(payload.cliente));
          form.append('tipo_saco', String(payload.tipo_saco));
          form.append('grupo', String(payload.grupo));
          form.append('tamanho', String(payload.tamanho));
          form.append('numero_faces', String(payload.numero_faces));
          form.append('print_type', String(payload.print_type));
          form.append('cor_gramagem_cor', String(payload.cor_gramagem_cor));
          if (payload.cor_gramagem_valor != null) {
            form.append('cor_gramagem_valor', String(payload.cor_gramagem_valor));
          }
          form.append('nome_trabalho', payload.nome_trabalho);
          form.append('quantidade', String(payload.quantidade));
          form.append('margem', String(payload.margem));
          form.append('obs', payload.obs);
          form.append('email_encomenda', payload.email_encomenda);
          form.append('data_saida', payload.data_saida);
          if (payload.cordao_asa_torcida) {
            form.append('cordao_asa_torcida', JSON.stringify(payload.cordao_asa_torcida));
          }
          // New fields for cordao_fita and saco plastico
          if (payload.cordao_fita) {
            form.append('cordao_fita', JSON.stringify(payload.cordao_fita));
          }
          if (payload.tipo_saco_plastico) {
            form.append('tipo_saco_plastico', payload.tipo_saco_plastico);
          }
          if (payload.cor_asa_flexivel) {
            form.append('cor_asa_flexivel', payload.cor_asa_flexivel);
          }
          if (payload.attached_email_id) {
            form.append('attached_email_id', String(payload.attached_email_id));
          }
          // Adicionar valores dos atributos ao FormData
          if (payload.atributos_valores && payload.atributos_valores.length > 0) {
            form.append('atributos_valores', JSON.stringify(payload.atributos_valores));
          }
          // Adicionar label_template ao FormData
          if (payload.label_template) {
            form.append('label_template', String(payload.label_template));
          }
          form.append('maquete_attached', String(payload.maquete_attached));
          form.append('maquete_file_name', payload.maquete_file_name || '');
          // If original PDF file, append it
          if (fileToProcess && fileToProcess.type === "application/pdf") {
            form.append('maquete', fileToProcess);
          }
          // Also append cropped image
          if (croppedImageBlob) {
            form.append("maquete_crop", croppedImageBlob, "crop.jpg");
          }
          // Append selected maquete colors to payload
          maqueteColors.forEach(color => form.append('maquete_colors[]', color));
          result = await updateOrdemProducao(orderToEdit.id, form, token);
        } else {
          result = await updateOrdemProducao(orderToEdit.id, {
            ...payload,
            cordao_fita: payload.cordao_fita,
            tipo_saco_plastico: payload.tipo_saco_plastico,
            cor_asa_flexivel: payload.cor_asa_flexivel,
            atributos_valores: payload.atributos_valores,
            maquete_crop: croppedImageBlob
              ? new File(
                  [croppedImageBlob as Blob],
                  "crop.jpg",
                  { type: (croppedImageBlob as Blob).type }
                )
              : undefined,
          }, token);
        }
        setAlertConfig({
          variant: "success",
          title: "Sucesso",
          message: "Ordem atualizada com sucesso!",
        });
        // Scroll para o topo da página
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/ops/gerir');
        return;
      } else {
        if (fileToProcess || croppedImageBlob) {
          const form = new FormData();
          form.append('cliente', String(payload.cliente));
          form.append('tipo_saco', String(payload.tipo_saco));
          form.append('grupo', String(payload.grupo));
          form.append('tamanho', String(payload.tamanho));
          form.append('numero_faces', String(payload.numero_faces));
          form.append('print_type', String(payload.print_type));
          form.append('cor_gramagem_cor', String(payload.cor_gramagem_cor));
          if (payload.cor_gramagem_valor != null) {
            form.append('cor_gramagem_valor', String(payload.cor_gramagem_valor));
          }
          form.append('nome_trabalho', payload.nome_trabalho);
          form.append('quantidade', String(payload.quantidade));
          form.append('margem', String(payload.margem));
          form.append('obs', payload.obs);
          form.append('email_encomenda', payload.email_encomenda);
          form.append('data_saida', payload.data_saida);
          if (payload.cordao_asa_torcida) {
            form.append('cordao_asa_torcida', JSON.stringify(payload.cordao_asa_torcida));
          }
          // New fields for cordao_fita and saco plastico
          if (payload.cordao_fita) {
            form.append('cordao_fita', JSON.stringify(payload.cordao_fita));
          }
          if (payload.tipo_saco_plastico) {
            form.append('tipo_saco_plastico', payload.tipo_saco_plastico);
          }
          if (payload.cor_asa_flexivel) {
            form.append('cor_asa_flexivel', payload.cor_asa_flexivel);
          }
          if (payload.attached_email_id) {
            form.append('attached_email_id', String(payload.attached_email_id));
          }
          // Adicionar valores dos atributos ao FormData
          if (payload.atributos_valores && payload.atributos_valores.length > 0) {
            form.append('atributos_valores', JSON.stringify(payload.atributos_valores));
          }
          // Adicionar label_template ao FormData
          if (payload.label_template) {
            form.append('label_template', String(payload.label_template));
          }
          form.append('maquete_attached', String(payload.maquete_attached));
          form.append('maquete_file_name', payload.maquete_file_name || '');
          // If original PDF file, append it
          if (fileToProcess && fileToProcess.type === "application/pdf") {
            form.append('maquete', fileToProcess);
          }
          // Also append cropped image
          if (croppedImageBlob) {
            form.append("maquete_crop", croppedImageBlob, "crop.jpg");
          }
          // Append selected maquete colors to payload
          maqueteColors.forEach(color => form.append('maquete_colors[]', color));
          result = await createOrdemProducao(form, token);
        } else {
          result = await createOrdemProducao({
            ...payload,
            cordao_fita: payload.cordao_fita,
            tipo_saco_plastico: payload.tipo_saco_plastico,
            cor_asa_flexivel: payload.cor_asa_flexivel,
            atributos_valores: payload.atributos_valores,
            maquete_crop: croppedImageBlob
              ? new File(
                  [croppedImageBlob as Blob],
                  "crop.jpg",
                  { type: (croppedImageBlob as Blob).type }
                )
              : undefined,
          }, token);
        }
        setAlertConfig({
          variant: "success",
          title: "Sucesso",
          message: "Ordem criada com sucesso!",
        });
        // Scroll para o topo da página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Reset form fields
      setSelectedClient(null);
      setSelectedTipoSaco(null);
      setSelectedGrupo("");
      setSelectedTamanho(null);
      setSelectedGramagem("");
      setSelectedPrintType(null);
      setNomeTrabalho("");
      setEmailEncomenda("");
      setQuantidade(1);
      setMargem(0);
      setObsOP("");
      setCordaoCor("");
      setCordaoCorCustom("");
      setEmailAttached(false);
      // Reset atributos
      setAtributosTipoSaco([]);
      setValoresAtributos({});
      // Reset dataSaida to default (+14 days)
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setDataSaida(d.toISOString().split("T")[0]);
    } catch (error) {
      setAlertConfig({
        variant: "error",
        title: "Erro",
        message: "Falha ao criar ordem.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  // Formata número com separador de milhar
  const formatQuantidade = (value: number) => {
    return new Intl.NumberFormat("pt-PT").format(value);
  };

  // Estado visível do input (string formatada)
  const quantidadeFormatted = formatQuantidade(quantidade);

  // Handler para input de quantidade com parsing seguro
  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/\s/g, "");
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      setQuantidade(parsed);
    } else if (e.target.value === "") {
      setQuantidade(0);
    }
  };

  return (
    <>
      <PageMeta
        title="Plasticos Dão Criar OPs"
        description="Pagina dedicada para criar ops"
      />
      <PageBreadcrumb pageTitle="Criar OPs" />
      {alertConfig && (
        <Alert variant={alertConfig.variant} title={alertConfig.title} message={alertConfig.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Cliente: {selectedClient ? selectedClient.name : ""}
        </h3>
        <div className="space-y-6 relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(open => !open)}
            className="w-full text-left px-4 py-2 border rounded flex justify-between items-center"
          >
            {selectedClient ? selectedClient.name : "Selecione cliente"}
            <span>{dropdownOpen ? "▲" : "▼"}</span>
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border rounded shadow max-h-60 overflow-auto">
              <ClientsTable
                onSelect={client => {
                  setSelectedClient(client);
                  setDropdownOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
      {selectedClient && (
        <>
          <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 mt-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
              Etiqueta do Cliente:
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <select
                value={selectedLabelTemplate ?? ""}
                onChange={e => setSelectedLabelTemplate(e.target.value ? Number(e.target.value) : null)}
                className="border rounded px-3 py-2 flex-1"
              >
                <option value="">Etiquetas Normais</option>
                {labelTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.is_default ? "(Padrão)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(null);
                  setIsLabelEditorOpen(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Criar Nova Etiqueta
              </button>
            </div>
            {selectedLabelTemplate && (() => {
              const selectedTemplate = labelTemplates.find(t => t.id === selectedLabelTemplate);
              if (!selectedTemplate) return null;
              
              return (
                <div className="mt-3 p-3 bg-gray-50 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{selectedTemplate.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const template = labelTemplates.find(t => t.id === selectedLabelTemplate);
                        if (template) {
                          setEditingTemplate({
                            id: template.id,
                            name: template.name,
                            template_data: template.template_data || {},
                          });
                          setIsLabelEditorOpen(true);
                        }
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    Largura: {selectedTemplate.template_data?.page?.width_mm || 100}mm × 
                    Altura: {selectedTemplate.template_data?.page?.height_mm || 70}mm
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 mt-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
              Tipo de Saco:
            </h3>
            <select
              value={selectedTipoSaco ?? ""}
              onChange={e => setSelectedTipoSaco(Number(e.target.value))}
              className="border rounded px-3 py-2 w-40"
            >
              <option value="">Selecione tipo de saco</option>
              {tipoSacos.map(ts => (
                <option key={ts.id} value={ts.id}>{ts.nome}</option>
              ))}
            </select>
          </div>
        </>
      )}
      {selectedTipoSaco && (
        <>
          {/* Seção de Atributos do Tipo de Saco */}
          {atributosTipoSaco.length > 0 && (
            <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 mt-6">
              <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                Características do Tipo de Saco
              </h3>
              {loadingAtributos ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {atributosTipoSaco.map((atributo) => (
                    <div key={atributo.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {atributo.nome}
                      </label>
                      {renderAtributoField(atributo)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 mt-6">
            <h3 className="mb-5 text-lg font-semibold">Detalhes do Tamanho</h3>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Grupo */}
            <div>
              <label className="block mb-1">Grupo</label>
              <select
                value={selectedGrupo}
                onChange={e => {
                  setSelectedGrupo(e.target.value);
                  setSelectedTamanho(null);
                  setSelectedGramagem("");
                  setTamanhoEmUso({ isInUse: false, maquinaNome: "", corNome: "" });
                }}
                className="border rounded px-3 py-2 w-40"
              >
                <option value="">Selecione grupo</option>
                {grupoOptions.map(gr => (
                  <option key={gr} value={gr}>{gr}</option>
                ))}
              </select>
            </div>
            {/* Dimensão */}
            <div>
              <label className="block mb-1">Dimensão</label>
              <select
                value={selectedTamanho ?? ""}
                onChange={e => {
                  const tamanhoId = Number(e.target.value);
                  console.log('🎯 Tamanho selecionado:', tamanhoId);
                  setSelectedTamanho(tamanhoId);
                  setSelectedGramagem("");
                  // Verificar se o tamanho está em uso
                  if (tamanhoId) {
                    checkTamanhoEmUso(tamanhoId);
                  } else {
                    console.log('🔄 Limpando aviso de tamanho em uso');
                    setTamanhoEmUso({ isInUse: false, maquinaNome: "", corNome: "" });
                  }
                }}
                className="border rounded px-3 py-2 w-40"
              >
                <option value="">Selecione dimensão</option>
                {tamanhos
                  .filter(t => t.grupo === selectedGrupo)
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {`${formatNumber(t.largura)}×${formatNumber(t.fole)}×${formatNumber(t.altura)}`}
                    </option>
                  ))}
              </select>
            </div>
            {/* Aviso se tamanho está em uso */}
            {tamanhoEmUso.isInUse && (
              <div className="col-span-full">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Tamanho em uso
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Este tamanho está atualmente sendo impresso na <strong>{tamanhoEmUso.maquinaNome}</strong> na cor <strong>{tamanhoEmUso.corNome}</strong>.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Cor / Gramagem */}
            <div>
              <label className="block mb-1">Cor / Gramagem</label>
              <select
                value={selectedGramagem}
                onChange={e => setSelectedGramagem(e.target.value)}
                className="border rounded px-3 py-2 w-40"
              >
                <option value="">Selecione cor e gramagem</option>
                {tamanhos
                  .find(t => t.id === selectedTamanho)
                  ?.gramagens.map((g, idx) => (
                    <option key={idx} value={`${g.cor}-${g.gramagem}`}>
                      {`${g.cor_nome} ${formatNumber(g.gramagem)}g/m²`}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
        </>
      )}
      {selectedTamanho && (
        <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 mt-6">
          <h3 className="mb-5 text-lg font-semibold">Tipo de Impressão:</h3>
          <select
            value={selectedPrintType ?? ""}
            onChange={e => setSelectedPrintType(Number(e.target.value))}
            className="border rounded px-3 py-2 w-40"
          >
            <option value="">Selecione tipo de impressão</option>
            {printTypes.map(pt => (
              <option key={pt.id} value={pt.id}>{pt.nome}</option>
            ))}
          </select>
        </div>
      )}
      {selectedPrintType !== null && (
        <div className="relative rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 mt-6">
          <h3 className="mb-2 font-semibold">Nº de Faces</h3>
          <select
            value={numeroFaces}
            onChange={e => setNumeroFaces(Number(e.target.value))}
            className="border rounded px-3 py-2 w-40"
          >
            <option value={1}>1 face</option>
            <option value={2}>2 faces</option>
            <option value={4}>4 faces</option>
          </select>
        </div>
      )}
      {/* Anexar Maquete */}
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 mt-6">
        <div className="flex items-center space-x-3 mb-4">
          <input
            id="attachMaquete"
            type="checkbox"
            checked={isMaqueteAttached}
            onChange={e => setIsMaqueteAttached(e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="attachMaquete" className="text-lg font-semibold text-gray-800">
            Anexar Maquete e Definir Cores
          </label>
        </div>
        {isMaqueteAttached && (
          <div className="mt-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                  </p>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
        {croppedImageBlob && (
          <>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{maqueteFile?.name}</p>
                  <p className="text-xs text-gray-500">Maquete carregada com sucesso</p>
                </div>
              </div>
              <div className="w-32 h-32 overflow-hidden rounded-lg border-2 border-gray-200 bg-white">
                <img
                  src={URL.createObjectURL(croppedImageBlob)}
                  alt="Preview Maquete"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Cores de Impressão</h4>
              <div className="space-y-3">
                {maqueteColors.map((color, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Ex: Preto, Azul, Vermelho..."
                        value={color}
                        onChange={e => {
                          const newColors = [...maqueteColors];
                          newColors[index] = e.target.value;
                          setMaqueteColors(newColors);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      {color && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-gradient-to-r from-gray-400 to-gray-600"></div>
                        </div>
                      )}
                    </div>
                    {maqueteColors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newColors = maqueteColors.filter((_, i) => i !== index);
                          setMaqueteColors(newColors);
                        }}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover cor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setMaqueteColors([...maqueteColors, ''])}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-dashed border-blue-300 hover:border-blue-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm font-medium">Adicionar Cor</span>
                </button>
              </div>
              {maqueteColors.length > 0 && maqueteColors.some(c => c.trim()) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Cores selecionadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {maqueteColors.filter(c => c.trim()).map((color, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Informações do Pedido */}
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 mt-6">
        <h3 className="mb-5 text-lg font-semibold">Informações do Pedido</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Nome do Trabalho */}
          <div>
            <label className="block mb-1">Nome do Trabalho</label>
            <input
              type="text"
              value={nomeTrabalho}
              onChange={e => setNomeTrabalho(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {/* Quantidade https://plastic.floow.pt/*/}
          <div>
            <label className="block mb-1">Quantidade</label>
            <input
              type="text"
              inputMode="numeric"
              value={quantidadeFormatted}
              onChange={handleQuantidadeChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {/* Margem */}
          <div>
            <label className="block mb-1">Margem (%)</label>
            <select
              value={margem}
              onChange={e => setMargem(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={10}>10%</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
            </select>
          </div>
        </div>
        {selectedTipoSaco === 5 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="mb-2 font-medium">Cordão Asa Torcida</h4>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block mb-1">Cor do Cordão</label>
                <select
                  value={cordaoCor || ""}
                  onChange={e => setCordaoCor(e.target.value)}
                  className="border rounded px-3 py-2 w-40"
                >
                  <option value="">Selecione cor do cordão</option>
                  {cores.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                  <option value="outro">Outro</option>
                </select>
                {cordaoCor === "outro" && (
                  <input
                    type="text"
                    placeholder="Outra cor"
                    value={cordaoCorCustom}
                    onChange={e => setCordaoCorCustom(e.target.value)}
                    className="mt-2 w-full border rounded px-3 py-2"
                  />
                )}
              </div>
              <div>
                <label className="block mb-1">Material</label>
                <select
                  value={cordaoMaterial}
                  onChange={e => setCordaoMaterial(e.target.value)}
                  className="border rounded px-3 py-2 w-40"
                >
                  <option value="papel">Papel</option>
                  <option value="algodao">Algodão</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {(selectedTipoSaco === 3 || selectedTipoSaco === 4) && (
          <div className="mt-4 border-t pt-4">
            <h4 className="mb-2 font-medium">Cordão ou Fita</h4>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block mb-1">Cor</label>
                <select
                  value={cordaoFitaColor}
                  onChange={e => setCordaoFitaColor(e.target.value)}
                  className="border rounded px-3 py-2 w-40"
                >
                  <option value="">Selecione cor</option>
                  {cores.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                  <option value="outro">Outro</option>
                </select>
                {cordaoFitaColor === 'outro' && (
                  <input
                    type="text"
                    placeholder="Outra cor"
                    value={cordaoFitaColorCustom}
                    onChange={e => setCordaoFitaColorCustom(e.target.value)}
                    className="mt-2 w-full border rounded px-3 py-2"
                  />
                )}
              </div>
              <div>
                <label className="block mb-1">Tipo</label>
                <select
                  value={cordaoFitaType}
                  onChange={e => setCordaoFitaType(e.target.value as 'cordao' | 'fita')}
                  className="border rounded px-3 py-2 w-40"
                >
                  <option value="cordao">Cordão</option>
                  <option value="fita">Fita</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Espessura</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    value={cordaoFitaThickness}
                    onChange={e => setCordaoFitaThickness(Number(e.target.value))}
                    className="border rounded px-3 py-2 w-20"
                  />
                  <span className="ml-2">mm</span>
                </div>
              </div>
              <div>
                <label className="block mb-1">Comprimento</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    value={cordaoFitaLength}
                    onChange={e => setCordaoFitaLength(Number(e.target.value))}
                    className="border rounded px-3 py-2 w-20"
                  />
                  <span className="ml-2">mm</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedTipoSaco === 2 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="mb-2 font-medium">Tipo de Saco Plástico</h4>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block mb-1">Tipo</label>
                <select
                  value={selectedPlasticBagType}
                  onChange={e => setSelectedPlasticBagType(e.target.value)}
                  className="border rounded px-3 py-2 w-40"
                >
                  <option value="">Selecione tipo de saco plástico</option>
                  <option value="reforço">Reforço</option>
                  <option value="alça">Alça</option>
                  <option value="asa flexivel">Asa Flexível</option>
                  <option value="corte de feijão">Corte de Feijão</option>
                  <option value="boca aberta">Boca Aberta</option>
                </select>
              </div>
              {selectedPlasticBagType === 'asa flexivel' && (
                <div>
                  <label className="block mb-1">Cor da Asa Flexível</label>
                  <select
                    value={asaFlexColor}
                    onChange={e => setAsaFlexColor(e.target.value)}
                    className="border rounded px-3 py-2 w-40"
                  >
                    <option value="">Selecione cor</option>
                    {cores.map(c => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                    <option value="outro">Outro</option>
                  </select>
                  {asaFlexColor === 'outro' && (
                    <input
                      type="text"
                      placeholder="Outra cor"
                      value={asaFlexColorCustom}
                      onChange={e => setAsaFlexColorCustom(e.target.value)}
                      className="mt-2 w-full border rounded px-3 py-2"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Data de Saída */}
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 mt-6">
        <h3 className="mb-2 font-semibold">Data de Saída</h3>
        <input
          type="date"
          value={dataSaida}
          onChange={e => setDataSaida(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      {isCropModalOpen && fileToProcess && (
        <Modal
          isOpen={true}
          onClose={() => setIsCropModalOpen(false)}
          className="max-w-4xl w-full"
        >
          <div className="relative h-96 w-full">
          {fileToProcess.type === "application/pdf" ? (
            pdfImageUrl ? (
              <>
                <Cropper
                  key={fileToProcess.name}
                  image={pdfImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={4 / 3}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
              </>
            ) : (
              <div className="flex flex-col justify-center items-center h-full w-full">
                <Spinner />
                <p className="mt-2 text-sm text-gray-600">Carregando PDF...</p>
                <Document
                  file={fileToProcess}
                  onLoadSuccess={() => { 
                    setPdfLoading(false); 
                    console.log('PDF loaded successfully');
                  }}
                  onLoadError={(error) => { 
                    setPdfLoading(false); 
                    console.error('PDF load error:', error);
                    // Tentar fallback para renderização alternativa
                    handlePdfLoadError(fileToProcess);
                  }}
                  loading={<div className="text-center"><Spinner /></div>}
                  error={<div className="text-center text-red-600">Erro ao carregar PDF</div>}
                >
                  <Page
                    pageNumber={1}
                    width={800}
                    onRenderSuccess={() => {
                      console.log('PDF page rendered successfully');
                      setTimeout(() => {
                        const canvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement | null;
                        if (canvas) {
                          try {
                            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                            setPdfImageUrl(dataUrl);
                            console.log('PDF converted to image successfully');
                          } catch (error) {
                            console.error('Error converting PDF to image:', error);
                            handlePdfLoadError(fileToProcess);
                          }
                        } else {
                          console.warn('Canvas not found, retrying...');
                          setTimeout(() => {
                            const canvasRetry = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement | null;
                            if (canvasRetry) {
                              const dataUrl = canvasRetry.toDataURL("image/jpeg", 0.8);
                              setPdfImageUrl(dataUrl);
                            }
                          }, 1000);
                        }
                      }, 500);
                    }}
                    onRenderError={(error) => {
                      console.error('PDF render error:', error);
                      handlePdfLoadError(fileToProcess);
                    }}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={<div className="text-center"><Spinner /></div>}
                    error={<div className="text-center text-red-600">Erro ao renderizar página</div>}
                  />
                </Document>
              </div>
            )
          ) : (
            <Cropper
              key={fileToProcess.name}
              image={URL.createObjectURL(fileToProcess)}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          )}
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCroppedAreaPixels(null);
              }}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Limpar
            </button>
            <button
              onClick={async (e) => {
                e.preventDefault(); // impede o submit do form principal
                e.stopPropagation(); // impede bubbling para elementos acima
                if (!croppedAreaPixels) return;
                const blob = await getCroppedImg(fileToProcess, croppedAreaPixels);
                setCroppedImageBlob(blob);
                setIsCropModalOpen(false);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Confirmar Recorte
            </button>
          </div>
        </Modal>
      )}
      {/* Observações */}
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 mt-6">
        <h3 className="mb-2 font-semibold">Observações</h3>
        <textarea
          value={obsOP}
          onChange={e => setObsOP(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
        <button
           type="button"
           onClick={() => setIsEmailModalOpen(true)}
           className="mt-2 text-blue-600 hover:underline"
         >
           Anexar Email
         </button>
       </div>
      {emailAttached && (
        <div className="flex items-center space-x-2 mt-2">
          <input
            id="emailAttached"
            type="checkbox"
            checked
            disabled
            className="h-4 w-4 text-blue-600"
          />
          <label htmlFor="emailAttached" className="text-sm">
            Email anexado
          </label>
        </div>
      )}
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          className={`bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={!selectedClient || !selectedTipoSaco || !selectedTamanho || !selectedPrintType || isSubmitting}
        >
          {isSubmitting
            ? "A processar..."
            : editMode
            ? "Atualizar OP"
            : "Criar OP"}
        </button>
      </div>
     </form>
    {/* Modal for Anexar Email */}
    <Modal
      isOpen={isEmailModalOpen}
      onClose={() => setIsEmailModalOpen(false)}
      className="max-w-4xl w-full"
    >
      <div className="flex h-96">
        {/* Accounts list */}
        <div className="w-1/3 border-r dark:border-gray-700 relative">
          {isLoadingAccounts ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : (
            emailAccounts.map(acc => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccount(acc.id)}
                className={`p-2 cursor-pointer ${selectedAccount === acc.id ? "bg-gray-100 dark:bg-gray-800" : ""}`}
              >
                {acc.address}
              </div>
            ))
          )}
        </div>
        {/* Emails list */}
        <div className="w-2/3 overflow-auto p-4 relative">
          {isLoadingEmails ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : (
            emails.map(mail => (
              <div
                key={mail.id}
                onClick={() => {
                  setSelectedEmail(mail.id);
                  setObsOP(prev => prev + `\n[Email: ${mail.subject}]`);
                  setEmailAttached(true);
                  setIsEmailModalOpen(false);
                }}
                className="mb-4 border-b pb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="font-medium text-gray-800 dark:text-gray-200">{mail.subject}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{mail.snippet}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>

    {/* FilterModal */}
    <FilterModal
      isOpen={isFilterModalOpen}
      onClose={() => setIsFilterModalOpen(false)}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      filterTipoImpressao={filterTipoImpressao}
      setFilterTipoImpressao={setFilterTipoImpressao}
      filterClient={filterClient}
      setFilterClient={setFilterClient}
      statusOptions={[
        "Pendente",
        "Em Produção",
        "Finalizado",
        "Cancelado",
        "Aguardando Aprovação",
        "Maquete Aprovada",
        "Em Armazem"
      ]}
    />
    
    {/* Label Editor Modal */}
    {selectedClient && (
      <LabelEditor
        isOpen={isLabelEditorOpen}
        onClose={() => {
          setIsLabelEditorOpen(false);
          setEditingTemplate(null);
        }}
        clientId={selectedClient.id}
        existingTemplate={editingTemplate}
        onSave={() => {
          // Reload templates
          const token = localStorage.getItem("accessToken") || "";
          getClientLabelTemplates(selectedClient.id, token).then(templates => {
            setLabelTemplates(templates);
            // Maintain selection if editing
            if (editingTemplate) {
              setSelectedLabelTemplate(editingTemplate.id);
            }
            setEditingTemplate(null);
          });
        }}
      />
    )}
    </>
  );
};

export default Criar;
