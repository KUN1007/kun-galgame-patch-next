export const GALGAME_SORT_FIELD_LABEL_MAP: Record<string, string> = {
  resource_update_time: '补丁更新时间',
  created: '游戏创建时间',
  view: '浏览量',
  download: '下载量'
}

const currentYear = new Date().getFullYear()
export const GALGAME_SORT_YEARS = [
  'all',
  'future',
  'unknown',
  ...Array.from({ length: currentYear - 1979 }, (_, i) =>
    String(currentYear - i)
  )
]

export const GALGAME_SORT_YEARS_MAP: Record<string, string> = {
  all: '全部年份',
  future: '未发售',
  unknown: '未知年份'
}

export const GALGAME_SORT_MONTHS = [
  'all',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12'
]
