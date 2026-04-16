import type { Metadata } from 'next'

export const generateNullMetadata = (title: string): Metadata => {
  return {
    metadataBase: null,
    title,
    description: null,
    applicationName: null,
    authors: null,
    generator: null,
    keywords: null,
    referrer: null,
    themeColor: null,
    colorScheme: null,
    viewport: null,
    creator: null,
    publisher: null,
    alternates: null,
    icons: null,
    manifest: null,
    openGraph: null,
    twitter: null,
    facebook: null,
    appleWebApp: null,
    formatDetection: null,
    itunes: null,
    abstract: null,
    appLinks: null,
    archives: null,
    assets: null,
    bookmarks: null,
    category: null,
    classification: null,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      noimageindex: true,
      googleBot: {
        index: false,
        follow: false,
        nocache: true,
        noimageindex: true
      }
    }
  }
}
