#!/bin/bash
# Cargar variables desde .env.local
# Extraer URL y KEY de .env.local manualmente si source falla con Bash estricto
URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

# Quitar espacios y retornos de carro
URL=$(echo $URL | tr -d '\r')
KEY=$(echo $KEY | tr -d '\r')

echo "Consultando Supabase en: $URL"

# Hacer la petición y buscar correos
curl -X GET "$URL/auth/v1/admin/users" \
     -H "apikey: $KEY" \
     -H "Authorization: Bearer $KEY" \
     -s | grep -oE '"email":"[^"]+"' | cut -d'"' -f4
