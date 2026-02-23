'use client'

import { Smartphone, QrCode } from 'lucide-react'

export default function DesktopBlocker() {
    return (
        <div className="desktop-blocker">
            <div className="db-content">
                <div className="db-icon-wrap">
                    <Smartphone size={48} className="db-icon desktop-bounce" />
                </div>
                <h1>Experiencia Móvil Exclusiva</h1>
                <p>
                    LocalEcomer fue diseñado específicamente para funcionar como una aplicación en tu teléfono celular.
                </p>
                <div className="db-qr-box">
                    <QrCode size={120} className="db-qr" />
                    <span>Escanea o entra desde tu móvil</span>
                </div>
                <div className="db-stores">
                    <div className="db-badge android">Disponible en Android</div>
                    <div className="db-badge ios">Disponible en iOS</div>
                </div>
            </div>

            <style jsx>{`
                .desktop-blocker {
                    display: none; /* By default hidden on mobile */
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
                    z-index: 99999;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    font-family: var(--font-sans);
                }

                @media (min-width: 768px) {
                    .desktop-blocker {
                        display: flex;
                    }
                    /* Ocultar el resto de la app en desktop para forzar exclusividad */
                    :global(#app-root) {
                        display: none !important;
                    }
                }

                .db-content {
                    max-width: 400px;
                    padding: 3rem;
                    background: white;
                    border-radius: 24px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02);
                    border: 1px solid rgba(0,0,0,0.03);
                }

                .db-icon-wrap {
                    display: inline-flex;
                    padding: 1.5rem;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
                    margin-bottom: 1.5rem;
                }

                .db-icon {
                    color: #f43f5e;
                }

                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }

                .desktop-bounce {
                    animation: float 3s ease-in-out infinite;
                }

                .db-content h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1a1a2e;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #f43f5e 0%, #6366f1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .db-content p {
                    color: #64648a;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    margin-bottom: 2rem;
                }

                .db-qr-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    padding: 2rem;
                    background: #f8f9fc;
                    border-radius: 16px;
                    margin-bottom: 2rem;
                }

                .db-qr {
                    color: #1a1a2e;
                    opacity: 0.8;
                }

                .db-qr-box span {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #64648a;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .db-stores {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .db-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .db-badge.android {
                    background: rgba(16, 185, 129, 0.1);
                    color: #059669;
                }

                .db-badge.ios {
                    background: rgba(59, 130, 246, 0.1);
                    color: #2563eb;
                }
            `}</style>
        </div>
    )
}
