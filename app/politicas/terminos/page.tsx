import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — LocalEcomer',
  description: 'Términos y condiciones de uso de la plataforma LocalEcomer. Marketplace colombiano.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-indigo-600 font-bold mb-8 block">← Volver al inicio</Link>
        
        <h1 className="text-3xl font-black mb-8">Términos y Condiciones de Uso</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: Abril 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-600 leading-relaxed">
          <h2 className="text-xl font-bold text-[#111]">1. Aceptación de los Términos</h2>
          <p>Al acceder y utilizar la plataforma LocalEcomer (en adelante "la Plataforma"), usted acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, le solicitamos no hacer uso de nuestros servicios.</p>

          <h2 className="text-xl font-bold text-[#111]">2. Descripción del Servicio</h2>
          <p>LocalEcomer es una plataforma digital de comercio electrónico tipo marketplace que permite a emprendedores y comerciantes colombianos crear catálogos digitales de productos, gestionar inventarios y conectar con compradores potenciales a través de enlaces directos y WhatsApp.</p>

          <h2 className="text-xl font-bold text-[#111]">3. Registro y Cuentas</h2>
          <p>Para utilizar los servicios de vendedor, el usuario debe registrarse proporcionando información verídica y actualizada. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. LocalEcomer ofrece un periodo de prueba gratuito de 7 días calendario, después del cual aplica una tarifa mensual de $35.000 COP.</p>

          <h2 className="text-xl font-bold text-[#111]">4. Obligaciones del Vendedor</h2>
          <p>Los vendedores se comprometen a: (a) Publicar productos legales y que cumplan con la normatividad colombiana vigente; (b) Proporcionar información veraz sobre sus productos incluyendo precios, descripciones y fotografías reales; (c) Cumplir con las obligaciones tributarias ante la DIAN según corresponda; (d) Respetar los derechos de propiedad intelectual de terceros.</p>

          <h2 className="text-xl font-bold text-[#111]">5. Responsabilidades de la Plataforma</h2>
          <p>LocalEcomer actúa como intermediario tecnológico y no es responsable por: las transacciones realizadas entre compradores y vendedores, la calidad o estado de los productos, los tiempos ni condiciones de envío, ni por disputas comerciales entre las partes. La plataforma se compromete a mantener la disponibilidad del servicio y proteger la información de los usuarios.</p>

          <h2 className="text-xl font-bold text-[#111]">6. Propiedad Intelectual</h2>
          <p>Todo el contenido de la plataforma (diseño, código, logotipos, textos) es propiedad de LocalEcomer y está protegido por las leyes colombianas de propiedad intelectual. Los vendedores conservan los derechos sobre sus contenidos publicados.</p>

          <h2 className="text-xl font-bold text-[#111]">7. Pagos y Suscripción</h2>
          <p>La suscripción mensual de $35.000 COP se cobra después de los 7 días de prueba. Los pagos se realizan a través de los medios habilitados (Nequi, transferencia bancaria). En caso de no renovación, la tienda será suspendida temporalmente hasta que se realice el pago correspondiente.</p>

          <h2 className="text-xl font-bold text-[#111]">8. Programa de Referidos</h2>
          <p>Los usuarios pueden participar en el programa de referidos recomendando nuevos vendedores. Las comisiones se acreditan según las condiciones vigentes del programa y están sujetas a verificación por parte de la administración.</p>

          <h2 className="text-xl font-bold text-[#111]">9. Cancelación y Terminación</h2>
          <p>El usuario puede solicitar la cancelación de su cuenta en cualquier momento. LocalEcomer se reserva el derecho de suspender o cancelar cuentas que violen estos términos, publiquen contenido ilegal o realicen prácticas desleales.</p>

          <h2 className="text-xl font-bold text-[#111]">10. Ley Aplicable</h2>
          <p>Estos términos se rigen por las leyes de la República de Colombia. Para la resolución de controversias, las partes se someten a la jurisdicción de los tribunales de Bogotá D.C., Colombia.</p>
          
          <h2 className="text-xl font-bold text-[#111]">11. Contacto</h2>
          <p>Para consultas relacionadas con estos términos, puede contactarnos a través de soporte@localecomer.com o por nuestro canal de WhatsApp.</p>
        </div>
      </div>
    </div>
  )
}
