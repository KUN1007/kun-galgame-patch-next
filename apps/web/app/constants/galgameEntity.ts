import type { KunUIColor } from '@kungal/ui-core'

export const GALGAME_CHARACTER_KIND_MAP: Record<string, string> = {
  main: '主角',
  secondary: '配角',
  appears: '登场'
}

export const GALGAME_CHARACTER_KIND_COLOR: Record<string, KunUIColor> = {
  main: 'primary'
}

export const GALGAME_CHARACTER_SPOILER_MAP: Record<number, string> = {
  1: '轻微剧透',
  2: '严重剧透'
}

interface ExternalRatingMeta {
  label: string
  // The source's own maximum. Catalog ships every source on its native scale
  // and normalizes nothing, so this is the divisor any cross-source comparison
  // has to use before it means anything.
  max: number
  suffix: string
  hint: string
  format: (score: number) => string
  // The bucket keys this source's histogram uses, ascending. The payload is
  // sparse: a key catalog does not send is a real zero, not missing data.
  buckets: number[]
  bucketLabel: (key: number) => string
  link?: (ref: string) => string
}

const pointBuckets = (max: number) =>
  Array.from({ length: max }, (_, index) => index + 1)

const decimal = (score: number) => String(Number(score.toFixed(2)))

export const KUN_EXTERNAL_RATING_ORDER = [
  'vndb',
  'bangumi',
  'erogamescape',
  'dlsite'
] as const

export const KUN_EXTERNAL_RATING_MAP: Record<string, ExternalRatingMeta> = {
  vndb: {
    label: 'VNDB',
    max: 10,
    suffix: '/10',
    hint: 'VNDB 用户评分的加权平均',
    format: decimal,
    buckets: pointBuckets(10),
    bucketLabel: String,
    link: (ref) => `https://vndb.org/${ref}`
  },
  bangumi: {
    label: 'Bangumi',
    max: 10,
    suffix: '/10',
    hint: 'Bangumi 用户评分的平均值',
    format: decimal,
    buckets: pointBuckets(10),
    bucketLabel: String,
    link: (ref) => `https://bgm.tv/subject/${ref}`
  },
  erogamescape: {
    label: '批评空间',
    max: 100,
    suffix: '点台',
    hint: '批评空间用户评分的中位数',
    // 批评空间 quotes a score as the band it falls in ("75点台"), so this
    // truncates rather than rounds: 75.8 is still the 75 band.
    format: (score) => String(Math.floor(score)),
    // Its histogram is deciles keyed by the lower bound, where 100 is the single
    // top score rather than a range. Folding those onto a 1-100 point axis would
    // leave 90 empty columns and drop the 0 bucket entirely.
    buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    bucketLabel: (key) => (key === 100 ? '100' : `${key}-${key + 9}`)
  },
  dlsite: {
    label: 'DLsite',
    max: 5,
    suffix: '/5',
    hint: 'DLsite 购买者的平均星级',
    format: decimal,
    buckets: pointBuckets(5),
    bucketLabel: String
  }
}

export const externalRatingMeta = (source: string): ExternalRatingMeta =>
  KUN_EXTERNAL_RATING_MAP[source] ?? {
    label: source,
    max: 10,
    suffix: '',
    hint: '',
    format: decimal,
    buckets: pointBuckets(10),
    bucketLabel: String
  }
