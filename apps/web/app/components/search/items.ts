export interface SearchCategory {
  value: SearchType
  textValue: string
  icon: string
  /** Measure word + noun, as it reads after 共 N. */
  countUnit: string
}

export const SEARCH_CATEGORIES: SearchCategory[] = [
  {
    value: 'all',
    textValue: '全部',
    icon: 'lucide:layout-grid',
    countUnit: '个结果'
  },
  {
    value: 'galgame',
    textValue: 'Galgame',
    icon: 'lucide:gamepad-2',
    countUnit: '个 Galgame'
  },
  {
    value: 'entity',
    textValue: '资料库',
    icon: 'lucide:library',
    countUnit: '个条目'
  },
  {
    value: 'resource',
    textValue: '补丁资源',
    icon: 'lucide:puzzle',
    countUnit: '个补丁资源'
  },
  {
    value: 'user',
    textValue: '用户',
    icon: 'lucide:user-round',
    countUnit: '位用户'
  }
]

export const SEARCH_CATEGORY_MAP = Object.fromEntries(
  SEARCH_CATEGORIES.map((category) => [category.value, category])
) as Record<SearchType, SearchCategory>

// A page size per category rather than one for all of them: the galgame lane
// draws the poster grid every other list draws, the other two draw rows.
export const SEARCH_PAGE_SIZE: Record<SearchPagedType, number> = {
  galgame: 24,
  resource: 12,
  user: 12
}

export const isSearchType = (value: unknown): value is SearchType =>
  typeof value === 'string' && value in SEARCH_CATEGORY_MAP

export interface SearchEntityFamilyMeta {
  value: SearchEntityFamily
  textValue: string
  icon: string
  path: string
  /** Reads after N; a 会社 and a 标签 count works, a 角色 does not. */
  countUnit?: string
}

export const SEARCH_ENTITY_FAMILIES: SearchEntityFamilyMeta[] = [
  {
    value: 'character',
    textValue: '角色',
    icon: 'lucide:drama',
    path: '/galgame/character'
  },
  {
    value: 'company',
    textValue: '会社',
    icon: 'lucide:building-2',
    path: '/galgame/official',
    countUnit: '部作品'
  },
  {
    value: 'staff',
    textValue: 'Staff',
    icon: 'lucide:signature',
    path: '/galgame/staff'
  },
  {
    value: 'tag',
    textValue: '标签',
    icon: 'lucide:tag',
    path: '/galgame/tag',
    countUnit: '部作品'
  },
  {
    value: 'series',
    textValue: '系列',
    icon: 'lucide:layers',
    path: '/galgame/series',
    countUnit: '部作品'
  }
]

export const SEARCH_ENTITY_FAMILY_MAP = Object.fromEntries(
  SEARCH_ENTITY_FAMILIES.map((family) => [family.value, family])
) as Record<SearchEntityFamily, SearchEntityFamilyMeta>

// 全部 previews every family at once and each one costs its own catalog
// request, so it asks for a third of what a single family gets.
export const SEARCH_ENTITY_LIMIT = { all: 8, one: 24 }

export const searchEntityPath = (item: SearchEntityItem) =>
  `${SEARCH_ENTITY_FAMILY_MAP[item.family].path}/${item.id}`

export const isSearchEntityFamily = (
  value: unknown
): value is SearchEntityFamily =>
  typeof value === 'string' && value in SEARCH_ENTITY_FAMILY_MAP
