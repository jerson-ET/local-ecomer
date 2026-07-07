-- Eliminar la restricción UNIQUE del código de referido en la tabla referrals
-- Esto es necesario porque el ref_code identifica AL INVITADOR, no a una invitación única.
-- Un mismo código puede aparecer múltiples veces (una por cada persona invitada).
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_ref_code_key;

-- Añadir un índice para hacer las búsquedas por ref_code más rápidas
CREATE INDEX IF NOT EXISTS idx_referrals_ref_code ON public.referrals(ref_code);
