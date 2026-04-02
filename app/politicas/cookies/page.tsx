import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies — LocalEcomer',
  description: 'Política de cookies de LocalEcomer. Información sobre el uso de cookies y tecnologías similares.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-indigo-600 font-bold mb-8 block">← Volver al inicio</Link>
        
        <h1 className="text-3xl font-black mb-8">Política de Cookies</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: Abril 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-600 leading-relaxed">
          <h2 className="text-xl font-bold text-[#111]">1. ¿Qué son las Cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestra plataforma. Nos ayudan a mejorar su experiencia de navegación y a mantener su sesión activa.</p>

          <h2 className="text-xl font-bold text-[#111]">2. Tipos de Cookies que Utilizamos</h2>
          <p><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento de la plataforma, como la autenticación y la seguridad de la sesión. <strong>Cookies de rendimiento:</strong> Nos ayudan a entender cómo los usuarios interactúan con la plataforma para mejorar el servicio. <strong>Cookies de funcionalidad:</strong> Permiten recordar sus preferencias y personalización.</p>

          <h2 className="text-xl font-bold text-[#111]">3. Service Workers y Cache</h2>
          <p>Como aplicación web progresiva (PWA), LocalEcomer utiliza Service Workers y tecnologías de cache para permitir el funcionamiento offline y mejorar la velocidad de carga. Puede limpiar estos datos desde el botón de recarga disponible en la aplicación.</p>

          <h2 className="text-xl font-bold text-[#111]">4. Control de Cookies</h2>
          <p>Puede configurar su navegador para rechazar cookies o eliminar las existentes. Tenga en cuenta que deshabilitar cookies puede afectar la funcionalidad de la plataforma.</p>
        </div>
      </div>
    </div>
  )
}
