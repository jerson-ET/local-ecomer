#!/bin/bash
# Cargar variables desde .env.local
set -a
source .env.local
set +a

# Endpoint de Supabase para listar usuarios
URL="${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users"

# Hacer la petición con curl
# Se requiere la SERVICE_ROLE_KEY
curl -X GET "$URL" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -s | jq -r '.users[].email'
