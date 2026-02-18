import './fitness.css'

export const metadata = {
    title: 'Iron Pulse - Fitness & Gym | LocalEcomer',
    description: 'Suplementos, ropa y equipos de fitness. Transforma tu cuerpo.',
}

export default function FitnessStoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
