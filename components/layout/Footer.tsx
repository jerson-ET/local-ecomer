/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                                                              */
/*                          COMPONENTE: FOOTER                                  */
/*                                                                              */
/*   Propósito     : Pie de página del sitio web                                */
/*   Uso           : Se muestra en todas las páginas                            */
/*   Archivo       : components/layout/Footer.tsx                               */
/*                                                                              */
/*   SECCIONES DEL FOOTER:                                                      */
/*   1. Información de la marca y contacto (columna izquierda)                  */
/*   2. Links organizados por categoría (columnas centrales)                    */
/*   3. Redes sociales                                                          */
/*   4. Barra inferior con copyright                                            */
/*                                                                              */
/*   NOTA IMPORTANTE:                                                           */
/*   Este componente NO usa 'use client' porque es completamente                */
/*   estático - no tiene estado ni interactividad que requiera                  */
/*   ejecución en el cliente.                                                   */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              IMPORTACIONES                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Iconos de lucide-react - Biblioteca moderna de iconos SVG                   */
import {
    Facebook,      /* Icono de Facebook para redes sociales                     */
    Instagram,     /* Icono de Instagram para redes sociales                    */
    Mail,          /* Icono de sobre para email de contacto                     */
    MapPin,        /* Icono de pin para ubicación                               */
    Phone,         /* Icono de teléfono para contacto                           */
    ShoppingBag,   /* Icono del logo de la aplicación                           */
    Twitter,       /* Icono de Twitter para redes sociales                      */
    Youtube,       /* Icono de Youtube para redes sociales                      */
} from 'lucide-react'

/* Componente Link de Next.js para navegación sin recargar página              */
import Link from 'next/link'


/* ─────────────────────────────────────────────────────────────────────────── */
/*                              INTERFACES                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Interfaz para los enlaces del footer
 * ──────────────────────────────────────
 * 
 * Define la estructura de cada enlace que
 * aparece en las columnas del footer.
 */
interface FooterLink {
    label: string   /* Texto que ve el usuario                                  */
    href: string   /* URL a la que apunta el enlace                            */
}

/**
 * Interfaz para los iconos de redes sociales
 * ────────────────────────────────────────────
 * 
 * Define la estructura de cada enlace de red social
 * con su icono correspondiente.
 */
interface SocialLink {
    icon: React.ComponentType<{ className?: string }>  /* Componente de icono  */
    href: string   /* URL de la red social                                     */
    label: string   /* Etiqueta para accesibilidad (aria-label)                 */
}


/* ─────────────────────────────────────────────────────────────────────────── */
/*                           DATOS ESTÁTICOS                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Enlaces del footer organizados por categoría
 * ─────────────────────────────────────────────
 * 
 * Cada categoría agrupa enlaces relacionados para
 * facilitar la navegación del usuario.
 */
const footerLinks = {

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ENLACES DEL MARKETPLACE                               */
    /* ═══════════════════════════════════════════════════════════════════════ */

    /* Enlaces para compradores del marketplace                                  */
    marketplace: [
        { label: 'Todas las Tiendas', href: '/tiendas' },
        { label: 'Ofertas del Día', href: '/marketplace?filter=ofertas' },
        { label: 'Nuevos Productos', href: '/marketplace?filter=nuevos' },
        { label: 'Categorías', href: '/categorias' },
    ],

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ENLACES PARA VENDEDORES                               */
    /* ═══════════════════════════════════════════════════════════════════════ */

    /* Enlaces de información para vendedores actuales y potenciales            */
    vendedores: [
        { label: 'Crear Tienda', href: '/register' },
        { label: 'Planes y Precios', href: '/planes' },
        { label: 'Centro de Ayuda', href: '/ayuda' },
        { label: 'Publicidad', href: '/publicidad' },
    ],

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ENLACES DE LA COMUNIDAD                               */
    /* ═══════════════════════════════════════════════════════════════════════ */

    /* Enlaces a las secciones de comunidad de la plataforma                    */
    comunidad: [
        { label: 'Foro General', href: '/comunidad' },
        { label: 'Tips de Ventas', href: '/comunidad/tips' },
        { label: 'Eventos', href: '/eventos' },
        { label: 'Blog', href: '/blog' },
    ],

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                    ENLACES DE LA EMPRESA                                  */
    /* ═══════════════════════════════════════════════════════════════════════ */

    /* Enlaces con información institucional y legal                            */
    empresa: [
        { label: 'Sobre Nosotros', href: '/nosotros' },
        { label: 'Términos de Uso', href: '/terminos' },
        { label: 'Privacidad', href: '/privacidad' },
        { label: 'Contacto', href: '/contacto' },
    ],

} as const satisfies Record<string, readonly FooterLink[]>

/**
 * Enlaces de redes sociales
 * ──────────────────────────
 * 
 * Cada red social tiene un icono, URL y etiqueta para accesibilidad.
 * Los enlaces se abren en una nueva pestaña.
 */
const socialLinks: SocialLink[] = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com', label: 'Youtube' },
]


/* ─────────────────────────────────────────────────────────────────────────── */
/*                       COMPONENTE PRINCIPAL                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Componente Footer
 * ──────────────────
 * 
 * Renderiza el pie de página del sitio con:
 * - Logo y descripción de la empresa
 * - Información de contacto
 * - Grid de enlaces organizados por categoría
 * - Redes sociales
 * - Barra inferior con copyright
 * 
 * @returns {JSX.Element} - Elemento footer con toda la información
 */
export default function Footer() {

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                         VARIABLES LOCALES                                */
    /* ═══════════════════════════════════════════════════════════════════════ */

    /* Obtener el año actual para el texto de copyright                         */
    /* Esto hace que el año se actualice automáticamente cada año               */
    const currentYear = new Date().getFullYear()


    /* ═══════════════════════════════════════════════════════════════════════ */
    /*                              RENDER                                      */
    /* ═══════════════════════════════════════════════════════════════════════ */

    return (
        /* ─────────────────────────────────────────────────────────────────── */
        /*                    ELEMENTO FOOTER PRINCIPAL                         */
        /* ─────────────────────────────────────────────────────────────────── */
        <footer className="border-t border-border bg-background-secondary">

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*                    SECCIÓN PRINCIPAL                            */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* Grid responsive que cambia de columnas según el tamaño:         */}
            {/* - Móvil (default): 2 columnas                                    */}
            {/* - Tablet (md):     3 columnas                                    */}
            {/* - Desktop (lg):    6 columnas                                    */}
            <div className="container py-12">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">

                    {/* ─────────────────────────────────────────────────────── */}
                    {/*              COLUMNA DE MARCA Y CONTACTO                */}
                    {/* ─────────────────────────────────────────────────────── */}

                    {/* Esta columna ocupa más espacio que las demás             */}
                    {/* - Móvil:   2 columnas (ancho completo)                   */}
                    {/* - Tablet:  3 columnas (ancho completo)                   */}
                    {/* - Desktop: 2 columnas                                    */}
                    <div className="col-span-2 md:col-span-3 lg:col-span-2">

                        {/* ═══════════════════════════════════════════════════ */}
                        {/*                       LOGO                          */}
                        {/* ═══════════════════════════════════════════════════ */}

                        <Link href="/" className="flex items-center gap-2">

                            {/* Contenedor del icono con gradiente              */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
                                <ShoppingBag className="h-5 w-5 text-white" />
                            </div>

                            {/* Nombre de la marca con gradiente                */}
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                                LocalEcomer
                            </span>
                        </Link>

                        {/* ═══════════════════════════════════════════════════ */}
                        {/*              DESCRIPCIÓN DE LA EMPRESA              */}
                        {/* ═══════════════════════════════════════════════════ */}

                        <p className="mt-4 text-sm text-foreground-secondary max-w-xs">
                            El centro comercial digital más grande. Conectamos vendedores
                            con compradores en una comunidad vibrante.
                        </p>

                        {/* ═══════════════════════════════════════════════════ */}
                        {/*              INFORMACIÓN DE CONTACTO                */}
                        {/* ═══════════════════════════════════════════════════ */}

                        <div className="mt-6 space-y-2">

                            {/* Email de contacto - clickeable con mailto:      */}
                            <a
                                href="mailto:soporte@localecomer.com"
                                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-primary-600 transition-colors"
                            >
                                <Mail className="h-4 w-4" />
                                soporte@localecomer.com
                            </a>

                            {/* Teléfono - clickeable con tel:                  */}
                            <a
                                href="tel:+573001234567"
                                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-primary-600 transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                                +57 300 123 4567
                            </a>

                            {/* Ubicación - solo texto informativo              */}
                            <p className="flex items-center gap-2 text-sm text-foreground-secondary">
                                <MapPin className="h-4 w-4" />
                                Colombia
                            </p>
                        </div>

                        {/* ═══════════════════════════════════════════════════ */}
                        {/*                   REDES SOCIALES                    */}
                        {/* ═══════════════════════════════════════════════════ */}

                        <div className="mt-6 flex gap-3">

                            {/* Iterar sobre los enlaces de redes sociales      */}
                            {socialLinks.map((social: SocialLink) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-foreground-secondary transition-all hover:bg-primary-500 hover:text-white hover:shadow-lg hover:shadow-primary-500/30"
                                >
                                    {/* Renderizar el componente de icono       */}
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* ─────────────────────────────────────────────────────── */}
                    {/*              COLUMNA: MARKETPLACE                       */}
                    {/* ─────────────────────────────────────────────────────── */}

                    <div>
                        {/* Título de la sección                                */}
                        <h3 className="font-semibold text-foreground mb-4">
                            Marketplace
                        </h3>

                        {/* Lista de enlaces                                    */}
                        <ul className="space-y-2">
                            {footerLinks.marketplace.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-foreground-secondary transition-colors hover:text-primary-600"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ─────────────────────────────────────────────────────── */}
                    {/*              COLUMNA: VENDEDORES                        */}
                    {/* ─────────────────────────────────────────────────────── */}

                    <div>
                        {/* Título de la sección                                */}
                        <h3 className="font-semibold text-foreground mb-4">
                            Vendedores
                        </h3>

                        {/* Lista de enlaces                                    */}
                        <ul className="space-y-2">
                            {footerLinks.vendedores.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-foreground-secondary transition-colors hover:text-primary-600"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ─────────────────────────────────────────────────────── */}
                    {/*              COLUMNA: COMUNIDAD                         */}
                    {/* ─────────────────────────────────────────────────────── */}

                    <div>
                        {/* Título de la sección                                */}
                        <h3 className="font-semibold text-foreground mb-4">
                            Comunidad
                        </h3>

                        {/* Lista de enlaces                                    */}
                        <ul className="space-y-2">
                            {footerLinks.comunidad.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-foreground-secondary transition-colors hover:text-primary-600"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ─────────────────────────────────────────────────────── */}
                    {/*              COLUMNA: EMPRESA                           */}
                    {/* ─────────────────────────────────────────────────────── */}

                    <div>
                        {/* Título de la sección                                */}
                        <h3 className="font-semibold text-foreground mb-4">
                            Empresa
                        </h3>

                        {/* Lista de enlaces                                    */}
                        <ul className="space-y-2">
                            {footerLinks.empresa.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-foreground-secondary transition-colors hover:text-primary-600"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*                       BARRA INFERIOR                            */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* Contiene copyright y enlaces legales                            */}
            <div className="border-t border-border">
                <div className="container py-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">

                        {/* ─────────────────────────────────────────────────── */}
                        {/*                 TEXTO DE COPYRIGHT                  */}
                        {/* ─────────────────────────────────────────────────── */}

                        <p className="text-sm text-foreground-secondary">
                            © {currentYear} LocalEcomer. Todos los derechos reservados.
                        </p>

                        {/* ─────────────────────────────────────────────────── */}
                        {/*                   ENLACES LEGALES                   */}
                        {/* ─────────────────────────────────────────────────── */}

                        <div className="flex items-center gap-6">

                            {/* Enlace a Términos y condiciones                 */}
                            <Link
                                href="/terminos"
                                className="text-sm text-foreground-secondary hover:text-primary-600 transition-colors"
                            >
                                Términos
                            </Link>

                            {/* Enlace a Política de privacidad                 */}
                            <Link
                                href="/privacidad"
                                className="text-sm text-foreground-secondary hover:text-primary-600 transition-colors"
                            >
                                Privacidad
                            </Link>

                            {/* Enlace a Política de cookies                    */}
                            <Link
                                href="/cookies"
                                className="text-sm text-foreground-secondary hover:text-primary-600 transition-colors"
                            >
                                Cookies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FIN DEL ARCHIVO                                   */
/*                                                                              */
/*   PRÓXIMOS PASOS:                                                            */
/*   - Agregar formulario de suscripción a newsletter                           */
/*   - Agregar mapa de ubicación (cuando haya oficina física)                   */
/*   - Agregar selector de idioma (si la app es multilenguaje)                  */
/*   - Agregar badge de "Hecho con ❤️ en Colombia"                              */
/*                                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
