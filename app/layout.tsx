import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import { KunTopBar } from '~/components/kun/top-bar/TopBar'
import { KunFooter } from '~/components/kun/Footer'
import '~/styles/index.scss'
import './actions'

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
            <div className="flex px-6 w-full flex-grow max-w-7xl min-h-[calc(100dvh-256px)]">
              {children}
              <Toaster />
            </div>
            <KunFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}
