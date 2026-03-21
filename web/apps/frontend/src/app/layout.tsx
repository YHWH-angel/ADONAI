import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { SideNav } from '@/components/layout/SideNav';
import { MobileNav } from '@/components/layout/MobileNav';

export const metadata: Metadata = {
  title: 'ADONAI Wallet',
  description: 'Billetera web para la criptomoneda ADONAI (ADO)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ADONAI',
  },
};

export const viewport: Viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <SideNav />
          <MobileNav />
          {/* lg:ml-56 = sidebar offset on desktop; pb-24 = space for bottom nav on mobile */}
          <main className="min-h-screen p-4 pb-24 lg:ml-56 lg:p-6 lg:pb-6">
            <div className="mx-auto max-w-3xl">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
