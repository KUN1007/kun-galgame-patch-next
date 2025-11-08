import { kunMoyuMoe } from '~/config/moyu-moe'
import {
  SUPPORTED_TYPE_MAP,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP
} from '~/constants/resource'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { Metadata } from 'next'
import type { KunSiteAuthor } from '~/config/config'
import type { PatchHeader, PatchResource } from '~/types/api/patch'

export const generateKunMetadataTemplate = (
  patch: PatchHeader,
  resources: PatchResource[]
): Metadata => {
  const patchName = getPreferredLanguageText(patch.name)
  const patchNameJa = patch.name['ja-jp'] ? patch.name['ja-jp'] : ''
  const pageTitle =
    patchNameJa && patchName !== patchNameJa
      ? `${patchName} | ${patchNameJa} 的下载资源`
      : `${patchName} 的下载资源`

  const responseType = resources.map((res) => res.type).flat()
  const dedupeType = [...new Set(responseType)].map(
    (t) => SUPPORTED_TYPE_MAP[t]
  )
  const responseLang = resources.map((res) => res.language).flat()
  const dedupeLang = [...new Set(responseLang)].map(
    (l) => SUPPORTED_LANGUAGE_MAP[l]
  )
  const responsePlatform = resources.map((res) => res.platform).flat()
  const dedupePlatform = [...new Set(responsePlatform)].map(
    (p) => SUPPORTED_PLATFORM_MAP[p]
  )
  const authors: KunSiteAuthor[] = resources.map((res) => ({
    name: res.user.name,
    url: `${kunMoyuMoe.domain.main}/user/${res.user.id}/resource`
  }))
  const uniqueAuthors = authors.filter(
    (author, index, self) =>
      index === self.findIndex((a) => a.name === author.name)
  )
  const uniqueAuthorsName = uniqueAuthors.map((u) => u.name)

  const pageDescription = `${uniqueAuthorsName} 在 ${patch.name} 下发布了 ${dedupeType} 下载资源`

  return {
    title: pageTitle,
    keywords: [...patch.alias, ...dedupeType, ...dedupeLang, ...dedupePlatform],
    authors: uniqueAuthors,
    creator: patch.user.name,
    publisher: patch.user.name,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
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
      description: pageDescription,
      images: [patch.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/patch/${patch.id}/resource`
    }
  }
}
