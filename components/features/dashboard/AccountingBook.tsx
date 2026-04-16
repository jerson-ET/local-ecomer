import React from 'react'
import { BookOpen, AlertCircle } from 'lucide-react'

export const AccountingBook: React.FC = () => {
  return (
    <div style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}>
          <BookOpen size={32} color="white" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>Cuaderno de Contabilidad</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Gestiona tus ingresos y gastos fácilmente</p>
      </div>

      <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 20, padding: '40px 20px', textAlign: 'center', marginTop: 32 }}>
        <AlertCircle size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Módulo en Construcción</h3>
        <p style={{ color: '#64748b', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>
          Próximamente podrás registrar todas tus ventas, gastos operativos y calcular tus ganancias netas automáticamente desde este cuaderno digital.
        </p>
      </div>
    </div>
  )
}
