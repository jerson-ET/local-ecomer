-- ═══════════════════════════════════════════════════════════════════════════
-- TABLA: email_verification_codes
-- Almacena los códigos OTP enviados por email (Gmail SMTP)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'registration',  -- 'registration' o 'recovery'
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_verification_codes (email);
CREATE INDEX IF NOT EXISTS idx_email_codes_lookup ON email_verification_codes (email, code, used);

-- RLS: Habilitar Row Level Security
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Solo el servicio (service_role) puede acceder
-- Los usuarios normales NO pueden ver/editar códigos directamente
CREATE POLICY "Service role full access" ON email_verification_codes
    FOR ALL
    USING (auth.role() = 'service_role');

-- Limpieza automática: eliminar códigos expirados cada hora (opcional)
-- Esto se puede hacer con pg_cron si está habilitado, o desde la app:
-- DELETE FROM email_verification_codes WHERE expires_at < NOW() - INTERVAL '1 day';

-- ═══════════════════════════════════════════════════════════════════════════
-- Si la tabla profiles no tiene la columna email_verified, agregarla:
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;
