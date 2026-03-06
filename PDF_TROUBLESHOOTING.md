# Troubleshooting - Problemas com PDF no Portal do Trabalhador

## Problema: "Failed to read PDF" no PC das Designers

### 🔍 **Causas Comuns**

1. **Incompatibilidade de Navegador**
   - Safari em versões antigas do macOS
   - Chrome/Edge em versões antigas do Windows
   - Navegadores corporativos com políticas de segurança restritivas

2. **Problemas de Sistema Operacional**
   - Windows com configurações de segurança restritivas
   - macOS com Gatekeeper ativo
   - Políticas de grupo corporativas

3. **Problemas de Arquivo PDF**
   - PDF corrompido ou protegido
   - PDF com versão muito antiga
   - PDF com fontes não embutidas

4. **Problemas de Rede/Proxy**
   - Firewall corporativo bloqueando CDN
   - Proxy corporativo interferindo
   - CORS policies restritivas

### ✅ **Soluções Implementadas**

#### 1. **Configuração Robusta do PDF.js**
```typescript
// pdfjsConfig.ts
const configurePdfJs = () => {
  try {
    // Tentar worker local primeiro
    import('pdfjs-dist/build/pdf.worker.min.mjs?url').then(module => {
      pdfjs.GlobalWorkerOptions.workerSrc = module.default;
    }).catch(() => {
      // Fallback para CDN
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    });
  } catch (error) {
    // Fallback final
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }
};
```

#### 2. **Detecção Automática de Problemas**
```typescript
// Verificação de compatibilidade
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isOldBrowser = !window.fetch || !window.Promise;

if (isSafari || isOldBrowser) {
  // Mostrar aviso ao usuário
}
```

#### 3. **Fallback Visual**
- Quando o PDF falha, mostra uma imagem informativa
- Inclui instruções detalhadas para o usuário
- Oferece opções alternativas

#### 4. **Tratamento de Erros Melhorado**
- Logs detalhados no console
- Mensagens de erro informativas
- Múltiplas tentativas de renderização

### 🛠️ **Soluções para as Designers**

#### **Solução Imediata:**
1. **Usar Imagens em vez de PDF**
   - Converter PDF para JPG/PNG
   - Usar ferramentas online como:
     - [PDF to Image Converter](https://www.ilovepdf.com/pdf_to_jpg)
     - [SmallPDF](https://smallpdf.com/pdf-to-jpg)
     - [Adobe Acrobat Online](https://www.adobe.com/acrobat/online/pdf-to-jpg.html)

2. **Verificar Navegador**
   - Atualizar Chrome/Firefox para versão mais recente
   - Tentar em modo incógnito
   - Desabilitar extensões temporariamente

#### **Solução Permanente:**
1. **Configurar Navegador**
   ```bash
   # Chrome - Permitir conteúdo misto
   chrome://settings/content/javascript
   
   # Firefox - Permitir PDF.js
   about:config
   pdfjs.disabled = false
   ```

2. **Configurar Sistema**
   ```bash
   # Windows - Permitir aplicações
   Configurações > Privacidade e Segurança > Aplicações
   
   # macOS - Permitir aplicações
   Preferências do Sistema > Segurança e Privacidade
   ```

### 🔧 **Comandos de Diagnóstico**

#### **Verificar Console do Navegador:**
```javascript
// No console do navegador
console.log('PDF.js version:', pdfjs.version);
console.log('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
console.log('User agent:', navigator.userAgent);
```

#### **Testar PDF.js:**
```javascript
// Teste básico de PDF.js
import { getDocument } from 'pdfjs-dist';

getDocument('test.pdf').promise.then(pdf => {
  console.log('PDF loaded successfully');
}).catch(error => {
  console.error('PDF load failed:', error);
});
```

### 📋 **Checklist para Designers**

- [ ] Navegador atualizado para versão mais recente
- [ ] Tentou em modo incógnito
- [ ] Desabilitou extensões temporariamente
- [ ] Verificou se o PDF abre em outros programas
- [ ] Tentou converter PDF para imagem
- [ ] Verificou console do navegador por erros
- [ ] Tentou em outro navegador (Chrome, Firefox, Edge)

### 🚨 **Sinais de Problema**

1. **Console mostra erros:**
   ```
   Error: Failed to fetch PDF worker
   Error: PDF.js worker not found
   Error: CORS policy blocked
   ```

2. **Comportamento estranho:**
   - Modal de crop não abre
   - Tela fica em branco
   - Aplicação trava

3. **Mensagens de erro:**
   - "Failed to read PDF"
   - "PDF worker not available"
   - "CORS error"

### 📞 **Suporte**

Se o problema persistir:

1. **Coletar informações:**
   - Screenshot do erro
   - Console logs
   - Versão do navegador
   - Sistema operacional
   - Tamanho do arquivo PDF

2. **Alternativas temporárias:**
   - Usar imagens em vez de PDF
   - Converter PDF via ferramentas online
   - Usar outro navegador

3. **Contato técnico:**
   - Enviar logs detalhados
   - Descrever passos para reproduzir
   - Incluir informações do sistema

### 🔄 **Atualizações Futuras**

- [ ] Implementar conversão automática PDF → Imagem
- [ ] Adicionar suporte a mais formatos de arquivo
- [ ] Melhorar detecção de compatibilidade
- [ ] Implementar cache de PDFs processados
- [ ] Adicionar preview em tempo real 