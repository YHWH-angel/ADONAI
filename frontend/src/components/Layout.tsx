import type { ReactNode } from 'react'

interface LayoutProps {
  header?: ReactNode
  children: ReactNode
}

export function Layout({ header, children }: LayoutProps) {
  return (
    <div className="container">
      {header}
      {children}
    </div>
  )
}
