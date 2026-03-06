#!/bin/bash

echo "🚀 Iniciando build para produção..."

# Limpar build anterior
echo "🧹 Limpando build anterior..."
rm -rf dist/

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
npm install

# Build para produção
echo "🔨 Fazendo build..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos gerados em: dist/"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Fazer upload da pasta 'dist/' para o servidor"
    echo "2. Configurar nginx com o arquivo 'nginx-spa.conf'"
    echo "3. Reiniciar nginx: sudo systemctl restart nginx"
    echo ""
    echo "🌐 URL de acesso: https://plastic.floow.pt/ops/"
else
    echo "❌ Erro no build!"
    exit 1
fi 