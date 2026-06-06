import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import WaitlistPage from './components/WaitlistPage'

const _params = new URLSearchParams(window.location.search);
const showApp = _params.get('app') === '1'
  || _params.get('pro') === '1'
  || import.meta.env.VITE_APP_MODE === 'app';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showApp ? <App /> : <WaitlistPage />}
  </StrictMode>,
)
