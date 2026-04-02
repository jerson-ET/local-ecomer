import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tratamiento de Datos Personales — LocalEcomer',
  description: 'Política de tratamiento de datos personales de LocalEcomer según la Ley 1581 de 2012 y Decreto 1377 de 2013.',
}

export default function DatosPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-indigo-600 font-bold mb-8 block">← Volver al inicio</Link>
        
        <h1 className="text-3xl font-black mb-8">Política de Tratamiento de Datos Personales</h1>
        <p className="text-sm text-gray-500 mb-8">En cumplimiento de la Ley 1581 de 2012 y el Decreto Reglamentario 1377 de 2013</p>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-600 leading-relaxed">
          <h2 className="text-xl font-bold text-[#111]">1. Identificación del Responsable</h2>
          <p><strong>Razón Social:</strong> LocalEcomer — Plataforma de Comercio Electrónico<br/>
          <strong>Domicilio:</strong> Bogotá D.C., Colombia<br/>
          <strong>Correo:</strong> soporte@localecomer.com<br/>
          <strong>Registro:</strong> Plataforma registrada ante la DIAN — Régimen Simple de Tributación</p>

          <h2 className="text-xl font-bold text-[#111]">2. Marco Legal</h2>
          <p>Esta política se rige por: la Constitución Política de Colombia (Art. 15), la Ley 1581 de 2012 (Protección de Datos Personales), el Decreto 1377 de 2013 (Reglamentario), y la Ley 527 de 1999 (Comercio Electrónico).</p>

          <h2 className="text-xl font-bold text-[#111]">3. Principios del Tratamiento</h2>
          <p>El tratamiento de datos personales se realiza bajo los principios de: <strong>Legalidad</strong> (actividad reglada), <strong>Finalidad</strong> (propósito legítimo), <strong>Libertad</strong> (consentimiento previo), <strong>Veracidad</strong> (información real), <strong>Transparencia</strong> (acceso a información), <strong>Seguridad</strong> (medidas técnicas), y <strong>Confidencialidad</strong> (reserva de información).</p>

          <h2 className="text-xl font-bold text-[#111]">4. Autorización</h2>
          <p>Al registrarse en LocalEcomer, el usuario otorga su autorización previa, expresa e informada para el tratamiento de sus datos personales conforme a esta política. Esta autorización puede ser revocada en cualquier momento mediante solicitud escrita.</p>

          <h2 className="text-xl font-bold text-[#111]">5. Canales de Atención</h2>
          <p>Para ejercer sus derechos como titular de datos personales, solicitar información o presentar reclamos, puede comunicarse a través de: correo electrónico soporte@localecomer.com o a través de nuestro canal de WhatsApp de soporte.</p>

          <h2 className="text-xl font-bold text-[#111]">6. Vigencia</h2>
          <p>Esta política entra en vigencia desde su publicación y permanecerá vigente mientras la plataforma se encuentre en operación. Las bases de datos serán mantenidas durante el tiempo necesario para cumplir las finalidades del tratamiento.</p>
        </div>
      </div>
    </div>
  )
}
