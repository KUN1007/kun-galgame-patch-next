import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import { KunTopBar } from '~/components/kun/top-bar/TopBar'
import { KunFooter } from '~/components/kun/Footer'
import { KunNavigationBreadcrumb } from '~/components/kun/NavigationBreadcrumb'
import { kunMetadata, kunViewport } from './metadata'
import { KunBackToTop } from '~/components/kun/BackToTop'
import { NSFWIndicator } from '~/components/kun/NSFWIndicator'
import Script from 'next/script'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import type { Metadata, Viewport } from 'next'
import '~/styles/index.css'

export const viewport: Viewport = kunViewport
export const metadata: Metadata = kunMetadata

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const nsfwHeader = await getNSFWHeader()
  const isNSFWEnable =
    nsfwHeader.content_limit === 'nsfw' ||
    nsfwHeader.content_limit === undefined

  return (
    <html lang="zh-Hans" suppressHydrationWarning>
      {process.env.NODE_ENV === 'production' && (
        <head>
          <Script
            defer
            src="https://stats.kungal.org/script.js"
            data-website-id="4521684c-2b49-46f2-9e88-ce0592c4aecf"
          />
        </head>
      )}
      <body>
        <Providers>
          <div className="relative flex flex-col items-center justify-center min-h-screen bg-radial">
            <KunTopBar />
            <KunNavigationBreadcrumb />
            <NSFWIndicator isNSFWEnable={isNSFWEnable} />
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
