import { kunMoyuMoe } from '~/config/moyu-moe'
import { convert } from 'html-to-text'
import type { Metadata } from 'next'
import type { KunSiteAuthor } from '~/config/config'
import type { PatchDetail } from '~/types/api/patch'

export const generateKunMetadataTemplate = (detail: PatchDetail): Metadata => {
  const title = detail.alias.length
    ? `${detail.name} | ${detail.alias[0]}`
    : `${detail.name}`
  const descriptionSource =
    detail.introduction_zh_cn || detail.introduction_en_us || ''
  return {
    title,
    keywords: [detail.name, ...detail.alias],
    description: descriptionSource.slice(0, 170),
    openGraph: {
      title,
      description: descriptionSource.slice(0, 170),
      type: 'article',
      images: [
        {
          url: detail.banner,
          width: 1920,
          height: 1080,
          alt: detail.name
        }
      ]
    },
    twitter: {
      card: 'summary',
      title,
      description: descriptionSource.slice(0, 170),
      images: [detail.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/patch/${detail.id}/introduction`
    }
  }
}
