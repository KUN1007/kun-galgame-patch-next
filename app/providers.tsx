'use client'

import { AppProgressBar, useRouter } from 'next-nprogress-bar'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider } from 'next-themes'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()

  return (
    <NextUIProvider navigate={router.push}>
      <ThemeProvider attribute="class">{children}</ThemeProvider>
      <AppProgressBar
        height="4px"
        color="#006fee"
        options={{ showSpinner: false }}
      />
    </NextUIProvider>
  )
}
