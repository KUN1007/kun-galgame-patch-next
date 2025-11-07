import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import { KunTopBar } from '~/components/kun/top-bar/TopBar'
import { KunFooter } from '~/components/kun/Footer'
import { KunNavigationBreadcrumb } from '~/components/kun/NavigationBreadcrumb'
import { kunMetadata, kunViewport } from './metadata'
import { KunBackToTop } from '~/components/kun/BackToTop'
import Script from 'next/script'
import type { Metadata, Viewport } from 'next'
// @ts-expect-error kun love ren forever~
import '~/styles/index.css'

export const viewport: Viewport = kunViewport
export const metadata: Metadata = kunMetadata

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-Hans" suppressHydrationWarning>
      {process.env.NODE_ENV === 'production' && (
        <head>
          <Script
            defer
            src="https://stats.kungal.org/script.js"
            data-website-id={process.env.KUN_VISUAL_NOVEL_UMAMI_ID}
          />
        </head>
      )}
      <body>
        <Providers>
          <div className="relative flex flex-col items-center justify-center min-h-screen bg-radial">
            <KunTopBar />
            <KunNavigationBreadcrumb />

            <div className="flex min-h-[calc(100dvh-24rem)] w-full max-w-7xl grow px-3">
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
