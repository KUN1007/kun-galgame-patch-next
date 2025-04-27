import { kunMoyuMoe } from '~/config/moyu-moe'
import {
  SUPPORTED_TYPE_MAP,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP
} from '~/constants/resource'
import type { Metadata } from 'next'
import type { KunSiteAuthor } from '~/config/config'
import type { Patch, PatchResource } from '~/types/api/patch'

export const generateKunMetadataTemplate = (
  patch: Patch,
  resources: PatchResource[]
): Metadata => {
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

  return {
    title: patch.alias.length
      ? `${patch.name} | ${patch.alias[0]} 的 下载资源`
      : `${patch.name} 的 下载资源`,
    keywords: [...patch.alias, ...dedupeType, ...dedupeLang, ...dedupePlatform],
    authors: uniqueAuthors,
    creator: patch.user.name,
    publisher: patch.user.name,
    description: `${uniqueAuthorsName} 在 ${patch.name} 下发布了 ${dedupeType} 下载资源`,
    openGraph: {
      title: patch.alias.length
        ? `${patch.name} | ${patch.alias[0]} 的 下载资源`
        : `${patch.name} 的 下载资源`,
      description: `${uniqueAuthorsName} 在 ${patch.name} 下发布了 ${dedupeType} 下载资源`,
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
      title: patch.alias.length
        ? `${patch.name} | ${patch.alias[0]} 的 下载资源`
        : `${patch.name} 的 下载资源`,
      description: `${uniqueAuthorsName} 在 ${patch.name} 下发布了 ${dedupeType} 下载资源`,
      images: [patch.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/patch/${patch.id}/resource`
    }
  }
}
