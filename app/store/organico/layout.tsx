import './organico.css'

export const metadata = {
    title: 'Fresh & Organic - Alimentos Naturales | LocalEcomer',
    description: 'Alimentos orgánicos, frescos y naturales. Del campo a tu mesa.',
}

export default function OrganicoStoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
