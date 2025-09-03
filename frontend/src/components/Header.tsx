import { useTheme } from '@/lib/theme'
import { useTranslation } from 'react-i18next'
import Navigation, { type NavItem } from './Navigation'

export type Page = 'dashboard' | 'wallet' | 'mining' | 'network' | 'settings'

interface HeaderProps {
  onNavigate: (page: Page) => void
}

export default function Header({ onNavigate }: HeaderProps) {
  const { theme, toggle } = useTheme()
  const { t, i18n } = useTranslation()

  const switchLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')
  }

  const items: NavItem[] = [
    {
      key: 'dashboard',
      label: t('dashboard'),
      onClick: () => onNavigate('dashboard'),
    },
    { key: 'wallet', label: t('wallet'), onClick: () => onNavigate('wallet') },
    { key: 'mining', label: t('mining'), onClick: () => onNavigate('mining') },
    {
      key: 'network',
      label: t('network'),
      onClick: () => onNavigate('network'),
    },
    {
      key: 'settings',
      label: t('settings'),
      onClick: () => onNavigate('settings'),
    },
  ]

  return (
    <header className="header">
      <div className="actions">
        <button onClick={toggle} aria-label="toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button onClick={switchLang} aria-label="toggle language">
          {i18n.language === 'en' ? 'ES' : 'EN'}
        </button>
      </div>
      <Navigation items={items} />
    </header>
  )
}
