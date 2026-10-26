import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ux.css'
import './styles/componentes.css'
import './styles/tienda.css'
import './styles/admin.css'
import { AppRouter } from './routes/AppRouter'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
