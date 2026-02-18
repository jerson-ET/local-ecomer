import './dashboard.css'

export const metadata = {
    title: 'Dashboard - LocalEcomer',
    description: 'Administra tu tienda en LocalEcomer. Crea, personaliza y gestiona tu negocio online.',
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
