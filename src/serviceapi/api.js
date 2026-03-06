// Preserve the native fetch before overriding it
const originalFetch = globalThis.fetch;

// ----- Perfil do Empregado -----

/**
 * Obtém os dados de perfil do empregado autenticado.
 * @returns {Promise<Object>} Dados do perfil.
 */
export async function getProfile() {
  const response = await fetchWithAuth(`${API_BASE}/profile/`, { method: "GET" });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao obter perfil do empregado");
  }
  return response.json();
}

/**
 * Atualiza os dados de perfil do empregado autenticado.
 * @param {Object|FormData} data - Campos a atualizar (e.g., nome_completo, estado_civil, contacto, email, data_nascimento) ou FormData para upload de foto.
 * @returns {Promise<Object>} Perfil atualizado.
 */
export async function updateProfile(data) {
  const isFormData = data instanceof FormData;
  
  console.log("🔄 updateProfile - isFormData:", isFormData);
  console.log("🔄 updateProfile - data:", data);
  
  // Para FormData, não definir Content-Type - deixar o navegador definir
  const options = {
    method: "PATCH",
    body: isFormData ? data : JSON.stringify(data),
  };
  
  // Se for FormData, não adicionar headers para não interferir com o Content-Type automático
  if (!isFormData) {
    options.headers = {
      "Content-Type": "application/json"
    };
  } else {
    // Para FormData, adicionar apenas o Authorization header
    options.headers = {
      "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
    };
  }
  
  console.log("🔄 updateProfile - options:", options);
  
  try {
    console.log("🔄 updateProfile - chamando XMLHttpRequest...");
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.onload = function() {
        console.log("🔄 updateProfile - response status:", xhr.status);
        console.log("🔄 updateProfile - response ok:", xhr.status >= 200 && xhr.status < 300);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            console.log("🔄 updateProfile - parsing JSON...");
            const result = JSON.parse(xhr.responseText);
            console.log("✅ updateProfile - success result:", result);
            resolve(result);
          } catch (parseError) {
            console.error("❌ updateProfile - JSON parse error:", parseError);
            reject(new Error("Erro ao processar resposta do servidor"));
          }
        } else {
          console.error("❌ updateProfile - error response:", xhr.responseText);
          reject(new Error(xhr.responseText || "Erro ao atualizar perfil do empregado"));
        }
      };
      
      xhr.onerror = function() {
        console.error("❌ updateProfile - network error");
        reject(new Error("Erro de rede"));
      };
      
      xhr.ontimeout = function() {
        console.error("❌ updateProfile - timeout");
        reject(new Error("Timeout na requisição"));
      };
      
      xhr.open("PATCH", `${API_BASE}/profile/`);
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("accessToken")}`);
      
      // Para FormData, não definir Content-Type - deixar o navegador definir
      if (!isFormData) {
        xhr.setRequestHeader("Content-Type", "application/json");
      }
      
      xhr.send(options.body);
    });
  } catch (error) {
    console.error("❌ updateProfile - catch error:", error);
    throw error;
  }
}
/**
 * Busca todas as Ordens de Producao sem paginação, aplicando filtros opcionais.
 * @param {Object} [filters={}] - Ex.: { tipo_impressao: 'serigrafia', status: 'aberto' }
 * @returns {Promise<Array>} Lista completa de ordens de produção
 */
export async function fetchAllOrdensProducao(filters = {}) {
  const accessToken = localStorage.getItem("accessToken");
  const params = new URLSearchParams(filters).toString();
  let url = `${API_BASE}/op/ordens-producao/?${params}`;
  console.log("🌐 URL chamada:", url);
  console.log("🔍 Filtros enviados:", filters);
  const allResults = [];
  while (url) {
    const response = await fetchWithRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Erro ao carregar ordens de produção');
    }
    const data = await response.json();
    console.log("📄 Resposta da página:", data);
    const pageResults = Array.isArray(data) ? data : data.results;
    allResults.push(...pageResults);
    url = Array.isArray(data) ? null : data.next;
  }
  return allResults;
}

/**
 * Busca todas as Ordens de Producao usando o endpoint otimizado com apenas campos essenciais.
 * @param {Object} [filters={}] - Ex.: { status__ne: 'Finalizado' }
 * @returns {Promise<Array>} Lista completa de ordens de produção (versão otimizada)
 */
export async function fetchAllOrdensProducaoOptimized(filters = {}) {
  const accessToken = localStorage.getItem("accessToken");
  const params = new URLSearchParams(filters).toString();
  const url = `${API_BASE}/op/ordens-producao/list-optimized/?${params}`;
  console.log("🚀 URL otimizada chamada:", url);
  console.log("🔍 Filtros enviados:", filters);
  
  const response = await fetchWithRefresh(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar ordens de produção (otimizado)');
  }
  
  const data = await response.json();
  console.log("📄 Resposta otimizada:", data);
  return data;
}

/**
 * Busca Ordens de Producao para o calendário usando endpoint ultra-otimizado.
 * @param {Object} [filters={}] - Ex.: { expedicao: 'expired' }
 * @returns {Promise<Array>} Lista de OPs para o calendário (versão ultra-otimizada)
 */
export async function fetchOrdensProducaoForCalendar(filters = {}) {
  const accessToken = localStorage.getItem("accessToken");
  const params = new URLSearchParams(filters).toString();
  const url = `${API_BASE}/op/ordens-producao/calendar/?${params}`;
  console.log("📅 URL calendário chamada:", url);
  console.log("🔍 Filtros enviados:", filters);
  
  const response = await fetchWithRefresh(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar OPs para o calendário');
  }
  
  const data = await response.json();
  console.log("📄 Resposta calendário:", data);
  return data;
}

/**
 * Busca uma OP específica com dados completos.
 * @param {number} opId - ID da Ordem de Produção
 * @returns {Promise<Object>} OP com todos os dados
 */
export async function fetchOrdemProducaoById(opId) {
  const accessToken = localStorage.getItem("accessToken");
  const url = `${API_BASE}/op/ordens-producao/${opId}/`;
  console.log("🔍 URL OP específica:", url);
  
  const response = await fetchWithRefresh(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar OP específica');
  }
  
  const data = await response.json();
  console.log("📄 Resposta OP específica:", data);
  return data;
}

/**
 * Busca relatório de OPs por empregado em uma data específica.
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} Lista de empregados com suas OPs
 */
export async function fetchEmployeeOpsReport(date) {
  const accessToken = localStorage.getItem("accessToken");
  const url = `${API_BASE}/op/ordens-producao/employee-report/?date=${date}`;
  console.log("📊 URL relatório empregados:", url);
  
  const response = await fetchWithRefresh(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar relatório de empregados');
  }
  
  const data = await response.json();
  console.log("📄 Resposta relatório empregados:", data);
  return data;
}

/**
 * Gera PDF do relatório de OPs por empregado.
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Blob>} PDF gerado
 */
export async function generateEmployeeOpsPDF(date) {
  const accessToken = localStorage.getItem("accessToken");
  const url = `${API_BASE}/op/ordens-producao/employee-report-pdf/?date=${date}`;
  console.log("📄 URL geração PDF:", url);
  
  const response = await fetchWithRefresh(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao gerar PDF do relatório');
  }
  
  const blob = await response.blob();
  
  // Criar link para download
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `relatorio-ops-empregados-${date}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  
  console.log("✅ PDF gerado e baixado com sucesso");
  return blob;
}
export async function fetchOrdemProducaoComplete(opId) {
  const accessToken = localStorage.getItem("accessToken");
  const url = `${API_BASE}/op/ordens-producao/${opId}/complete/`;
  console.log("🔍 Buscando OP completa:", url);
  
  const response = await fetchWithRefresh(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao buscar OP ${opId} com dados completos`);
  }
  
  const data = await response.json();
  console.log("📄 Resposta OP completa:", data);
  return data;
}
/**
 * Envia um clichê por email via Flexografia endpoint.
 * @param {number} flexId - ID da Flexografia
 * @param {number} opId - ID da Ordem de Produção
 * @param {string} email - Email de destino
 * @param {File} file - Arquivo de clichê
 * @returns {Promise<Object>} Resposta da API
 */
export async function sendCliche(flexId, opId, email, file) {
  const formData = new FormData();
  formData.append("op_id", opId);
  formData.append("email_destino", email);
  formData.append("file", file);

  const response = await fetchWithAuth(
    `${API_BASE}/op/flexografias/${flexId}/send-cliche/`,
    {
      method: "POST",
      body: formData,
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao enviar clichê da flexografia ${flexId}`);
  }
  return response.json();
}
// src/serviceapi/api.js.   ~ ssh -p "2108" root@165.227.235.73

// Aqui usamos fetch nativo, mas você pode trocar por axios se preferir.
export const API_BASE = "https://plastic.floow.pt/api";

/**
 * Wrapper for fetch that retries once on 401 by refreshing the access token.
 */
async function fetchWithRefresh(input, init = {}) {
  console.log("🌐 Fazendo requisição para:", input);
  let response = await originalFetch(input, init);
  console.log("📡 Status da resposta:", response.status);
  
  if (response.status === 401) {
    console.log("🔄 Token expirado, tentando refresh...");
    const refreshTokenValue = localStorage.getItem("refreshToken");
    console.log("🔍 Refresh token no localStorage:", refreshTokenValue ? "Presente" : "Ausente");
    
    if (refreshTokenValue) {
      try {
        console.log("🔄 Chamando função refreshToken...");
        const data = await refreshToken(refreshTokenValue);
        localStorage.setItem("accessToken", data.access);
        console.log("✅ Token renovado com sucesso");
        console.log("🆕 Novo access token:", data.access ? "Presente" : "Ausente");
        
        // Atualiza o header Authorization com o novo token
        if (init.headers) {
          init.headers.Authorization = `Bearer ${data.access}`;
        } else {
          init.headers = { Authorization: `Bearer ${data.access}` };
        }
        
        console.log("🔄 Fazendo requisição novamente com novo token...");
        // Tenta a requisição novamente com o novo token
        response = await originalFetch(input, { ...init, headers: init.headers });
        console.log("📡 Status da nova resposta:", response.status);
      } catch (err) {
        console.error("❌ Token refresh failed:", err);
        // Se o refresh falhar, remove os tokens e redireciona para login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/signin";
        throw err;
      }
    } else {
      console.error("❌ Não há refresh token disponível");
      localStorage.removeItem("accessToken");
      window.location.href = "/signin";
    }
  }
  return response;
}

/**
 * Wrapper to call fetchWithRefresh with JSON headers and bearer token.
 * @param {string} url - The endpoint URL.
 * @param {Object} [options={}] - Fetch options, without headers.
 */
export async function fetchWithAuth(url, options = {}) {
  // Third-party libs (e.g. model-viewer) may call fetch with Request/URL objects.
  // In those cases we should not rewrite the URL nor force auth headers.
  if (typeof url !== "string") {
    return fetchWithRefresh(url, options);
  }

  const accessToken = localStorage.getItem("accessToken");

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url); // http:, https:, blob:, data:, ...
  const isHttpAbsolute = /^https?:\/\//i.test(url);

  let fullUrl = url;
  if (!hasScheme && !isHttpAbsolute) {
    if (url.startsWith("/api")) {
      fullUrl = `${API_BASE}${url.slice(4)}`;
    } else {
      fullUrl = `${API_BASE}${url}`;
    }
  }

  // Only attach auth/json defaults for calls that target our API.
  const isApiRequest =
    fullUrl.startsWith(API_BASE) ||
    url.startsWith("/api") ||
    (!hasScheme && !isHttpAbsolute);

  if (!isApiRequest) {
    return fetchWithRefresh(fullUrl, options);
  }

  // Initialize headers with Authorization and any overrides
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...(options.headers || {}),
  };

  // Only add JSON Content-Type if the request body is not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  console.log("🔧 fetchWithAuth - URL:", fullUrl);
  console.log("🔧 fetchWithAuth - Method:", options.method);
  console.log("🔧 fetchWithAuth - Body is FormData:", options.body instanceof FormData);
  console.log("🔧 fetchWithAuth - Headers:", headers);
  
  return fetchWithRefresh(fullUrl, { ...options, headers });
}

// ----- AUTENTICAÇÃO -----
export async function login(username, password) {
  console.log("🌐 API_BASE:", API_BASE);
  console.log("📡 URL de login:", `${API_BASE}/token/`);
  console.log("📝 Dados enviados:", { username, password: password ? "***" : "vazio" });
  
  try {
    const response = await fetch(`${API_BASE}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    console.log("📡 Status da resposta:", response.status);
    console.log("📡 Headers da resposta:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // lança erro para quem chamar tratar
      const errText = await response.text();
      console.error("❌ Erro na resposta:", errText);
      throw new Error(errText || "Erro ao fazer login");
    }

    const data = await response.json();
    console.log("✅ Login bem-sucedido, dados recebidos:", { 
      access: data.access ? "Presente" : "Ausente", 
      refresh: data.refresh ? "Presente" : "Ausente" 
    });
    return data; // { access: "...", refresh: "..." }
  } catch (error) {
    console.error("💥 Erro na requisição:", error);
    throw error;
  }
}

export async function refreshToken(refreshTokenValue) {
  console.log("🔄 Iniciando refresh do token...");
  console.log("📝 Refresh token:", refreshTokenValue ? "Presente" : "Ausente");
  
  try {
    const response = await originalFetch("https://plastic.floow.pt/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });
    
    console.log("📡 Status da resposta:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Erro na resposta:", errorText);
      throw new Error(errorText || "Falha no refresh do token");
    }
    
    const data = await response.json();
    console.log("✅ Refresh bem-sucedido, novo access token recebido");
    return data;
  } catch (error) {
    console.log("💥 Erro durante refresh:", error.message);
    throw error;
  }
}

// ----- EXEMPLO DE ENDPOINT PROTEGIDO -----
// Para chamadas autenticadas, sempre envie o access token no header Authorization.
export async function getUserProfile(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/me/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao obter perfil");
  }

  return response.json();
}

// ----- OUTROS ENDPOINTS -----
// Adicione aqui outras funções, por exemplo:
// export async function signup(data) { ... }
// export async function resetPassword(email) { ... }
// export async function updateUser(data, accessToken) { ... }

// Dica: se quiser centralizar lógica de captura de erro ou
// formatação de headers, pode criar uma função auxiliar aqui.

// Busca a lista de clientes com token de autenticação
export async function getClients(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/clients`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar clientes");
  }
  return response.json();
}

// ⬇️ adicione antes da secção de “tipos de impressão”
/**
 * Associa um clichê existente a uma Flexografia.
 * @param {number} flexId - ID da Flexografia
 * @param {number} clicheId - ID do Clichê
 * @returns {Promise<Object>} Flexografia atualizada
 */
export async function setFlexografiaCliche(flexId, clicheId) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/flexografias/${flexId}/set-cliche/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliche_id: clicheId }),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      errText || `Erro ao associar clichê ${clicheId} à flexografia ${flexId}`
    );
  }
  return response.json();
}

/**
 * Cria (ou devolve) uma Flexografia para a OP indicada.
 * @param {number} opId - ID da Ordem de Produção
 * @returns {Promise<Object>} Flexografia criada/retornada
 */
export async function createFlexografia(opId) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/flexografias/create-for-op/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op_id: opId }),
    }
  );
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || `Erro ao criar flexografia para OP ${opId}`);
  }
  return response.json(); // objeto Flexografia
}

/**
 * Cria um novo clichê a partir de uma Ordem de Produção.
 * @param {number} opId - ID da Ordem de Produção
 * @returns {Promise<Object>} Clichê criado
 */
export async function createClicheFromOp(opId) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/cliches/create-from-op/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op_id: opId }),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao criar clichê para OP ${opId}`);
  }
  return response.json();
}

// Busca lista de tamanhos
export async function getTamanhos(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/tamanhos/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar tamanhos");
  }
  return response.json();
}

// Busca lista de tipos de saco
export async function getTipoSacos(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/tipo-sacos/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar tipos de saco");
  }
  return response.json();
}

// Busca catálogo de cores
export async function getCores(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/cores/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar cores");
  }
  return response.json();
}

// Busca modelos disponíveis para Project3D
export async function getProject3DModels(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/models/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar modelos 3D");
  }
  return response.json();
}

// Gera o ficheiro GLB para o Project3D
export async function generateProject3DGlb(data, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/generate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao gerar GLB do Project3D");
  }
  return response.json();
}

// Upload de imagem para impressão no saco (Project3D)
export async function uploadProject3DImage(file, accessToken) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/upload-image/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar imagem do Project3D");
  }
  return response.json();
}

// Busca configuração final guardada para um modelo/tamanho/cor
export async function getProject3DDesignConfig(params, accessToken) {
  const query = new URLSearchParams();
  if (params?.model) query.set("model", params.model);
  if (params?.tamanho_id) query.set("tamanho_id", String(params.tamanho_id));
  if (params?.cor_id) query.set("cor_id", String(params.cor_id));

  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/design-config/?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar configuração do Project3D");
  }
  return response.json();
}

// Guarda configuração final (overall) do Project3D
export async function saveProject3DDesignConfig(data, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/design-config/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao guardar configuração final do Project3D");
  }
  return response.json();
}

// Domínios permitidos para iframe (Project3D)
export async function getProject3DIframeDomains(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/iframe-domains/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao listar domínios de iframe");
  }
  return response.json();
}

export async function createProject3DIframeDomain(domain, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/iframe-domains/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ domain }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar domínio de iframe");
  }
  return response.json();
}

export async function deleteProject3DIframeDomain(domainId, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/iframe-domains/${domainId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok && response.status !== 204) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao eliminar domínio de iframe");
  }
  return true;
}

export async function generateProject3DIframeToken(domainId, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/iframe-domains/${domainId}/generate-token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao gerar token de iframe");
  }
  return response.json();
}

export async function clearProject3DCache(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/project3d/cache/clear/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao limpar cache do Project3D");
  }
  return response.json();
}

// Cria um novo Tamanho
export async function createTamanho(data, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/tamanhos/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar tamanho");
  }
  return response.json();
}

// Obtém um Tamanho específico por ID
export async function getTamanho(id, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/tamanhos/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao obter tamanho");
  }
  return response.json();
}

// Atualiza um Tamanho existente
export async function updateTamanho(id, data, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/tamanhos/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao atualizar tamanho");
  }
  return response.json();
}

// Deleta um Tamanho
export async function deleteTamanho(id, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/tamanhos/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao deletar tamanho");
  }
  return response.json();
}

// Cria uma nova GramagemPorCor
export async function createGramagemPorCor(data, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/gramagens_por_cor/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar gramagem por cor");
  }
  return response.json();
}

// Busca lista de tipos de impressão
export async function getTipoImpressao(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/tipo-impressao/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar tipos de impressão");
  }
  return response.json();
}

// Busca lista de contas de email disponíveis
export async function getEmailAccounts(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/emails/accounts/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar contas de email");
  }
  return response.json();
}


// Busca mensagens da caixa de entrada de uma conta
export async function getEmails(accountId, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/emails/${accountId}/inbox/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar emails");
  }
  return response.json();
}

// Busca detalhes de um EmailEnvio por ID
export async function getEmailEnvio(id, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/emailenvio/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar detalhes do email");
  }
  return response.json();
}

// Busca emails de um cliente específico
export async function getClientEmails(accessToken, clientId) {
  const response = await fetchWithRefresh(`${API_BASE}/client-emails/?client=${clientId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar emails do cliente");
  }
  return response.json();
}

// Cria um novo email para um cliente
export async function createClientEmail(data, accessToken) {
  // data pode ser FormData ou um objeto JSON dependendo da endpoint
  const isFormData = data instanceof FormData;
  const response = await fetchWithRefresh(`${API_BASE}/client-emails/`, {
    method: "POST",
    headers: isFormData
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar email do cliente");
  }
  return response.json();
}

// Upload de maquete para uma Ordem de Producao
export async function createMaquete(data, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/maquetas/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // NOTE: multipart/form-data header is set automatically by the browser
    },
    body: data, // FormData instance
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar maquete");
  }
  return response.json();
}

/**
 * Upload de maquete sem envio de email (file + ordem)
 */
export async function uploadMaquete(data, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/upload-maquete/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // multipart/form-data header is set automatically by the browser
    },
    body: data, // FormData with 'file' and 'ordem'
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao enviar maquete');
  }
  return response.json();
}

/**
 * Busca Ordens de Producao com filtros (por exemplo tipo_impressao e status).
 * Retorna formato paginado com campos `results`, `next`, `previous`.
 * @param {Object} filters - Ex.: { tipo_impressao: 'serigrafia', status: 'aberto' }
 * @returns {Promise<{results: Array, next: string|null, previous: string|null}>} Paginated lista de ordens de produção
 */
export async function fetchOrdensProducao(filters) {
  const accessToken = localStorage.getItem("accessToken");
  const query = new URLSearchParams(filters).toString();
  const response = await fetchWithRefresh(`${API_BASE}/op/ordens-producao/?${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar ordens de produção");
  }
  const json = await response.json();
// Normalize array responses to paginated format
if (Array.isArray(json)) {
  return { results: json, next: null, previous: null };
}
return json;
}

/**
 * Busca os clichês com paginação e pesquisa
 * @param {number} page - Página atual
 * @param {number} pageSize - Tamanho da página
 * @param {string} search - Termo de pesquisa
 * @returns {Promise<{results: Array, next: string|null, previous: string|null}>}
 */
export async function fetchCliches(page = 1, pageSize = 10, search = "") {
  const accessToken = localStorage.getItem("accessToken");
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (search) params.append("search", search);
  const url = `${API_BASE}/cliches/?${params.toString()}`;
  const response = await fetchWithRefresh(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar clichês");
  }
  return response.json();
}

/**
 * Verifica se já existe arte anexada para uma Serigrafia de OP
 * @param {number} opId - ID da Ordem de Produção
 * @returns {Promise<{has_arte: boolean, file_url?: string}>}
 */
export async function fetchHasArte(opId) {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithRefresh(
    `${API_BASE}/op/serigrafias/${opId}/has-arte/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao verificar arte da OP ${opId}`);
  }
  return response.json();
}

/**
 * Upload de arte para Serigrafia de uma OP
 * @param {number} opId - ID da Ordem de Producao
 * @param {File} file - Arquivo de arte
 * @returns {Promise<Object>} Resposta da API
 */
export async function uploadSerigrafiaArte(opId, file) {
  const accessToken = localStorage.getItem("accessToken");
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetchWithRefresh(`${API_BASE}/op/serigrafias/${opId}/upload-arte/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao enviar arte da serigrafia OP ${opId}`);
  }
  return response.json();
}

/**
 * Verifica se já existe clichê associado a uma Flexografia de OP
 * @param {number} flexId - ID da Flexografia (correspondente ao campo flexografia da OP)
 * @returns {Promise<{has_cliche: boolean, cliche?: Object}>}
 */
export async function fetchHasCliche(flexId) {
  const url = `${API_BASE}/op/flexografias/${flexId}/has-cliche/`;
  const response = await fetchWithAuth(url, { method: "GET" });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao verificar clichê da flexografia ${flexId}`);
  }
  return response.json();
}

/**
 * Cria um novo lote de envio para OPs.
 * @param {string} localEnvio - Local de envio para este lote
 * @returns {Promise<{id: number}>}
 */
export async function createLoteEnvio(localEnvio) {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithRefresh(`${API_BASE}/op/lotes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ local_envio: localEnvio })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar lote de envio");
  }
  return response.json();
}

/**
 * Adiciona uma OP ao lote.
 * @param {number} loteId
 * @param {number} opId
 */
export async function addOpToLote(loteId, opId) {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithRefresh(`${API_BASE}/op/lotes/${loteId}/add_op/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ op_id: opId })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao adicionar OP ao lote");
  }
  return response.json();
}

/**
 * Remove uma OP do lote.
 * @param {number} loteId
 * @param {number} opId
 */
export async function removeOpFromLote(loteId, opId) {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithRefresh(`${API_BASE}/op/lotes/${loteId}/remove_op/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ op_id: opId })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao remover OP do lote");
  }
  return response.json();
}

/**
 * Envia o lote por email.
 * @param {number} loteId
 * @param {string} destinatarios
 * @param {string} [mensagem]
 */
export async function sendLote(loteId, destinatarios, mensagem = "") {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithRefresh(`${API_BASE}/op/lotes/${loteId}/enviar/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ destinatarios, mensagem })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao enviar lote");
  }
  return response.json();
}

/**
 * Busca lotes abertos do usuário
 * @returns {Promise<Array>}
 */
export async function fetchOpenLotes() {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithRefresh(`${API_BASE}/op/lotes/abertos/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao buscar lotes abertos");
  }
  const data = await response.json();
  console.log('[DEBUG] fetchOpenLotes response data:', data);
  return data;
}

/**
 * Elimina lotes abertos pelo usuário
 * @param {number[]} loteIds
 */
export async function deleteOpenLotes(loteIds) {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithRefresh(`${API_BASE}/op/lotes/eliminar-abertos/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ lote_ids: loteIds }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao eliminar lotes");
  }
  return response.json(); // { deleted: count }
}

/**
 * Busca detalhes de um lote específico, incluindo as OPs associadas.
 * @param {number} loteId
 * @returns {Promise<Object>} Dados do lote com campo `ops`
 */
export async function fetchLoteDetail(loteId) {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithRefresh(`${API_BASE}/op/lotes/${loteId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao carregar lote ${loteId}`);
  }
  return response.json();
}

// -----------------------------------------------------------------------------
// Endpoints para lotes enviados e marcação de OPs como recebidas
// -----------------------------------------------------------------------------

/**
 * Busca lotes enviados do usuário
 * @returns {Promise<Array>} Lista de lotes com status 'enviado'
 */
export async function fetchSentLotes() {
  const response = await fetchWithAuth(`${API_BASE}/op/lotes/enviados/`, {
    method: "GET",
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao buscar lotes enviados");
  }
  return response.json();
}

/**
 * Marca uma OP como recebida em armazém
 * @param {number} opId
 */
export async function markOpReceived(opId) {
  const response = await fetchWithAuth(`${API_BASE}/op/ordens-producao/${opId}/marcar-recebida/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao marcar OP ${opId} como recebida`);
  }
  return response.json();
}

// Cria uma nova Ordem de Producao
export async function createOrdemProducao(data, accessToken) {
  const isFormData = data instanceof FormData;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };
  const body = isFormData ? data : JSON.stringify(data);

  const response = await fetchWithRefresh(`${API_BASE}/op/ordens-producao/`, {
    method: "POST",
    headers,
    body,
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar ordem de produção");
  }
  return response.json();
}

/**
 * Atualiza uma Ordem de Producao existente.
 * @param {number} id - ID da Ordem de Produção a atualizar.
 * @param {FormData|Object} data - Payload de atualização (FormData ou JSON).
 * @param {string} accessToken - Token de acesso.
 * @returns {Promise<Object>} Ordem atualizada.
 */
export async function updateOrdemProducao(id, data, accessToken) {
  const isFormData = data instanceof FormData;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };
  const body = isFormData ? data : JSON.stringify(data);
  const response = await fetchWithRefresh(
    `${API_BASE}/op/ordens-producao/${id}/`,
    {
      method: "PUT",
      headers,
      body,
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao atualizar ordem de produção #${id}`);
  }
  return response.json();
}


// Busca todas as Ordens de Producao
export async function getOrdensProducao(accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/ordens-producao/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar ordens de produção");
  }
  return response.json();
}

// Busca uma única Ordem de Producao pelo ID
export async function getOrdemProducao(id, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/ordens-producao/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao carregar ordem de produção");
  }
  return response.json();
}


/**
 * Busca o PDF da maquete para preview (público, requer token na query string)
 */
export async function fetchMaqueteBlob(ordemId, token) {
  const url = `${API_BASE}/op/ordens-producao/${ordemId}/view_maquete/?token=${encodeURIComponent(token)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao buscar maquete');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Busca o PDF do mockup (autenticado)
 * @param {number} ordemId
 * @param {string} accessToken
 * @returns {Promise<string>} URL do blob
 */
export async function fetchPdfMockup(ordemId, accessToken) {
  const response = await fetchWithRefresh(
    `${API_BASE}/op/ordens-producao/${ordemId}/pdf-mockup/`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao buscar PDF mockup');
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Triggers regeneration of the PDF mockup for a given OrdemProducao.
 * @param {number} ordemId - ID of the OrdemProducao.
 * @returns {Promise<Object>} Response detail.
 */
export async function triggerMockup(ordemId) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/ordens-producao/${ordemId}/trigger-mockup/`,
    {
      method: "POST",
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao gerar mockup da OP ${ordemId}`);
  }
  return response.json();
}

/**
 * Aprovar a maquete via API (público, requer token na query string)
 */
export async function approveMaquete(ordemId, token) {
  const url = `${API_BASE}/op/ordens-producao/${ordemId}/approve_maquete/?token=${encodeURIComponent(token)}`;
  const response = await fetch(url, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Erro ao aprovar maquete');
  return response.json();
}

/**
 * Rejeitar a maquete via API (público, requer token na query string)
 */
export async function rejectMaquete(ordemId, reason, token) {
  const url = `${API_BASE}/op/ordens-producao/${ordemId}/reject_maquete/?token=${encodeURIComponent(token)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Erro ao rejeitar maquete');
  return response.json();
}

/**
 * Envia email de aprovação de maquete (autenticado)
 * @param {{ordem: number, email_destino: string}} data
 * @param {string} accessToken
 */

export async function sendApprovalEmail(data, accessToken) {
  const response = await fetchWithRefresh(`${API_BASE}/op/generate-approval-email/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao enviar email de aprovação');
  }
  return response.json();
}


/**
 * Obtém o caminho do ficheiro para uma OP digital.
 * @param {number} opId - ID da Ordem de Produção
 * @returns {Promise<{file_path: string|null, ordem: number, cores_impressao: Array, ...}>}
 */
export async function getFilePath(opId) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/digitais/get-file-path/?op_id=${opId}`,
    { method: "GET" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao obter file_path da OP ${opId}`);
  }
  return response.json();
}

/**
 * Define ou atualiza o caminho do ficheiro para uma OP digital.
 * @param {number} opId - ID da Ordem de Produção
 * @param {string} path - Caminho do ficheiro
 * @returns {Promise<Object>} Objeto Digital atualizado
 */
export async function setFilePath(opId, path) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/digitais/set-file-path/`,
    {
      method: "POST",
      body: JSON.stringify({ op_id: opId, file_path: path }),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao definir file_path da OP ${opId}`);
  }
  return response.json();
}

/**
 * Busca todos os layouts de email.
 * @param {string} accessToken
 * @returns {Promise<Array>} Lista de layouts de email
 */
export async function getEmailLayouts(accessToken) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/email-layouts/`,
    { method: 'GET' }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar layouts de email');
  }
  return response.json();
}

/**
 * Cria um novo layout de email.
 * @param {{ tipo: string; lingua: string; assunto: string; corpo: string }} data
 * @param {string} accessToken
 * @returns {Promise<Object>} Layout criado
 */
export async function createEmailLayout(data, accessToken) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/email-layouts/`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao criar layout de email');
  }
  return response.json();
}

/**
 * Atualiza um layout de email existente.
 * @param {number} id - ID do layout
 * @param {{ tipo: string; lingua: string; assunto: string; corpo: string }} data
 * @param {string} accessToken
 * @returns {Promise<Object>} Layout atualizado
 */
export async function updateEmailLayout(id, data, accessToken) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/email-layouts/${id}/`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao atualizar layout de email ${id}`);
  }
  return response.json();
}
/**
 * Atualiza o status de uma OrdemProducao.
 * @param {number} id - ID da Ordem de Produção
 * @param {string} status - Novo status
 * @returns {Promise<Object>} Ordem atualizada
 */
export async function updateOrdemProducaoStatus(id, status) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/ordens-producao/${id}/`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao atualizar status da Ordem #${id}`);
  }
  return response.json();
}

// ----- Empregado Email Profissional -----

/**
 * Obtém o email profissional de um empregado.
 * @param {number} empregadoId - ID do empregado.
 * @returns {Promise<Object|null>} Retorna objeto ou null se não existir.
 */
export async function getEmpregadoEmailProfissional(empregadoId) {
  const accessToken = localStorage.getItem("accessToken");
  const url = `${API_BASE}/empregado-email-profissional/?empregado=${empregadoId}`;
  const response = await fetchWithAuth(url, { method: "GET" });
  if (!response.ok) {
    if (response.status === 404) return null;
    const errText = await response.text();
    throw new Error(errText || `Erro ao obter email profissional do empregado ${empregadoId}`);
  }
  const data = await response.json();
  // A API retorna uma lista; retorna o primeiro item ou null
  return Array.isArray(data) ? data[0] || null : (data.results ? data.results[0] || null : null);
}

/**
 * Obtém o email profissional do usuário autenticado.
 * @returns {Promise<Object|null>} Email profissional ou null se não encontrado
 */
export async function getMyEmailProfissional() {
  const response = await fetchWithAuth(`${API_BASE}/empregado-email-profissional/me/`, { 
    method: "GET" 
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const errText = await response.text();
    throw new Error(errText || 'Erro ao obter email profissional do usuário atual');
  }
  return response.json();
}

/**
 * Cria um novo email profissional para um empregado.
 * @param {{empregado: number, email: string, senha: string}} data
 * @returns {Promise<Object>} Objeto criado.
 */
export async function createEmpregadoEmailProfissional(data) {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithAuth(
    `${API_BASE}/empregado-email-profissional/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar email profissional do empregado");
  }
  return response.json();
}

/**
 * Atualiza a senha do email profissional de um empregado.
 * @param {number} id - ID do registro EmpregadoEmailProfissional.
 * @param {{senha: string}} data - Objeto contendo a nova senha.
 * @returns {Promise<Object>} Objeto atualizado.
 */
export async function updateEmpregadoEmailProfissional(id, data) {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetchWithAuth(
    `${API_BASE}/empregado-email-profissional/${id}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao atualizar senha do email profissional #${id}`);
  }
  return response.json();
}

/**
 * Deleta uma Ordem de Produção.
 * @param {number} id - ID da Ordem de Produção
 * @returns {Promise<Object>} Resposta da API
 */
export async function deleteOrdemProducao(id) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/ordens-producao/${id}/`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao deletar OP ${id}`);
  }
  return response.json();
}

// ----- Calendar Events -----

/**
 * Busca todos os eventos do calendário.
 * @param {Object} [filters={}] - Filtros opcionais (start_date, end_date, calendar)
 * @returns {Promise<Array>} Lista de eventos
 */
export async function fetchCalendarEvents(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const url = `${API_BASE}/op/calendar-events/${params ? `?${params}` : ''}`;
  
  const response = await fetchWithAuth(url, { method: "GET" });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar eventos do calendário');
  }
  return response.json();
}

/**
 * Cria um novo evento no calendário.
 * @param {Object} eventData - Dados do evento
 * @returns {Promise<Object>} Evento criado
 */
export async function createCalendarEvent(eventData) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/calendar-events/`,
    {
      method: "POST",
      body: JSON.stringify(eventData),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao criar evento');
  }
  return response.json();
}

/**
 * Atualiza um evento existente no calendário.
 * @param {number} id - ID do evento
 * @param {Object} eventData - Dados atualizados do evento
 * @returns {Promise<Object>} Evento atualizado
 */
export async function updateCalendarEvent(id, eventData) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/calendar-events/${id}/`,
    {
      method: "PUT",
      body: JSON.stringify(eventData),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao atualizar evento ${id}`);
  }
  return response.json();
}

/**
 * Deleta um evento do calendário.
 * @param {number} id - ID do evento
 * @returns {Promise<Object>} Resposta da API
 */
export async function deleteCalendarEvent(id) {
  const response = await fetchWithAuth(
    `${API_BASE}/op/calendar-events/${id}/`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao deletar evento ${id}`);
  }
  return response.json();
}

/**
 * Busca eventos futuros.
 * @returns {Promise<Array>} Lista de eventos futuros
 */
export async function fetchUpcomingEvents() {
  const response = await fetchWithAuth(
    `${API_BASE}/op/calendar-events/upcoming/`,
    { method: "GET" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar eventos futuros');
  }
  return response.json();
}

/**
 * Busca eventos de hoje.
 * @returns {Promise<Array>} Lista de eventos de hoje
 */
export async function fetchTodayEvents() {
  const response = await fetchWithAuth(
    `${API_BASE}/op/calendar-events/today/`,
    { method: "GET" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar eventos de hoje');
  }
  return response.json();
}

// ----- Dashboard Widgets -----

/**
 * Busca OPs urgentes (não finalizadas e com prazo próximo)
 * @returns {Promise<Array>} Lista de OPs urgentes
 */
export async function fetchUrgentOps() {
  const response = await fetchWithAuth(
    `${API_BASE}/op/ordens-producao/urgent/`,
    { method: "GET" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar OPs urgentes');
  }
  return response.json();
}

export async function fetchStaleOps() {
  const response = await fetchWithAuth(
    `${API_BASE}/op/ordens-producao/stale/`,
    { method: "GET" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar OPs não atualizadas');
  }
  return response.json();
}

// ----- Clientes -----

/**
 * Busca todos os clientes.
 * @returns {Promise<Array>} Lista de clientes
 */
export async function fetchClients() {
  const response = await fetchWithAuth(
    `${API_BASE}/clients/`,
    { method: "GET" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Erro ao carregar clientes');
  }
  return response.json();
}

/**
 * Busca detalhes de um cliente específico.
 * @param {number} clientId - ID do cliente
 * @returns {Promise<Object>} Dados do cliente
 */
export async function fetchClientDetail(clientId) {
  const response = await fetchWithAuth(
    `${API_BASE}/clients/${clientId}/`,
    { method: "GET" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao carregar cliente ${clientId}`);
  }
  return response.json();
}

/**
 * Atualiza um cliente.
 * @param {number} clientId - ID do cliente
 * @param {Object} clientData - Dados atualizados do cliente
 * @returns {Promise<Object>} Cliente atualizado
 */
export async function updateClient(clientId, clientData) {
  const response = await fetchWithAuth(
    `${API_BASE}/clients/${clientId}/`,
    {
      method: "PUT",
      body: JSON.stringify(clientData),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao atualizar cliente ${clientId}`);
  }
  return response.json();
}

/**
 * Deleta um cliente.
 * @param {number} clientId - ID do cliente
 * @returns {Promise<Object>} Resposta da API
 */
export async function deleteClient(clientId) {
  const response = await fetchWithAuth(
    `${API_BASE}/clients/${clientId}/`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao deletar cliente ${clientId}`);
  }
  return response.json();
}

/**
 * Busca as ordens de produção de um cliente específico.
 * @param {number} clientId - ID do cliente
 * @returns {Promise<Array>} Lista de ordens de produção
 */
// ----- Client Label Templates -----
export async function getClientLabelTemplates(clientId, token) {
  const response = await fetchWithRefresh(`${API_BASE}/client-label-templates/?client_id=${clientId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch client label templates: ${errorText}`);
  }
  const data = await response.json();
  // Ensure template_data is parsed if it's a string
  return data.map((template) => ({
    ...template,
    template_data: typeof template.template_data === 'string' 
      ? JSON.parse(template.template_data) 
      : template.template_data,
  }));
}

export async function getClientLabelTemplate(templateId, token) {
  const response = await fetchWithRefresh(`${API_BASE}/client-label-templates/${templateId}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch client label template: ${errorText}`);
  }
  return response.json();
}

export async function previewClientLabelTemplate(templateData, quantidadePorCaixa, medida, opId, token) {
  const response = await fetchWithRefresh(`${API_BASE}/client-label-templates/preview/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      template_data: templateData,
      quantidade_por_caixa: quantidadePorCaixa,
      medida: medida,
      op_id: opId,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate preview: ${errorText}`);
  }
  return response.json();
}

export async function createClientLabelTemplate(data, token) {
  const response = await fetchWithRefresh(`${API_BASE}/client-label-templates/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error creating label template:', errorText);
    throw new Error(`Failed to create client label template: ${errorText}`);
  }
  return response.json();
}

export async function updateClientLabelTemplate(templateId, data, token) {
  const response = await fetchWithRefresh(`${API_BASE}/client-label-templates/${templateId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update client label template: ${errorText}`);
  }
  return response.json();
}

export async function deleteClientLabelTemplate(templateId, token) {
  const response = await fetchWithRefresh(`${API_BASE}/client-label-templates/${templateId}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete client label template: ${errorText}`);
  }
  return response.ok;
}

export async function fetchClientOrders(clientId) {
  const response = await fetchWithAuth(
    `${API_BASE}/clients/${clientId}/orders/`,
    { method: "GET" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Erro ao carregar ordens do cliente ${clientId}`);
  }
  return response.json();
}

// ===== GESTÃO DE IMPRESSÃO =====

/**
 * Obtém todas as máquinas de impressão.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Array>} Lista de máquinas.
 */
export async function getMaquinas(token) {
  const response = await fetchWithAuth(`${API_BASE}/op/maquinas/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Erro ao carregar máquinas");
  }
  return response.json();
}

/**
 * Cria uma nova máquina de impressão.
 * @param {Object} maquinaData - Dados da máquina.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Object>} Máquina criada.
 */
export async function createMaquina(maquinaData, token) {
  const response = await fetchWithAuth(`${API_BASE}/op/maquinas/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(maquinaData),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar máquina");
  }
  return response.json();
}

/**
 * Atualiza uma máquina de impressão.
 * @param {number} maquinaId - ID da máquina.
 * @param {Object} maquinaData - Dados atualizados da máquina.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Object>} Máquina atualizada.
 */
export async function updateMaquina(maquinaId, maquinaData, token) {
  const response = await fetchWithAuth(`${API_BASE}/op/maquinas/${maquinaId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(maquinaData),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao atualizar máquina");
  }
  return response.json();
}

/**
 * Remove uma máquina de impressão.
 * @param {number} maquinaId - ID da máquina.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<void>}
 */
export async function deleteMaquina(maquinaId, token) {
  const response = await fetchWithAuth(`${API_BASE}/op/maquinas/${maquinaId}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao remover máquina");
  }
}

/**
 * Obtém o estado atual de uma máquina.
 * @param {number} maquinaId - ID da máquina.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Object|null>} Estado atual ou null se não houver.
 */
export async function getMaquinaEstadoAtual(maquinaId, token) {
  const response = await fetchWithAuth(`${API_BASE}/op/maquinas/${maquinaId}/estado_atual/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 404) {
    return null; // Máquina não tem estado ativo
  }
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao obter estado atual da máquina");
  }
  return response.json();
}

/**
 * Obtém todas as máquinas com estados ativos.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Array>} Lista de máquinas ativas.
 */
export async function getMaquinasComEstadosAtivos(token) {
  const response = await fetchWithAuth(`${API_BASE}/op/maquinas/com_estados_ativos/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Erro ao carregar máquinas com estados ativos");
  }
  return response.json();
}

/**
 * Obtém todos os estados de impressão.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Array>} Lista de estados de impressão.
 */
export async function getEstadosImpressao(token) {
  const response = await fetchWithAuth(`${API_BASE}/op/estados-impressao/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Erro ao carregar estados de impressão");
  }
  return response.json();
}

/**
 * Obtém apenas os estados ativos de impressão.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Array>} Lista de estados ativos.
 */
export async function getEstadosImpressaoAtivos(token) {
  const response = await fetchWithAuth(`${API_BASE}/op/estados-impressao/estados_ativos/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Erro ao carregar estados ativos de impressão");
  }
  return response.json();
}

/**
 * Cria um novo estado de impressão.
 * @param {Object} estadoData - Dados do estado de impressão.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Object>} Estado criado.
 */
export async function createEstadoImpressao(estadoData, token) {
  const response = await fetchWithAuth(`${API_BASE}/op/estados-impressao/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(estadoData),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao criar estado de impressão");
  }
  return response.json();
}

/**
 * Finaliza um estado de impressão.
 * @param {number} estadoId - ID do estado.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Object>} Estado finalizado.
 */
export async function finalizarEstadoImpressao(estadoId, token) {
  const response = await fetchWithAuth(`${API_BASE}/op/estados-impressao/${estadoId}/finalizar/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao finalizar estado de impressão");
  }
  return response.json();
}

/**
 * Atualiza a quantidade produzida de um estado de impressão.
 * @param {number} estadoId - ID do estado.
 * @param {number} quantidade - Nova quantidade produzida.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Object>} Estado atualizado.
 */
export async function atualizarQuantidadeProduzida(estadoId, quantidade, token) {
  const response = await fetchWithAuth(`${API_BASE}/op/estados-impressao/${estadoId}/atualizar_quantidade/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantidade_produzida: quantidade }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Erro ao atualizar quantidade produzida");
  }
  return response.json();
}

/**
 * Obtém gramagens disponíveis para um tamanho e cor específicos.
 * @param {number} tamanhoId - ID do tamanho.
 * @param {number} corId - ID da cor.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Array>} Lista de gramagens disponíveis.
 */
export async function getGramagensByTamanhoCor(tamanhoId, corId, token) {
  console.log('🔍 getGramagensByTamanhoCor chamada com:', { tamanhoId, corId, token: token ? 'Sim' : 'Não' });
  
  const url = `${API_BASE}/op/gramagens-by-tamanho-cor/?tamanho_id=${tamanhoId}&cor_id=${corId}`;
  console.log('📡 URL:', url);
  
  const response = await fetchWithAuth(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  console.log('📊 Resposta da API:', response.status, response.statusText);
  
  if (!response.ok) {
    const errText = await response.text();
    console.error('❌ Erro na API:', errText);
    throw new Error(errText || "Erro ao obter gramagens");
  }
  
  const data = await response.json();
  console.log('✅ Dados recebidos:', data);
  return data;
}
