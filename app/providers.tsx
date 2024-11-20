'use client'

import { useEffect } from 'react'
import { AppProgressBar } from 'next-nprogress-bar'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useEffect(() => {
    window.scroll(0, 0)
  }, [pathname])

  return (
    <NextUIProvider>
      <ThemeProvider attribute="class">{children}</ThemeProvider>
      <AppProgressBar
        height="4px"
        color="#006fee"
        options={{ showSpinner: false }}
      />
    </NextUIProvider>
  )
}
