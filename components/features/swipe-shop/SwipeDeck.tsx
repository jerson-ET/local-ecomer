'use client'

import React, { useState, useRef } from 'react'
import { Heart, Info, X } from 'lucide-react'
import Image from 'next/image'

interface Product {
    id: string
    name: string
    price: number
    description: string
    image: string
    store: string
    category: string
}

const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Café de Origen - Sierra Nevada',
        price: 25000,
        description: 'Notas de chocolate y nuez. Cultivado a 1800m.',
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=1000&auto=format&fit=crop',
        store: 'Café La Montaña',
        category: 'Alimentos',
    },
    {
        id: '2',
        name: 'Gorra Urbana Mod. Street',
        price: 45000,
        description: 'Estilo snapback con bordado 3D de alta calidad.',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop',
        store: 'Cap Kings',
        category: 'Moda',
    },
    {
        id: '3',
        name: 'Sneakers Retro 90s',
        price: 180000,
        description: 'Diseño clásico con comodidad moderna. Suela de aire.',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop',
        store: 'Sneaker Vault',
        category: 'Calzado',
    },
    {
        id: '4',
        name: 'Mochila Wayuu Tradicional',
        price: 120000,
        description: 'Tejida a mano por artesanos locales. Diseño único.',
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop',
        store: 'Wayuu Arts',
        category: 'Artesanía',
    },
]

export default function SwipeDeck() {
    const [products, setProducts] = useState(MOCK_PRODUCTS)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)

    const startPos = useRef({ x: 0, y: 0 })

    const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDragging(true)
        let clientX, clientY
        if ('touches' in e) {
            const touch = e.touches[0]
            if (!touch) return
            clientX = touch.clientX
            clientY = touch.clientY
        } else {
            clientX = (e as React.MouseEvent).clientX
            clientY = (e as React.MouseEvent).clientY
        }
        startPos.current = { x: clientX, y: clientY }
    }

    const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return
        let clientX, clientY
        if ('touches' in e) {
            const touch = e.touches[0]
            if (!touch) return
            clientX = touch.clientX
            clientY = touch.clientY
        } else {
            clientX = (e as React.MouseEvent).clientX
            clientY = (e as React.MouseEvent).clientY
        }
        setOffset({ x: clientX - startPos.current.x, y: clientY - startPos.current.y })
    }

    const handleEnd = () => {
        setIsDragging(false)
        if (offset.x > 100) {
            removeProduct('right')
        } else if (offset.x < -100) {
            removeProduct('left')
        } else {
            setOffset({ x: 0, y: 0 })
        }
    }

    const removeProduct = (direction: 'left' | 'right') => {
        // Animate out manually
        setOffset({ x: direction === 'right' ? 500 : -500, y: 0 })
        setTimeout(() => {
            setProducts(prev => prev.slice(0, prev.length - 1))
            setOffset({ x: 0, y: 0 })
        }, 200)
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-900 min-h-[60vh]">
                <h2 className="text-3xl font-bold mb-4">¡Todo visto!</h2>
                <button onClick={() => setProducts(MOCK_PRODUCTS)} className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                    Reiniciar Demo
                </button>
            </div>
        )
    }

    const topProduct = products[products.length - 1] as Product
    const nextProduct = products.length > 1 ? products[products.length - 2] : null

    return (
        <div className="relative w-full max-w-sm mx-auto h-[70vh] flex items-center justify-center">
            {/* Background Card */}
            {nextProduct && (
                <div className="absolute w-[95%] h-[95%] bg-gray-800 rounded-3xl opacity-50 transform scale-95 translate-y-4 shadow-xl z-0 pointer-events-none">
                    <Image
                        src={nextProduct.image}
                        alt={'Next'}
                        fill
                        className="object-cover rounded-3xl opacity-30"
                    />
                </div>
            )}

            {/* Active Card */}
            <div
                className="absolute w-full h-full bg-black rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing z-10 border border-white/10"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            >
                <Image
                    src={topProduct.image}
                    alt={topProduct.name}
                    fill
                    className="object-cover pointer-events-none"
                    draggable={false}
                />

                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none" />

                {/* Labels based on drag */}
                {offset.x > 50 && (
                    <div className="absolute top-8 left-8 border-4 border-green-400 text-green-400 font-bold text-4xl px-4 py-2 rounded-lg transform -rotate-12 bg-black/20 backdrop-blur-sm z-20">
                        LIKE
                    </div>
                )}
                {offset.x < -50 && (
                    <div className="absolute top-8 right-8 border-4 border-red-500 text-red-500 font-bold text-4xl px-4 py-2 rounded-lg transform rotate-12 bg-black/20 backdrop-blur-sm z-20">
                        NOPE
                    </div>
                )}

                {/* Info */}
                <div className="absolute bottom-0 w-full p-6 text-white pointer-events-none z-20">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">{topProduct.store}</span>
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-3xl font-bold leading-tight drop-shadow-md">{topProduct.name}</h2>
                    </div>
                    <p className="text-xl font-bold text-green-400 mb-2">${topProduct.price.toLocaleString()}</p>
                    <p className="text-gray-300 line-clamp-2 text-sm mb-4 drop-shadow-sm">{topProduct.description}</p>
                </div>
            </div>

            {/* Floating Buttons */}
            <div className="absolute -bottom-24 flex gap-6 z-20">
                <button onClick={() => removeProduct('left')} className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-red-500 shadow-xl border border-gray-800 hover:scale-110 transition-transform">
                    <X size={32} />
                </button>
                <button onClick={() => alert('Info Clicked')} className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white shadow-xl border border-gray-700 hover:bg-gray-700 transition-colors mt-2">
                    <Info size={24} />
                </button>
                <button onClick={() => removeProduct('right')} className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white shadow-rose-500/30 shadow-xl hover:scale-110 transition-transform">
                    <Heart fill="currentColor" size={32} />
                </button>
            </div>
        </div>
    )
}
