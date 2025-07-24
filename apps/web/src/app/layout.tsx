import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'AWCRM - Production Ready CRM System',
    template: '%s | AWCRM',
  },
  description: 'A modern, production-ready CRM system built with Next.js, TypeScript, and Prisma.',
  keywords: [
    'CRM',
    'Customer Relationship Management',
    'Sales',
    'Lead Management',
    'Deal Pipeline',
    'Next.js',
    'TypeScript',
    'Prisma',
  ],
  authors: [
    {
      name: 'AWCRM Team',
    },
  ],
  creator: 'AWCRM Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://awcrm.com',
    title: 'AWCRM - Production Ready CRM System',
    description: 'A modern, production-ready CRM system built with Next.js, TypeScript, and Prisma.',
    siteName: 'AWCRM',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AWCRM - Production Ready CRM System',
    description: 'A modern, production-ready CRM system built with Next.js, TypeScript, and Prisma.',
    creator: '@awcrm',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`min-h-screen bg-background font-sans antialiased ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
              <ToastProvider />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}