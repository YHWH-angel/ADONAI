import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import { ThemeProvider } from '@/lib/theme'
import { NotificationsProvider } from '@/lib/notifications'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from '@/app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NotificationsProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </NotificationsProvider>
    </ThemeProvider>
  </StrictMode>,
)
