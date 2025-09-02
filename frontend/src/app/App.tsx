import { useTranslation } from 'react-i18next'
import { useTheme } from '@/lib/theme'
import './App.css'

export default function App() {
  const { t, i18n } = useTranslation()
  const { theme, toggle } = useTheme()

  const switchLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')
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
