import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'
import type { CharDetail } from '~/types/api/char'

export const generateKunMetadataTemplate = (char: CharDetail): Metadata => {
  const displayName = char.name_zh_cn || char.name_ja_jp || char.name_en_us
  const description =
    char.description_zh_cn || char.description_ja_jp || char.description_en_us
  const roleLabel = char.role
    ? char.role === 'protagonist'
      ? '主角'
      : char.role === 'main'
        ? '主要角色'
        : '配角'
    : undefined

  return {
    title: `${displayName} | Galgame 角色`,
    description,
    openGraph: {
      title: `${displayName} | Galgame 角色${roleLabel ? `（${roleLabel}）` : ''}`,
      description,
      type: 'article',
      images: char.image
        ? [char.image, ...kunMoyuMoe.images]
        : kunMoyuMoe.images
    },
    twitter: {
      card: 'summary',
      title: `${displayName} | Galgame 角色`,
      description
    },
    alternates: {
      canonical: `${kunMoyuMoe.domain.main}/character/${char.id}`
    },
    keywords: [
      displayName,
      ...(char.alias || []),
      char.name_ja_jp,
      char.name_en_us,
      char.gender,
      ...(char.roles || [])
    ].filter(Boolean) as string[]
  }
}
