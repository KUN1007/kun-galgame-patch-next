import type { Metadata, Viewport } from 'next'
import { kunMoyuMoe } from '~/config/moyu-moe'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  colorScheme: 'light dark'
}

export const metadata: Metadata = {
  metadataBase: new URL(kunMoyuMoe.domain.main),
  title: {
    default: kunMoyuMoe.title,
    template: kunMoyuMoe.template
  },
  description: kunMoyuMoe.description,
  keywords: kunMoyuMoe.keywords,
  authors: kunMoyuMoe.author,
  creator: kunMoyuMoe.creator.name,
  publisher: kunMoyuMoe.publisher.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: kunMoyuMoe.domain.main,
    title: kunMoyuMoe.title,
    description: kunMoyuMoe.description,
    siteName: kunMoyuMoe.title,
    images: [
      {
        url: kunMoyuMoe.og.image,
        width: 1920,
        height: 1080,
        alt: kunMoyuMoe.title
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: kunMoyuMoe.title,
    description: kunMoyuMoe.description,
    creator: kunMoyuMoe.creator.mention,
    images: kunMoyuMoe.og.image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: kunMoyuMoe.canonical,
    languages: {
      'zh-Hans': kunMoyuMoe.domain.main
    }
  },
  manifest: '/manifest.json'
}
