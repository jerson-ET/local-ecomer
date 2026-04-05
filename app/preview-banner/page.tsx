'use client'

import { ProductListSection } from '@/components/features/dashboard/ProductManager'

export default function Preview() {
  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <ProductListSection storeId="temp" onBack={() => {}} onAddProduct={() => {}} />
    </div>
  )
}
