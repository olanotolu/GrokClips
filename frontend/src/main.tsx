import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LikedArticlesProvider } from './contexts/LikedArticlesContext'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LikedArticlesProvider>
        <App />
      </LikedArticlesProvider>
    </ThemeProvider>
  </StrictMode>,
)
