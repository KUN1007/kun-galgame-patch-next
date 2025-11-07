import { kunMoyuMoe } from '~/config/moyu-moe'
import { convert } from 'html-to-text'
import { generateNullMetadata } from '~/utils/noIndex'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { Metadata } from 'next'
import type { PatchHeader } from '~/types/api/patch'

export const generateKunMetadataTemplate = (patch: PatchHeader): Metadata => {
  const patchName = getPreferredLanguageText(patch.name)
  const pageTitle = patch.alias.length
    ? `${patchName} | ${patch.alias[0]}`
    : `${patchName}`

  if (patch.content_limit === 'nsfw') {
    return generateNullMetadata(pageTitle)
  }

  return {
    title: pageTitle,
    description: convert(patch.introduction).slice(0, 170),
    openGraph: {
      title: patch.alias[0]
        ? `${patchName} | ${patch.alias[0]}`
        : `${patchName}`,
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
          alt: patchName
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
    }
  }
}
