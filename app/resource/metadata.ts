import { kunMoyuMoe } from '~/config/moyu-moe'
import {
  SUPPORTED_TYPE_MAP,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM
} from '~/constants/resource'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: 'Galgame 补丁资源下载',
  description: `最新最全的 Galgame 补丁资源列表, 包括 ${Object.values(SUPPORTED_TYPE_MAP)}, 支持 ${Object.values(SUPPORTED_LANGUAGE_MAP)}, 包含 ${Object.values(SUPPORTED_PLATFORM)} 下载`,
  openGraph: {
    title: 'Galgame 补丁资源下载',
    description: `最新最全的 Galgame 补丁资源, 列表, 包括 ${Object.values(SUPPORTED_TYPE_MAP)}, 支持 ${Object.values(SUPPORTED_LANGUAGE_MAP)}, 包含 ${Object.values(SUPPORTED_PLATFORM)} 下载`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galgame 补丁资源下载',
    description: `最新最全的 Galgame 补丁资源, 列表, 包括 ${Object.values(SUPPORTED_TYPE_MAP)}, 支持 ${Object.values(SUPPORTED_LANGUAGE_MAP)}, 包含 ${Object.values(SUPPORTED_PLATFORM)} 下载`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/resource`
  }
}
