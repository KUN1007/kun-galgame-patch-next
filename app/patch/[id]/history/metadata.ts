import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { KunSiteAuthor } from '~/config/config'
import type { Patch, PatchHistory } from '~/types/api/patch'

export const generateKunMetadataTemplate = (
  patch: Patch,
  histories: PatchHistory[]
): Metadata => {
  const authors: KunSiteAuthor[] = histories.map((his) => ({
    name: his.user.name,
    url: `${kunMoyuMoe.domain.main}/user/${his.user.id}/resource`
  }))
  const uniqueAuthors = authors.filter(
    (author, index, self) =>
      index === self.findIndex((a) => a.name === author.name)
  )
  const uniqueAuthorsName = uniqueAuthors.map((u) => u.name)

  return {
    title: patch.alias[0]
      ? `${patch.name} | ${patch.alias[0]} 的 贡献历史`
      : `${patch.name} 的 贡献历史`,
    keywords: [...patch.alias, '贡献历史'],
    authors: uniqueAuthors,
    creator: patch.user.name,
    publisher: patch.user.name,
    description: histories.length
      ? `${uniqueAuthorsName} 为 ${patch.name} 做出了 ${histories[0].content} 等贡献!`
      : `查看更多 ${patch.name} 的贡献历史`,
    openGraph: {
      title: patch.alias[0]
        ? `${patch.name} | ${patch.alias[0]} 的 贡献历史`
        : `${patch.name} 的 贡献历史`,
      description: histories.length
        ? `${uniqueAuthorsName} 为 ${patch.name} 做出了 ${histories[0].content} 等贡献!`
        : `查看更多 ${patch.name} 的贡献历史`,
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
      title: patch.alias[0]
        ? `${patch.name} | ${patch.alias[0]} 的 贡献历史`
        : `${patch.name} 的 贡献历史`,
      description: histories.length
        ? `${uniqueAuthorsName} 为 ${patch.name} 做出了 ${histories[0].content} 等贡献!`
        : `查看更多 ${patch.name} 的贡献历史`,
      images: [patch.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/patch/${patch.id}/history`
    }
  }
}
