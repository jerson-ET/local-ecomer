#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  LOCALECOMER — Arranque Automático del Servidor
#  Inicia el servidor de desarrollo y abre el navegador automáticamente.
#  También muestra la IP de red para acceder desde el teléfono.
# ═══════════════════════════════════════════════════════════════════════════

clear

# Colores
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m' # Sin color

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${WHITE}           🛒  LOCAL ECOMER — Servidor de Desarrollo${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Obtener la IP de red local
LOCAL_IP=$(hostname -I | awk '{print $1}')
PORT=3000

echo -e "${CYAN}📡 Preparando servidor...${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${WHITE}  🖥️  PC:       ${CYAN}http://localhost:${PORT}${NC}"
echo -e "${WHITE}  📱  TELÉFONO: ${YELLOW}http://${LOCAL_IP}:${PORT}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${WHITE}  👤 Admin:     ${CYAN}admin@localecomer.app${NC}"
echo -e "${WHITE}  🔑 Password:  ${CYAN}Admin2026!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}  💡 Para acceder desde el teléfono:${NC}"
echo -e "${WHITE}     1. Conecta el teléfono a la misma WiFi que tu PC${NC}"
echo -e "${WHITE}     2. Abre el navegador del teléfono${NC}"
echo -e "${WHITE}     3. Escribe: ${YELLOW}http://${LOCAL_IP}:${PORT}${NC}"
echo ""
echo -e "${CYAN}  Presiona Ctrl+C para detener el servidor${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Abrir el navegador automáticamente después de 3 segundos (en segundo plano)
(sleep 3 && xdg-open "http://localhost:${PORT}" 2>/dev/null || google-chrome "http://localhost:${PORT}" 2>/dev/null || firefox "http://localhost:${PORT}" 2>/dev/null) &

# Iniciar el servidor de Next.js escuchando en todas las interfaces de red
# --hostname 0.0.0.0 permite acceso desde otros dispositivos en la red
cd "$(dirname "$0")"
npx next dev --hostname 0.0.0.0 --port ${PORT}
