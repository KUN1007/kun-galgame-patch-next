import { kunMoyuMoe } from '~/config/moyu-moe'
import { convert } from 'html-to-text'
import type { Metadata } from 'next'
import type { KunSiteAuthor } from '~/config/config'
import type { Patch, PatchIntroduction } from '~/types/api/patch'

export const generateKunMetadataTemplate = (
  patch: Patch,
  intro: PatchIntroduction,
  contributor: KunUser[]
): Metadata => {
  const authors: KunSiteAuthor[] = contributor.map((con) => ({
    name: con.name,
    url: `${kunMoyuMoe.domain.main}/user/${con.id}/resource`
  }))
  const uniqueAuthors = authors.filter(
    (author, index, self) =>
      index === self.findIndex((a) => a.name === author.name)
  )

  return {
    title: patch.alias.length
      ? `${patch.name} | ${patch.alias[0]}`
      : `${patch.name}`,
    keywords: [patch.name, ...patch.alias],
    authors: uniqueAuthors,
    creator: patch.user.name,
    publisher: patch.user.name,
    description: convert(intro.introduction, {
      wordwrap: false,
      selectors: [{ selector: 'p', format: 'inline' }]
    }).slice(0, 170),
    openGraph: {
      title: patch.alias.length
        ? `${patch.name} | ${patch.alias[0]}`
        : `${patch.name}`,
      description: convert(intro.introduction).slice(0, 170),
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
        ? `${patch.name} | ${patch.alias[0]}`
        : `${patch.name}`,
      description: convert(intro.introduction).slice(0, 170),
      images: [patch.banner]
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/patch/${patch.id}/introduction`
    }
  }
}
