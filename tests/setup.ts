/**
 * ============================================
 * SETUP DE TESTS
 * ============================================
 *
 * Este archivo se ejecuta ANTES de cada test.
 * Configura el entorno de pruebas.
 *
 * ============================================
 */

/* Extender expect con matchers de Testing Library */
import '@testing-library/jest-dom/vitest'

/* Limpiar mocks después de cada test */
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/* ==========================================
 * CLEANUP AUTOMÁTICO
 * ==========================================
 * Limpia el DOM después de cada test
 */
afterEach(() => {
  cleanup()
})

/* ==========================================
 * MOCKS GLOBALES
 * ========================================== */

/**
 * Mock de ResizeObserver (no existe en jsdom)
 */
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

/**
 * Mock de IntersectionObserver (no existe en jsdom)
 */
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

/**
 * Mock de matchMedia (para tests de responsive)
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

/**
 * Mock de scrollTo (no existe en jsdom)
 */
window.scrollTo = vi.fn()

/**
 * Mock de localStorage
 */
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

/* ==========================================
 * MOCK DE NEXT.JS
 * ========================================== */

/**
 * Mock del router de Next.js
 */
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

/**
 * Mock de next/image
 */
vi.mock('next/image', () => ({
  default: function MockImage(props: { src: string; alt: string; [key: string]: unknown }) {
    return `<img src="${props.src}" alt="${props.alt}" />`
  },
}))

/* ==========================================
 * VARIABLES DE ENTORNO PARA TESTS
 * ========================================== */

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
