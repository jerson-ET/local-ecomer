'use client'

import { useEffect } from 'react'
import VirtualTryOn from '@/components/features/ar/VirtualTryOn'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ARDemoPage() {

    // Helper to load the model-viewer script if not already loaded globally
    useEffect(() => {
        const scriptId = 'model-viewer-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.type = 'module';
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
            document.body.appendChild(script);
        }
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <Link href="/store/gorras" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft size={20} />
                Volver a la tienda
            </Link>

            <div className="max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                    <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold mb-4 border border-purple-500/30">
                        NUEVA TECNOLOGÍA
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
                        Probador Virtual AR
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Prueba nuestros productos en tu propio espacio usando la cámara de tu móvil.
                        Sin instalar aplicaciones extra.
                    </p>
                </div>

                {/* AR Component */}
                <div className="mb-12">
                    <VirtualTryOn
                        modelSrc="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                        productName="Gorra Edición Espacial"
                    />
                    <p className="text-center text-xs text-gray-500 mt-4">
                        * Modelo 3D de demostración (Astronauta). En producción se reemplazaría por el modelo GLB de la gorra real.
                    </p>
                </div>

                {/* Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                        <h3 className="font-bold mb-2">Escanea</h3>
                        <p className="text-sm text-gray-400">Apunta tu cámara a una superficie plana e iluminada.</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                        <h3 className="font-bold mb-2">Coloca</h3>
                        <p className="text-sm text-gray-400">Toca la pantalla para colocar el producto en el mundo real.</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                        <h3 className="font-bold mb-2">Interactúa</h3>
                        <p className="text-sm text-gray-400">Gira, escala y muévete alrededor del producto para ver cada detalle.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
