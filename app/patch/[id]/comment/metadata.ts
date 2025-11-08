import { kunMoyuMoe } from '~/config/moyu-moe'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { Metadata } from 'next'
import type { KunSiteAuthor } from '~/config/config'
import type { PatchHeader, PatchComment } from '~/types/api/patch'

export const generateKunMetadataTemplate = (
  patch: PatchHeader,
  comments: PatchComment[]
): Metadata => {
  const patchName = getPreferredLanguageText(patch.name)
  const patchNameJa = patch.name['ja-jp'] ? patch.name['ja-jp'] : ''
  const pageTitle =
    patchNameJa && patchName !== patchNameJa
      ? `${patchName} | ${patchNameJa} 的评论和评价`
      : `${patchName} 的评论和评价`

  const authors: KunSiteAuthor[] = comments.map((com) => ({
    name: com.user.name,
    url: `${kunMoyuMoe.domain.main}/user/${com.user.id}/resource`
  }))
  const uniqueAuthors = authors.filter(
    (author, index, self) =>
      index === self.findIndex((a) => a.name === author.name)
  )
  const uniqueAuthorsName = uniqueAuthors.map((u) => u.name)

  const pageDescription = comments.length
    ? `${uniqueAuthorsName} 在 ${patchName} 下发布了 ${comments[0].content} 等评论, 查看更多`
    : `点击查看 ${patchName} 下的评论`

  return {
    title: pageTitle,
    keywords: [...patch.alias, '评论'],
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
      canonical: `${kunMoyuMoe.domain.main}/patch/${patch.id}/comment`
    }
  }
}
