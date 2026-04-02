/* ═══════════════════════════════════════════════════════════════════════════ */
/*  UTILIDADES DE FORMATO — LocalEcomer                                       */
/*  Solo funciones puras reutilizables. Sin datos estáticos.                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Formatea precio en COP con separadores de miles colombianos */
export function formatCOP(price: number): string {
  return (
    '$' +
    Math.round(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  )
}
