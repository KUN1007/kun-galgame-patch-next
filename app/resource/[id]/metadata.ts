import { convert } from 'html-to-text'
import type { Metadata } from 'next'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { PatchResourceDetail } from '~/types/api/resource'
import { generateNullMetadata } from '~/utils/noIndex'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'

export const generateKunResourceMetadata = (
  detail: PatchResourceDetail
): Metadata => {
  const patchName = getPreferredLanguageText(detail.patch.name)
  const resourceTitle =
    detail.resource.name || detail.resource.modelName || patchName
  const pageTitle = `${resourceTitle} | ${patchName}`
  const descriptionSource =
    detail.resource.noteHtml && detail.resource.noteHtml.trim().length > 0
      ? convert(detail.resource.noteHtml, {
          wordwrap: false,
          selectors: [{ selector: 'p', format: 'inline' }]
        })
      : `${resourceTitle} · ${patchName}`

  if (detail.patch.content_limit === 'nsfw') {
    return generateNullMetadata(pageTitle)
  }

  return {
    title: pageTitle,
    keywords: [resourceTitle, patchName, ...detail.patch.alias],
    description: descriptionSource.slice(0, 170),
    openGraph: {
      title: pageTitle,
      description: descriptionSource.slice(0, 170),
      type: 'article',
      images: [
        {
          url: detail.patch.banner,
          width: 1920,
          height: 1080,
          alt: patchName
        }
      ]
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: descriptionSource.slice(0, 170),
      images: [detail.patch.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/resource/${detail.resource.id}`
    }
  }
}
