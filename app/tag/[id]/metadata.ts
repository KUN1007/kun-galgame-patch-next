import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { TagDetail } from '~/types/api/tag'

export const generateKunMetadataTemplate = (tag: TagDetail): Metadata => {
  return {
    title: `拥有标签 ${tag.name} 的 Galgame`,
    description: tag.introduction,
    openGraph: {
      title: `拥有标签 ${tag.name} 的 Galgame`,
      description: tag.introduction,
      type: 'article',
      publishedTime: new Date(tag.created).toISOString(),
      modifiedTime: new Date(tag.created).toISOString(),
      tags: tag.alias
    },
    twitter: {
      card: 'summary',
      title: `拥有标签 ${tag.name} 的 Galgame`,
      description: tag.introduction
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/tag/${tag.id}`
    },
    keywords: [tag.name, ...tag.alias]
  }
}
