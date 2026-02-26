'use client'

import Link from 'next/link'
import { MessageSquare, Sparkles } from 'lucide-react'
import './floating-community.css'
import { usePathname } from 'next/navigation'

export default function FloatingCommunityButton() {
    const pathname = usePathname()

    // Ocultar el botón si ya estamos en la página de la comunidad
    if (pathname === '/community') {
        return null
    }

    return (
        <Link href="/community" className="fcb-container" aria-label="Ir a la Comunidad">
            <div className="fcb-glow"></div>
            <div className="fcb-waves">
                <span></span><span></span><span></span>
            </div>
            <div className="fcb-button">
                <MessageSquare size={24} className="fcb-icon-main" />
                <Sparkles size={12} className="fcb-icon-sparkle" />
            </div>
        </Link>
    )
}
