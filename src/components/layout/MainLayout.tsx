import { Outlet } from 'react-router-dom'
import { CartDrawer } from '../cart/CartDrawer'
import { ConnectionBanner } from '../ui/ConnectionBanner'
import { PromoBar } from '../ui/PromoBar'
import { SkipLink } from '../ui/SkipLink'
import { CartDrawerProvider, useCartDrawer } from '../../context/CartDrawerContext'
import { useAtajos } from '../../hooks/useAtajos'
import { Footer } from './Footer'
import { Nav } from './Nav'

function Estructura() {
  const { abierto, abrir, cerrar } = useCartDrawer()
  useAtajos(abrir)

  return (
    <>
      <SkipLink />
      <PromoBar />
      <Nav onOpenCart={abrir} />
      <ConnectionBanner />
      <main id="contenido" tabIndex={-1} className="cp-main">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer open={abierto} onClose={cerrar} />
    </>
  )
}

export function MainLayout() {
  return (
    <CartDrawerProvider>
      <Estructura />
    </CartDrawerProvider>
  )
}
