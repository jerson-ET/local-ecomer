'use client'

import { useState, useEffect } from 'react'
import { WifiOff, ShieldAlert } from 'lucide-react'

export default function OfflineBlocker() {
    const [isOffline, setIsOffline] = useState(false)

    useEffect(() => {
        // Ejecutar solo en el cliente
        if (typeof window !== 'undefined') {
            setIsOffline(!navigator.onLine)

            const handleOffline = () => setIsOffline(true)
            const handleOnline = () => setIsOffline(false)

            window.addEventListener('offline', handleOffline)
            window.addEventListener('online', handleOnline)

            return () => {
                window.removeEventListener('offline', handleOffline)
                window.removeEventListener('online', handleOnline)
            }
        }
        return undefined
    }, [])

    if (!isOffline) return null

    return (
        <div className="offline-blocker">
            <div className="offline-content">
                <WifiOff size={64} className="offline-icon" />
                <h2>Sin Conexión</h2>
                <p>
                    LocalEcomer requiere acceso a internet para funcionar, procesar pedidos y sincronizar tiendas.
                </p>
                <div className="offline-footer">
                    <ShieldAlert size={16} />
                    <span>Conéctate a una red Wi-Fi o enciende los datos móviles</span>
                </div>
            </div>

            <style jsx>{`
                .offline-blocker {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: var(--bg-dark, #ffffff);
                    z-index: 999999;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem;
                    text-align: center;
                }

                .offline-content {
                    max-width: 320px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .offline-icon {
                    color: var(--error, #f43f5e);
                    margin-bottom: 1.5rem;
                    filter: drop-shadow(0 8px 16px rgba(244, 63, 94, 0.25));
                }

                h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    color: var(--text-primary, #1a1a2e);
                }

                p {
                    font-size: 0.95rem;
                    color: var(--text-secondary, #64648a);
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }

                .offline-footer {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: rgba(245, 158, 11, 0.1);
                    color: #d97706;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                @keyframes popIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                /* Evitar scroll si está offline */
                :global(body) {
                    overflow: hidden;
                }
            `}</style>
        </div>
    )
}
