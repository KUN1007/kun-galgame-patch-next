import { generateNullMetadata } from '~/utils/noIndex'
import type { Metadata } from 'next'
import type { TagDetail } from '~/types/api/tag'

export const generateKunMetadataTemplate = (tag: TagDetail): Metadata => {
  return {
    ...generateNullMetadata(`标签 - ${tag.name}`)
  }
}
