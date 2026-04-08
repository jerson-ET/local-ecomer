#!/bin/bash

# =========================================================================
# SCRIPT DE DESPLIEGUE RÁPIDO PARA LOCALECOMER
# =========================================================================
# Este script envía los cambios directamente a GitHub, lo que activa el
# despliegue automático en Vercel sin necesidad de iniciar sesión en la CLI.
# Ignora las advertencias de código (husky) para garantizar que suba rápido.

MENSAJE="${1:-"actualización rápida de plataforma"}"

echo "🚀 Iniciando despliegue hacia local-ecomer..."
echo "📦 Mensaje del commit: '$MENSAJE'"

# 1. Agregar todos los cambios
git add .

# 2. Hacer commit saltando cualquier bloqueo estricto de ESLint local
echo "🔄 Guardando cambios..."
git commit -m "$MENSAJE" --no-verify

# 3. Subir a Github (Vercel lo atrapará automáticamente al vuelo)
echo "☁️ Subiendo a la nube (GitHub -> Vercel)..."
git push origin deploy-v1

echo "✅ ¡Listo! Los cambios están en proceso de despliegue."
echo "🌍 En 1 minuto estarán en la página principal."
