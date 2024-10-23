'use client'

import { AppProgressBar } from 'next-nprogress-bar'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
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
