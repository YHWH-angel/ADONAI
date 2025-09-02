import { useTranslation } from 'react-i18next'
import Onboarding from '@/features/onboarding'
import { useTheme } from '@/lib/theme'
import { useWalletStore } from '@/store/wallet'
import './App.css'

export default function App() {
  const { t, i18n } = useTranslation()
  const { theme, toggle } = useTheme()
  const isLoaded = useWalletStore((s) => s.isLoaded)

  const switchLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')
  }

  if (!isLoaded) {
    return <Onboarding />
  }

  return (
    <div className="container">
      <h1>{t('welcome')}</h1>
      <div className="actions">
        <button onClick={toggle} aria-label="toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button onClick={switchLang} aria-label="toggle language">
          {i18n.language === 'en' ? 'ES' : 'EN'}
        </button>
      </div>
    </div>
  )
}
