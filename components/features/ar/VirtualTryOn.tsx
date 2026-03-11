// @ts-nocheck
'use client'

import { useEffect, useRef } from 'react'
import { Camera, Share2 } from 'lucide-react'

interface VirtualTryOnProps {
  modelSrc: string
  posterSrc?: string
  productName?: string
}

export default function VirtualTryOn({
  modelSrc,
  posterSrc,
  productName = 'Producto AR',
}: VirtualTryOnProps) {
  const viewerRef = useRef<(HTMLElement & { activateAR?: () => void }) | null>(null)

  useEffect(() => {
    // Import model-viewer script dynamically if not present
    if (!customElements.get('model-viewer')) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js'
      document.body.appendChild(script)
    }
  }, [])

  const activateAR = () => {
    if (viewerRef.current) {
      viewerRef.current.activateAR()
    }
  }

  return (
    <div className="relative w-full h-[60vh] bg-gradient-to-b from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      {/* 3D Viewer */}
      <model-viewer
        ref={viewerRef}
        src={modelSrc}
        poster={posterSrc}
        alt={`Modelo 3D de ${productName}`}
        shadow-intensity="1"
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-orbit="0deg 75deg 105%"
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      >
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
          <span className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10">
            Vista 3D Interactiva
          </span>
        </div>
      </model-viewer>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex flex-col items-center">
        <h3 className="text-white font-bold text-xl mb-4 text-center">{productName}</h3>

        <div className="flex gap-4 w-full max-w-xs">
          <button
            onClick={activateAR}
            className="flex-1 bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg active:scale-95"
          >
            <Camera size={20} />
            Ver en mi espacio
          </button>
          <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 hover:bg-white/20">
            <Share2 size={20} />
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-4 text-center">
          * Requiere un dispositivo compatible con ARCore (Android) o ARKit (iOS).
        </p>
      </div>
    </div>
  )
}
