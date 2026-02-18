import './deportes.css'

export const metadata = {
    title: 'Sport Zone - Equipamiento Deportivo | LocalEcomer',
    description: 'Equipamiento deportivo de alto rendimiento. Ropa, calzado y accesorios.',
}

export default function DeportesStoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
