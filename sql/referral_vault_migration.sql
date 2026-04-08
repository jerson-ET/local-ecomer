-- Ejecutar esto en el panel SQL de Supabase

-- Crear la tabla para la bodega de códigos
CREATE TABLE IF NOT EXISTS referral_codes (
    code VARCHAR(5) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'blocked')),
    assigned_at TIMESTAMP WITH TIME ZONE
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_email ON referral_codes(email);
CREATE INDEX IF NOT EXISTS idx_referral_codes_status ON referral_codes(status);
