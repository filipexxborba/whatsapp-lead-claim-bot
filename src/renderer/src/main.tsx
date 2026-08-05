import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Aplicado antes do primeiro paint (síncrono) pra não piscar o tema errado.
document.documentElement.classList.toggle('dark', window.api.theme.getResolvedSync())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
