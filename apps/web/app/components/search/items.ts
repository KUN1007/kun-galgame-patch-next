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
