import type { Page } from './types'

interface HeaderProps {
  pages: readonly Page[]
  labels: Record<Page, string>
  current: Page
  theme: 'light' | 'dark'
  language: string
  onNavigate: (page: Page) => void
  onToggleTheme: () => void
  onToggleLanguage: () => void
}

export function Header({
  pages,
  labels,
  current,
  theme,
  language,
  onNavigate,
  onToggleTheme,
  onToggleLanguage,
}: HeaderProps) {
  return (
    <div className="actions">
      <button onClick={onToggleTheme} aria-label="toggle theme">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <button onClick={onToggleLanguage} aria-label="toggle language">
        {language === 'en' ? 'ES' : 'EN'}
      </button>
      <nav className="main-nav">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onNavigate(p)}
            aria-label={p}
            disabled={current === p}
          >
            {labels[p]}
          </button>
        ))}
      </nav>
    </div>
  )
}
