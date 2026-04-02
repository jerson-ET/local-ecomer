import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — LocalEcomer',
  description: 'Política de privacidad y protección de datos personales de LocalEcomer. Cumplimiento Ley 1581 de 2012.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-indigo-600 font-bold mb-8 block">← Volver al inicio</Link>
        
        <h1 className="text-3xl font-black mb-8">Política de Privacidad</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: Abril 2026 — En cumplimiento de la Ley 1581 de 2012</p>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-600 leading-relaxed">
          <h2 className="text-xl font-bold text-[#111]">1. Responsable del Tratamiento</h2>
          <p>LocalEcomer, plataforma digital de comercio electrónico registrada ante la DIAN bajo el régimen simplificado, con domicilio en Bogotá D.C., Colombia, es el responsable del tratamiento de los datos personales recopilados a través de la plataforma.</p>

          <h2 className="text-xl font-bold text-[#111]">2. Datos que Recopilamos</h2>
          <p>Recopilamos los siguientes tipos de datos: (a) <strong>Datos de identificación:</strong> nombre completo, tipo y número de documento de identidad, correo electrónico; (b) <strong>Datos de contacto:</strong> número de WhatsApp, ciudad, país; (c) <strong>Datos comerciales:</strong> información de tienda, productos, transacciones; (d) <strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, navegador utilizado.</p>

          <h2 className="text-xl font-bold text-[#111]">3. Finalidad del Tratamiento</h2>
          <p>Sus datos personales son tratados con las siguientes finalidades: prestación del servicio de marketplace, gestión de cuenta de usuario, facturación y cobros, comunicaciones relacionadas con el servicio, mejoramiento de la plataforma, cumplimiento de obligaciones legales y tributarias.</p>

          <h2 className="text-xl font-bold text-[#111]">4. Derechos del Titular (ARCO)</h2>
          <p>De conformidad con la Ley 1581 de 2012, usted tiene derecho a: <strong>Acceder</strong> a sus datos personales, <strong>Rectificar</strong> información inexacta o incompleta, <strong>Cancelar</strong> o solicitar la supresión de sus datos, y <strong>Oponerse</strong> al tratamiento de sus datos. Para ejercer estos derechos, envíe su solicitud a soporte@localecomer.com.</p>

          <h2 className="text-xl font-bold text-[#111]">5. Seguridad de la Información</h2>
          <p>Implementamos medidas técnicas y organizativas para proteger sus datos personales contra acceso no autorizado, pérdida o alteración. Utilizamos encriptación SSL/TLS, almacenamiento seguro en servidores de Supabase, y acceso restringido a la información.</p>

          <h2 className="text-xl font-bold text-[#111]">6. Transferencia de Datos</h2>
          <p>Sus datos pueden ser almacenados en servidores ubicados fuera de Colombia (servicios cloud), cumpliendo con las garantías exigidas por la Superintendencia de Industria y Comercio para transferencias internacionales de datos.</p>

          <h2 className="text-xl font-bold text-[#111]">7. Conservación de Datos</h2>
          <p>Los datos personales se conservarán durante el tiempo necesario para cumplir con las finalidades descritas y con las obligaciones legales aplicables. Una vez cumplida la finalidad, los datos serán eliminados de forma segura.</p>

          <h2 className="text-xl font-bold text-[#111]">8. Cambios en la Política</h2>
          <p>Nos reservamos el derecho de modificar esta política en cualquier momento. Los cambios serán notificados a través de la plataforma. El uso continuado después de las modificaciones constituye la aceptación de las mismas.</p>

          <h2 className="text-xl font-bold text-[#111]">9. Autoridad de Protección de Datos</h2>
          <p>Si considera que sus derechos no han sido atendidos adecuadamente, puede presentar una queja ante la Superintendencia de Industria y Comercio (SIC) de Colombia — www.sic.gov.co.</p>
        </div>
      </div>
    </div>
  )
}
