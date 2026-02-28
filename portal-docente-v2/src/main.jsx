import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// --- BLINDAJE DE SEGURIDAD ---
// Desactivar logs en producción para no dar pistas a usuarios malintencionados
if (import.meta.env.PROD) {
  console.log = () => { };
  console.warn = () => { };
  console.error = () => { };
  console.info = () => { };
  console.debug = () => { };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
