'use client'

import SwipeDeck from '@/components/features/swipe-shop/SwipeDeck'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center relative">
      <Link
        href="/"
        className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50 backdrop-blur-md"
      >
        <ArrowLeft size={24} />
      </Link>

      <div className="absolute top-6 right-6 z-50">
        <span className="text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-pink-500/20">
          Descubre & Compra
        </span>
      </div>

      <div className="w-full max-w-md px-4 mt-8 pb-20">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent drop-shadow-sm">
            Swipe Shop
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Desliza para descubrir lo mejor de tu comunidad
          </p>
        </div>

        <SwipeDeck />
      </div>
    </div>
  )
}
