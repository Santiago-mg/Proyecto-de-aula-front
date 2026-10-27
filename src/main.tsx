import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import { AppRouter } from './routes/AppRouter'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user": si la persona pidió menos movimiento en su sistema, se respeta */}
    <MotionConfig reducedMotion="user">
      <AppRouter />
    </MotionConfig>
  </StrictMode>,
)
