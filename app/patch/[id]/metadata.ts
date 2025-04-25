import { kunMoyuMoe } from '~/config/moyu-moe'
import { convert } from 'html-to-text'
import type { Metadata } from 'next'
import type { Patch } from '~/types/api/patch'

export const generateKunMetadataTemplate = (patch: Patch): Metadata => {
  const pageTitle = patch.alias.length
    ? `${patch.name} | ${patch.alias[0]}`
    : `${patch.name}`

  return {
    title: pageTitle,
    description: convert(patch.introduction).slice(0, 170),
    openGraph: {
      title: patch.alias[0]
        ? `${patch.name} | ${patch.alias[0]}`
        : `${patch.name}`,
      description: convert(patch.introduction, {
        wordwrap: false,
        selectors: [{ selector: 'p', format: 'inline' }]
      }).slice(0, 170),
      type: 'article',
      publishedTime: patch.created,
      modifiedTime: patch.updated,
      images: [
        {
          url: patch.banner,
          width: 1920,
          height: 1080,
          alt: patch.name
        }
      ]
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: convert(patch.introduction).slice(0, 170),
      images: [patch.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/patch/${patch.id}/introduction`
    },
    other:
      patch.content_limit === 'nsfw'
        ? {
            bingbot: 'noindex, nofollow, nocache, noimageindex'
          }
        : undefined
  }
}
