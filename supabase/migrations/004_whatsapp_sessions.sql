-- Tabla para almacenar las sesiones de WhatsApp (Baileys)
-- Permite persistencia en entornos serverless como Vercel

CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    session_id text NOT NULL,
    key_id text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (session_id, key_id)
);

-- Habilitar RLS pero restringir acceso (se usará service_role desde la API)
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Política para que solo el rol de servicio pueda leer/escribir (seguridad extra)
CREATE POLICY "Service role can do everything" ON public.whatsapp_sessions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON public.whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_sessions_updated_at();
