// Matches apps/api/internal/common/site_search.go.

type SearchType = 'all' | 'galgame' | 'resource' | 'user'

// Every category except 全部 has its own paged endpoint.
type SearchPagedType = Exclude<SearchType, 'all'>

interface SearchUser extends KunUser {
  bio: string
  moemoepoint: number
  patch_count: number
  resource_count: number
  comment_count: number
}

interface SearchTotals {
  galgame: number
  resource: number
  user: number
}

// What GET /search/overview and GET /search/quick both answer: every lane at
// once, plus the totals the category rail counts with.
interface SearchLanes {
  galgames: GalgameCard[]
  resources: PatchResource[]
  users: SearchUser[]
  totals: SearchTotals
}

type SearchResultItem = GalgameCard | PatchResource | SearchUser
