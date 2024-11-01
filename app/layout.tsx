import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import { KunTopBar } from '~/components/kun/TopBar'
import '~/styles/index.scss'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="relative flex flex-col items-center justify-center min-h-screen bg-white bg-radial">
            <KunTopBar />
            <div className="flex w-full flex-grow max-w-7xl min-h-[calc(100dvh-64px)]">
              {children}
              <Toaster />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
