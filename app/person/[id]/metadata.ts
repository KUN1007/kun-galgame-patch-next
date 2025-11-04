import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { PersonDetail } from '~/types/api/person'

export const generateKunMetadataTemplate = (person: PersonDetail): Metadata => {
  const displayName =
    person.name_zh_cn || person.name_ja_jp || person.name_en_us
  const description =
    person.description_zh_cn ||
    person.description_ja_jp ||
    person.description_en_us

  return {
    title: `${displayName} | Galgame 人物`,
    description,
    openGraph: {
      title: `${displayName} | Galgame 人物`,
      description,
      type: 'article',
      images: person.image
        ? [person.image, ...kunMoyuMoe.images]
        : kunMoyuMoe.images
    },
    twitter: {
      card: 'summary',
      title: `${displayName} | Galgame 人物`,
      description
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/person/${person.id}`
    },
    keywords: [
      displayName,
      ...(person.alias || []),
      person.name_ja_jp,
      person.name_en_us,
      ...(person.roles || [])
    ].filter(Boolean) as string[]
  }
}
