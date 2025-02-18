import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { KunSiteAuthor } from '~/config/config'
import type { Patch, PatchWalkthrough } from '~/types/api/patch'

export const generateKunMetadataTemplate = (
  patch: Patch,
  walkthroughs: PatchWalkthrough[]
): Metadata => {
  const authors: KunSiteAuthor[] = walkthroughs.map((res) => ({
    name: res.user.name,
    url: `${kunMoyuMoe.domain.main}/user/${res.user.id}/resource`
  }))
  const uniqueAuthors = authors.filter(
    (author, index, self) =>
      index === self.findIndex((a) => a.name === author.name)
  )

  return {
    title: patch.alias.length
      ? `${patch.name} | ${patch.alias[0]} 攻略`
      : `${patch.name} 攻略`,
    authors: uniqueAuthors,
    creator: patch.user.name,
    publisher: patch.user.name,
    description: `Galgame ${patch.name} 攻略`,
    openGraph: {
      title: patch.alias.length
        ? `${patch.name} | ${patch.alias[0]} 攻略`
        : `${patch.name} 攻略`,
      description: `Galgame ${patch.name} 攻略`,
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
        ? `${patch.name} | ${patch.alias[0]} 攻略`
        : `${patch.name} 攻略`,
      description: `Galgame ${patch.name} 攻略`,
      images: [patch.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/patch/${patch.id}/walkthrough`
    }
  }
}
