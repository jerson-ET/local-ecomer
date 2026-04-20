/* ═══════════════════════════════════════════════════════════════════════════ */
/*  UTILIDADES DE FORMATO — LocalEcomer                                       */
/*  Solo funciones puras reutilizables. Sin datos estáticos.                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CURRENCY_SYMBOLS: Record<string, string> = {
  COP: '$', USD: '$', EUR: '€', ARS: '$', MXN: '$', BRL: 'R$',
  CLP: '$', PEN: 'S/', BOB: 'Bs', UYU: '$', PYG: '₲', VES: 'Bs',
  CNY: '¥', GBP: '£', JPY: '¥',
}

/** Monedas que NO usan decimales (valores grandes) */
const NO_DECIMAL_CURRENCIES = new Set(['COP', 'ARS', 'CLP', 'PYG', 'VES', 'JPY'])

/** Formatea precio con símbolo y código de moneda */
export function formatPrice(price: number, currency?: string): string {
  const code = currency || 'COP'
  const symbol = CURRENCY_SYMBOLS[code] || '$'
  
  if (NO_DECIMAL_CURRENCIES.has(code)) {
    // Sin decimales, con separador de miles
    const formatted = Math.round(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${symbol}${formatted} ${code}`
  } else {
    // Con 2 decimales
    const [intPart, decPart] = price.toFixed(2).split('.')
    const formattedInt = (intPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${symbol}${formattedInt},${decPart} ${code}`
  }
}

/** Formatea precio en COP con separadores de miles colombianos (legacy) */
export function formatCOP(price: number): string {
  return (
    '$' +
    Math.round(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  )
}
