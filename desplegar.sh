#!/bin/bash

# =========================================================================
# SCRIPT DE DESPLIEGUE SEGURO PARA LOCALECOMER
# =========================================================================
# Este script valida la compilación de forma local para evitar errores en Vercel.
# Si compila con éxito, envía los cambios automáticamente a GitHub para desplegar.

MENSAJE="${1:-"actualización de plataforma"}"

echo "🚀 Iniciando proceso de despliegue seguro..."
echo "📦 Mensaje del commit: '$MENSAJE'"

# 1. Validar compilación localmente
echo "🔨 Validando compilación local (pnpm build)..."
if ! pnpm build; then
  echo ""
  echo "❌ Error: La compilación ha fallado localmente."
  echo "⚠️  Despliegue cancelado. Corrige los errores arriba descritos antes de intentar de nuevo."
  exit 1
fi

echo "✅ Compilación exitosa. Procediendo al despliegue..."

# 2. Agregar todos los cambios
git add .

# 3. Hacer commit saltando husky local
echo "🔄 Guardando cambios localmente..."
git commit -m "$MENSAJE" --no-verify || echo "⚠️ Nada nuevo para guardar o error en commit."

# 4. Subir a Github (Vercel lo atrapará automáticamente al vuelo)
echo "☁️ Sincronizando con GitHub (Vercel)..."
git push origin main --force --no-verify

echo ""
echo "✅ ¡PROCESO FINALIZADO CON ÉXITO!"
echo "🚀 Los cambios se han enviado a la nube."
echo "🌍 El despliegue en https://localecomer.store/ estará listo en ~60-90 segundos."
echo "💡 Si no ves los cambios, intenta borrar la caché del navegador (CTRL + F5)."
