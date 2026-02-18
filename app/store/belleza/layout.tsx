import './belleza.css'

export const metadata = {
    title: 'BEAUTY GLOW - Cosméticos & Skincare | LocalEcomer',
    description: 'Maquillaje, skincare, fragancias y más. Descubre tu belleza natural.',
}

export default function BellezaStoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
