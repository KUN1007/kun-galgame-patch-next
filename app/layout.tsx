import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import '~/styles/index.css'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <Providers>{children}</Providers>
          <Toaster />
        </div>
      </body>
    </html>
  )
}
