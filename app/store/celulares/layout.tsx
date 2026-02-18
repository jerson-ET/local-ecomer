import './celulares.css'

export const metadata = {
    title: 'TECH STORE - Smartphones & Gadgets | LocalEcomer',
    description: 'Lo último en tecnología móvil. Smartphones, accesorios y wearables.',
}

export default function TechStoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
