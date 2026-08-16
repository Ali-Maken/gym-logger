import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import { initLogbook } from './core/logbook'
import { router } from './router'
import './index.css'

registerSW({ immediate: true })
void navigator.storage?.persist()

// Mount only once the store is loaded, so a mid-workout reload (e.g. the SW
// auto-update) resumes straight into /session instead of bouncing home.
void initLogbook().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
})
