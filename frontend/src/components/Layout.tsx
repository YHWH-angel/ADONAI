import { ReactNode } from 'react'
import Footer from './Footer'

interface LayoutProps {
  header?: ReactNode
  children: ReactNode
}

export default function Layout({ header, children }: LayoutProps) {
  return (
    <div className="layout">
      {header}
      <main role="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
