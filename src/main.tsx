import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import WaitlistPage from './components/WaitlistPage'

const showApp = new URLSearchParams(window.location.search).get('app') === '1'
  || import.meta.env.VITE_APP_MODE === 'app';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showApp ? <App /> : <WaitlistPage />}
  </StrictMode>,
)
