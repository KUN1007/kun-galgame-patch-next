import { kunMoyuMoe } from '~/config/moyu-moe'
import { convert } from 'html-to-text'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { Metadata } from 'next'
import type { PatchDetail } from '~/types/api/patch'
import { generateNullMetadata } from '~/utils/noIndex'

export const generateKunMetadataTemplate = (detail: PatchDetail): Metadata => {
  const patchName = getPreferredLanguageText(detail.name)
  const patchNameJa = detail.name['ja-jp'] ? detail.name['ja-jp'] : ''
  const pageTitle =
    patchNameJa && patchName !== patchNameJa
      ? `${patchName} | ${patchNameJa}`
      : `${patchName}`
  const patchIntro = convert(getPreferredLanguageText(detail.introduction), {
    wordwrap: false,
    selectors: [{ selector: 'p', format: 'inline' }]
  }).slice(0, 170)

  if (detail.content_limit === 'nsfw') {
    return generateNullMetadata(pageTitle)
  }

  return {
    title: pageTitle,
    keywords: [patchName, ...detail.alias.map((a) => a.name)],
    description: patchIntro.slice(0, 170),
    openGraph: {
      title: pageTitle,
      description: patchIntro.slice(0, 170),
      type: 'article',
      images: [
        {
          url: detail.banner,
          width: 1920,
          height: 1080,
          alt: patchName
        }
      ]
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: patchIntro.slice(0, 170),
      images: [detail.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/patch/${detail.id}/introduction`
    }
  }
}
