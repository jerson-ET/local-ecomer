/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                          COMPONENTE: HEADER                                  */
/*                                                                              */
/*   Propósito     : Barra de navegación superior del sitio                     */
/*   Uso           : Se muestra en todas las páginas                            */
/*   Archivo       : components/layout/Header.tsx                               */
/*                                                                              */
/*   SECCIONES DEL HEADER:                                                      */
/*   1. Logo y nombre de la marca (izquierda)                                   */
/*   2. Navegación principal (centro)                                           */
/*   3. Barra de búsqueda (centro)                                              */
/*   4. Acciones del usuario (derecha)                                          */
/*      - Botón de notificaciones                                               */
/*      - Menú de usuario / Login                                               */
/*                                                                              */
/*   NOTA IMPORTANTE:                                                           */
/*   Este componente usa 'use client' porque tiene interactividad:              */
/*   - Estado para abrir/cerrar menú móvil                                      */
/*   - Efectos de hover y animaciones                                           */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              DIRECTIVA                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Esta directiva indica a Next.js que este componente se ejecuta en el        */
/* navegador del cliente, no en el servidor. Necesario para usar useState.     */
'use client'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                              IMPORTACIONES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Iconos de lucide-react - Biblioteca de iconos SV moderna                    */
import {
  Bell /* Icono de campana para notificaciones                      */,
  Menu /* Icono de hamburguesa para menú móvil                      */,
  Search /* Icono de lupa para búsqueda                               */,
  ShoppingBag /* Icono de bolsa de compras para el logo                    */,
  User /* Icono de usuario para login/perfil                        */,
  X /* Icono de X para cerrar menú móvil                         */,
} from 'lucide-react'

/* Componente Link de Next.js para navegación sin recargar la página           */
import Link from 'next/link'

/* Hook de React para manejar estado del componente                             */
import { useState } from 'react'

/* ─────────────────────────────────────────────────────────────────────────── */
/*                          DATOS ESTÁTICOS                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Interfaz que define la estructura de un enlace de navegación
 */
interface NavLink {
  label: string /* Texto que se muestra al usuario                          */
  href: string /* URL a la que apunta el enlace                            */
}

/**
 * Lista de enlaces de navegación principal
 * ──────────────────────────────────────────
 *
 * Estos enlaces aparecen en el menú de navegación tanto en
 * escritorio como en móvil.
 */
const navLinks: NavLink[] = [
  { label: 'Marketplace', href: '/marketplace' } /* Página de productos     */,
  { label: 'Tiendas', href: '/tiendas' } /* Lista de tiendas        */,
  { label: 'Ofertas', href: '/ofertas' } /* Productos con descuento */,
  { label: 'Comunidad', href: '/comunidad' } /* Foro/chat de la app     */,
]

/* ─────────────────────────────────────────────────────────────────────────── */
/*                       COMPONENTE PRINCIPAL                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Componente Header
 * ──────────────────
 *
 * Renderiza la barra de navegación superior con:
 * - Logo clickeable que lleva al inicio
 * - Menú de navegación (colapsable en móvil)
 * - Barra de búsqueda
 * - Acciones de usuario (notificaciones, login)
 *
 * @returns {JSX.Element} - Elemento header con navegación
 */
export default function Header() {
  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                              ESTADO                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /* Estado que controla si el menú móvil está abierto o cerrado              */
  /* - true:  El menú está visible                                            */
  /* - false: El menú está oculto                                             */
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                         FUNCIONES AUXILIARES                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /**
   * Alterna el estado del menú móvil
   * ──────────────────────────────────
   *
   * Si está abierto lo cierra, si está cerrado lo abre.
   * Se ejecuta cuando el usuario hace click en el botón de menú.
   */
  const toggleMenu = (): void => {
    setIsMenuOpen((previousState) => !previousState)
  }

  /**
   * Cierra el menú móvil
   * ─────────────────────
   *
   * Se ejecuta cuando el usuario hace click en un enlace del menú.
   * Esto asegura que el menú se cierre después de navegar.
   */
  const closeMenu = (): void => {
    setIsMenuOpen(false)
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                              RENDER                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    /* ─────────────────────────────────────────────────────────────────── */
    /*                      ELEMENTO HEADER PRINCIPAL                       */
    /* ─────────────────────────────────────────────────────────────────── */
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Contenedor con ancho máximo y padding                          */}
      <div className="container flex h-16 items-center justify-between">
        {/* ─────────────────────────────────────────────────────────── */}
        {/*                     SECCIÓN IZQUIERDA                       */}
        {/*                     Logo + Navegación                       */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6">
          {/* ═══════════════════════════════════════════════════════ */}
          {/*                        LOGO                             */}
          {/* ═══════════════════════════════════════════════════════ */}

          {/* Link que lleva a la página de inicio                    */}
          <Link href="/" className="flex items-center gap-2" aria-label="Ir al inicio">
            {/* Contenedor del icono con gradiente                  */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
              {/* Icono de bolsa de compras en blanco             */}
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>

            {/* Nombre de la marca con gradiente de texto           */}
            {/* Se oculta en pantallas muy pequeñas                 */}
            <span className="hidden text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent sm:inline-block">
              LocalEcomer
            </span>
          </Link>

          {/* ═══════════════════════════════════════════════════════ */}
          {/*              NAVEGACIÓN DESKTOP                         */}
          {/* ═══════════════════════════════════════════════════════ */}

          {/* Navegación visible solo en pantallas grandes (lg+)      */}
          <nav
            className="hidden lg:flex lg:items-center lg:gap-6"
            aria-label="Navegación principal"
          >
            {/* Iterar sobre los enlaces de navegación              */}
            {navLinks.map((link: NavLink) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground-secondary transition-colors hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/*                     SECCIÓN DERECHA                         */}
        {/*            Búsqueda + Notificaciones + Usuario              */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {/* ═══════════════════════════════════════════════════════ */}
          {/*                   BARRA DE BÚSQUEDA                     */}
          {/* ═══════════════════════════════════════════════════════ */}

          {/* Visible solo en pantallas medianas y grandes (md+)      */}
          <div className="hidden md:flex md:w-64 lg:w-80">
            {/* Contenedor relativo para posicionar el icono        */}
            <div className="relative w-full">
              {/* Icono de búsqueda posicionado adentro del input */}
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />

              {/* Campo de texto para búsqueda                    */}
              <input
                type="search"
                placeholder="Buscar productos..."
                className="w-full rounded-full border border-border bg-background-secondary py-2 pl-10 pr-4 text-sm placeholder:text-foreground-secondary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                aria-label="Buscar productos"
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/*                 BOTÓN DE NOTIFICACIONES                 */}
          {/* ═══════════════════════════════════════════════════════ */}

          <button
            type="button"
            className="relative rounded-full p-2 text-foreground-secondary transition-colors hover:bg-background-secondary hover:text-foreground"
            aria-label="Ver notificaciones"
          >
            {/* Icono de campana                                    */}
            <Bell className="h-5 w-5" />

            {/* Indicador de notificación no leída (punto rojo)     */}
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-secondary-500" />
          </button>

          {/* ═══════════════════════════════════════════════════════ */}
          {/*               BOTÓN DE LOGIN / USUARIO                  */}
          {/* ═══════════════════════════════════════════════════════ */}

          {/* Link que lleva a la página de login                     */}
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30"
          >
            {/* Icono de usuario                                    */}
            <User className="h-4 w-4" />

            {/* Texto del botón                                     */}
            <span>Entrar</span>
          </Link>

          {/* ═══════════════════════════════════════════════════════ */}
          {/*                BOTÓN DE MENÚ MÓVIL                      */}
          {/* ═══════════════════════════════════════════════════════ */}

          {/* Visible solo en pantallas pequeñas (hasta lg)           */}
          <button
            type="button"
            onClick={toggleMenu}
            className="rounded-full p-2 text-foreground-secondary transition-colors hover:bg-background-secondary hover:text-foreground lg:hidden"
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
          >
            {/* Mostrar X si está abierto, hamburguesa si cerrado   */}
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*                      MENÚ MÓVIL                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Se muestra solo cuando isMenuOpen es true                       */}
      {/* Y solo en pantallas pequeñas (hasta lg)                         */}
      {isMenuOpen && (
        <div className="border-t border-border lg:hidden">
          {/* Contenedor del menú con padding                         */}
          <div className="container py-4">
            {/* ─────────────────────────────────────────────────── */}
            {/*            BÚSQUEDA EN MÓVIL                        */}
            {/* ─────────────────────────────────────────────────── */}

            {/* Visible solo en pantallas pequeñas (hasta md)       */}
            <div className="mb-4 md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
                <input
                  type="search"
                  placeholder="Buscar productos..."
                  className="w-full rounded-full border border-border bg-background-secondary py-2 pl-10 pr-4 text-sm placeholder:text-foreground-secondary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  aria-label="Buscar productos"
                />
              </div>
            </div>

            {/* ─────────────────────────────────────────────────── */}
            {/*         ENLACES DE NAVEGACIÓN MÓVIL                 */}
            {/* ─────────────────────────────────────────────────── */}

            <nav className="flex flex-col space-y-2" aria-label="Navegación móvil">
              {/* Iterar sobre los enlaces de navegación          */}
              {navLinks.map((link: NavLink) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-lg px-4 py-2 text-foreground-secondary transition-colors hover:bg-background-secondary hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}

              {/* Separador visual                                */}
              <hr className="my-2 border-border" />

              {/* Enlace de login para móvil                      */}
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-all hover:bg-primary-700"
              >
                <User className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   PRÓXIMOS PASOS:                                                            */
/*   - Agregar dropdown de usuario cuando esté logueado                         */
/*   - Integrar con Supabase para mostrar estado de autenticación               */
/*   - Agregar contador de notificaciones no leídas                             */
/*   - Implementar búsqueda funcional con resultados                            */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
