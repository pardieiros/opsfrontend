# Troubleshooting do Service Worker

## Problema: Tela Branca ao Abrir a Aplicação

### Sintomas
- A aplicação não carrega e fica com tela branca
- É necessário fazer Ctrl+F5 (hard refresh) para funcionar
- O problema ocorre principalmente após atualizações

### Causas
1. **Cache agressivo do Service Worker**: O service worker está servindo versões antigas dos arquivos
2. **Falta de controle de versão**: Não há controle adequado para invalidar cache quando há atualizações
3. **Bypass inadequado**: O service worker não está lidando corretamente com atualizações

## Soluções Implementadas

### 1. Service Worker Melhorado
- **Versão incrementada**: `app-cache-v2` para forçar atualização
- **Network-first para navegação**: Sempre tenta a rede primeiro para páginas
- **Cache-first para recursos**: CSS, JS e imagens usam cache com fallback
- **Limpeza automática**: Remove caches antigos automaticamente
- **Bypass melhorado**: Ignora API endpoints e WebSocket connections

### 2. Registro Melhorado
- **updateViaCache: 'none'**: Força verificação de atualizações
- **Detecção de atualizações**: Notifica quando há nova versão
- **Auto-reload**: Recarrega automaticamente quando há atualização

### 3. Componente de Notificação
- **ServiceWorkerUpdate**: Mostra notificação quando há atualização disponível
- **Botão de atualização**: Permite atualizar manualmente
- **Posicionamento**: Aparece no canto inferior direito

## Como Resolver Problemas

### Solução Imediata (Desenvolvimento)
1. **Abrir Console do Navegador** (F12)
2. **Executar**: `clearServiceWorkerCache()`
3. **Recarregar a página**

### Solução Manual (Produção)
1. **Abrir Console do Navegador** (F12)
2. **Executar**:
```javascript
// Limpar todos os caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Desregistrar service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});

// Recarregar página
window.location.reload();
```

### Verificar Status do Service Worker
```javascript
// No console do navegador
checkServiceWorkerStatus();
```

## Prevenção de Problemas

### Para Desenvolvedores
1. **Sempre incrementar versão** do cache quando fizer mudanças
2. **Testar em modo incógnito** para evitar problemas de cache
3. **Usar DevTools > Application > Service Workers** para debug

### Para Usuários
1. **Aceitar atualizações** quando aparecer a notificação
2. **Usar Ctrl+F5** se a página não carregar
3. **Limpar cache** se problemas persistirem

## Configurações do Service Worker

### Cache Strategy
- **Navegação**: Network-first (rede primeiro, cache como fallback)
- **Recursos**: Cache-first (cache primeiro, rede como fallback)
- **API**: Bypass completo (não cache)

### Arquivos Cacheados
- `/` (página inicial)
- `/index.html`
- `/favicon.ico`
- `/icon-192.png`
- `/icon-512.png`

### Endpoints Ignorados
- `/api/*` (endpoints da API)
- `socket.io` (WebSocket connections)
- `pusher` (notificações em tempo real)

## Debug

### Logs do Service Worker
O service worker agora inclui logs detalhados:
- "Service Worker instalando..."
- "Cache aberto"
- "Service Worker ativando..."
- "Removendo cache antigo: [nome]"
- "Usando cache para navegação"

### Verificar no DevTools
1. **F12 > Application > Service Workers**
2. **Verificar status**: Active, Installing, Waiting
3. **Verificar caches**: Application > Storage > Cache Storage

## Comandos Úteis

### No Console do Navegador
```javascript
// Limpar cache
clearServiceWorkerCache()

// Verificar status
checkServiceWorkerStatus()

// Forçar atualização
navigator.serviceWorker.controller?.postMessage({type: 'SKIP_WAITING'})
```

### No Terminal (Desenvolvimento)
```bash
# Limpar build
rm -rf dist/
npm run build

# Servir com cache limpo
npm run dev
``` 