import './mascotas.css'

export const metadata = {
    title: 'PATITAS FELICES - Tienda de Mascotas | LocalEcomer',
    description: 'Todo para tu mascota: alimento premium, accesorios, juguetes y más. ¡Consentí a tu mejor amigo!',
}

export default function MascotasStoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
