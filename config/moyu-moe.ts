import { SUPPORTED_TYPE_MAP } from '~/constants/resource'
import type { KunSiteConfig } from './config'

export const kunMoyuMoe: KunSiteConfig = {
  title: '鲲 Galgame 补丁 - 开源 Galgame 补丁资源下载站',
  titleShort: '鲲 Galgame 补丁',
  template: '%s - 鲲 Galgame 补丁',
  description:
    '开源, 免费, 零门槛的 Galgame 补丁资源下载站, 提供 Windows, 安卓, KRKR, Tyranor 等各类平台的 Galgame 补丁资源下载。最先进的 Galgame 补丁资源站！永远免费！',
  keywords: [
    'Galgame',
    '资源',
    '下载',
    '补丁',
    '网站',
    '免费',
    '开源',
    'Next.js',
    ...Object.values(SUPPORTED_TYPE_MAP)
  ],
  canonical: 'https://www.kungal.com',
  author: [
    { name: '鲲', url: 'https://soft.moe' },
    { name: '鲲 Galgame', url: 'https://nav.kungal.org' },
    { name: '鲲 Galgame 论坛', url: 'https://www.kungal.com' }
  ],
  creator: {
    name: '鲲 Galgame',
    mention: '@kungalgame',
    url: 'https://nav.kungal.org'
  },
  publisher: {
    name: '鲲 Galgame',
    mention: '@kungalgame',
    url: 'https://nav.kungal.org'
  },
  domain: {
    main: 'https://www.moyu.moe',
    imageBed: 'https://image.moyu.moe',
    storage: 'https://oss.moyu.moe',
    kungal: 'https://www.kungal.com'
  },
  og: {
    title: '鲲 Galgame 补丁 - 开源 Galgame 补丁资源下载站',
    description:
      '开源, 免费, 零门槛的 Galgame 补丁资源下载站, 提供 Windows, 安卓, KRKR, Tyranor 等各类平台的 Galgame 补丁资源下载。最先进的 Galgame 补丁资源站！永远免费！',
    image: 'https://moyu.moe/kungalgame.webp',
    url: 'https://www.moyu.moe'
  },
  images: [
    {
      url: 'https://moyu.moe/kungalgame.webp',
      width: 1920,
      height: 1080,
      alt: '鲲 Galgame 补丁 - 开源 Galgame 补丁资源下载站'
    }
  ]
}
