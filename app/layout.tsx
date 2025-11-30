
import './globals.css'
import type { Metadata } from 'next'
import PWAInitializer from '@/components/PWAInitializer'
import ConditionalHeader from '@/components/ConditionalHeader'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BPS Brasil - Avaliação Psicossocial',
  description: 'Sistema de avaliação psicossocial COPSOQ III',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BPS Brasil',
  },
}

export const viewport = {
  themeColor: '#FF6B00',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Tenta obter sessão do usuário
  const session = await getSession();

  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B00" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <PWAInitializer />
        {/* Header condicional, não aparece em login e avaliação */}
        <ConditionalHeader />
        {children}
      </body>
    </html>
  )
}
