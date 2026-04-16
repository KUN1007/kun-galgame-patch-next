import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: 'BLAKE3 文件校验 | 文件完好性校验',
  description: `您可以输入文件的 Hash, 然后上传文件以快速使用 BLAKE3 算法检查文件完好性`,
  openGraph: {
    title: 'BLAKE3 文件校验 | 文件完好性校验',
    description: `您可以输入文件的 Hash, 然后上传文件以快速使用 BLAKE3 算法检查文件完好性`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BLAKE3 文件校验 | 文件完好性校验',
    description: `您可以输入文件的 Hash, 然后上传文件以快速使用 BLAKE3 算法检查文件完好性`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/check-hash`
  }
}
