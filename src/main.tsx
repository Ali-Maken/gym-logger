import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import { initLogbook } from './core/logbook'
import { router } from './router'
import './index.css'

registerSW({ immediate: true })
void navigator.storage?.persist()
void initLogbook()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
