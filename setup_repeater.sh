#!/bin/bash

# Configuration
INTERFACE="wlp2s0"
AP_INTERFACE="wlp2s0_ap"

echo "=== Configurando Repetidor WiFi (Intento 3: Canal Forzado) ==="
echo "Verificando conexión..."

# 1. Install dependencies if missing
if ! command -v hostapd &> /dev/null; then
    echo "Falta 'hostapd'. Instalando..."
    apt-get update && apt-get install -y hostapd
fi

# 2. Setup Variables
# Detect current SSID
CURRENT_SSID=$(iw dev $INTERFACE link | grep SSID | awk '{print $2}')
if [ -z "$CURRENT_SSID" ]; then CURRENT_SSID="MiWiFi"; fi
SSID="${CURRENT_SSID}_Repetidor"
PASSWORD="jerson_repetidor"

# Detect Frequency/Channel
FREQ_RAW=$(iw dev $INTERFACE link | grep freq | awk '{print $2}')
FREQ=${FREQ_RAW%.*} # Remove decimal
if [ -z "$FREQ" ]; then FREQ=2412; fi
# Calculate Channel and Band
CHANNEL=$(( ($FREQ - 2407) / 5 ))
BAND="bg"
if [ "$FREQ" -ge 5000 ]; then
    CHANNEL=$(( ($FREQ - 5000) / 5 ))
    BAND="a"
fi
echo "Canal detectado: $CHANNEL ($FREQ MHz) Banda: $BAND"

echo "Red WiFi (Salida): $SSID"
echo "Contraseña: $PASSWORD"

# 3. Clean up
if ip link show "$AP_INTERFACE" > /dev/null 2>&1; then
    echo "Limpiando interfaz anterior..."
    iw dev "$AP_INTERFACE" del
fi

# 4. Create virtual interface (Standard, no MAC hack)
echo "Creando interfaz virtual..."
if ! iw dev "$INTERFACE" interface add "$AP_INTERFACE" type __ap; then
    echo "Error crítico: No se pudo crear la interfaz."
    exit 1
fi

# 5. Bring up interface explicitly
ip link set "$AP_INTERFACE" up
sleep 1

# 6. Configure NetworkManager
echo "Configurando NetworkManager..."
nmcli con delete "$SSID" > /dev/null 2>&1

# Create connection FORCING the same channel AND band
if nmcli con add type wifi ifname "$AP_INTERFACE" con-name "$SSID" ssid "$SSID" mode ap ipv4.method shared wifi-sec.key-mgmt wpa-psk wifi-sec.psk "$PASSWORD" wifi.channel "$CHANNEL" wifi.band "$BAND"; then
    echo "Perfil creado (Canal $CHANNEL, Banda $BAND)."
else
    echo "Error al crear perfil."
    exit 1
fi

# 7. Activate
echo "Activando red..."
if nmcli con up "$SSID"; then
    echo ""
    echo "¡ÉXITO! Repetidor activo."
    echo "Conecta tus dispositivos a: $SSID"
else
    echo "Error al activar. Revisa si 'hostapd' se instaló correctamente."
    # Try restarting NM as last resort if failed? No, might break ssh/session.
    # ip link set "$AP_INTERFACE" down
    exit 1
fi
