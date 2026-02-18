import './moda.css'

export const metadata = {
    title: 'VIBRANT - Tienda de Moda | LocalEcomer',
    description: 'Descubre las últimas tendencias en moda. Ropa, calzado y accesorios con envío gratis.',
}

export default function ModaStoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
