import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import { KunTopBar } from '~/components/kun/TopBar'
import '@milkdown/crepe/theme/common/style.css'
import '~/styles/index.css'
import '~/styles/crepe.css'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <div className="relative flex flex-col min-h-screen bg-white bg-radial">
          <KunTopBar />
          <div className="flex items-center justify-center min-h-[calc(100dvh-64px)]">
            <Providers>{children}</Providers>
            <Toaster />
          </div>
        </div>
      </body>
    </html>
  )
}
