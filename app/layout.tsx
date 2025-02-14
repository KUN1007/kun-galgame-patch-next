import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import { KunTopBar } from '~/components/kun/top-bar/TopBar'
import { KunFooter } from '~/components/kun/Footer'
import { KunNavigationBreadcrumb } from '~/components/kun/NavigationBreadcrumb'
import { kunMetadata, kunViewport } from './metadata'
import { KunBackToTop } from '~/components/kun/BackToTop'
import type { Metadata, Viewport } from 'next'
import '~/styles/index.scss'
import './cron'

export const viewport: Viewport = kunViewport
export const metadata: Metadata = kunMetadata

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-Hans" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="relative flex flex-col items-center justify-center min-h-screen bg-radial">
            <KunTopBar />
            <KunNavigationBreadcrumb />
            <div className="flex min-h-[calc(100dvh-256px)] w-full max-w-7xl grow px-3">
              {children}
              <Toaster />
            </div>
            <KunBackToTop />
            <KunFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}
