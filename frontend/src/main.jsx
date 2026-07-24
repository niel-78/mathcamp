import { AuthProvider } from "./Contexts/AuthContext"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./globals.css";
import 'katex/dist/katex.min.css';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </AuthProvider>  ,
)
