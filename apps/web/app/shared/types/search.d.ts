// Matches apps/api/internal/common/site_search.go.

type SearchType = 'all' | 'galgame' | 'entity' | 'resource' | 'user'

// 全部 pages nothing and 资料库 pages one family at a time through its own
// endpoint; the three left over share GET /search.
type SearchPagedType = Exclude<SearchType, 'all' | 'entity'>

// No engine: catalog indexes one, moyu has no /galgame/engine/:id to open.
type SearchEntityFamily =
  | 'character'
  | 'company'
  | 'staff'
  | 'tag'
  | 'series'

interface SearchUser extends KunUser {
  bio: string
  moemoepoint: number
  patch_count: number
  resource_count: number
  comment_count: number
}

// Name arrives on all four slots rather than pre-rendered, so the reader's
// 标题语言 setting picks between them. Render with getPreferredLanguageText.
interface SearchEntityItem {
  id: number
  family: SearchEntityFamily
  name: KunLanguage
  // image_service content hash, not a URL: resolve it with imageServiceUrl.
  // A staff row never carries one — catalog holds no credit-name photos.
  image_hash?: string
  work_count: number
}

interface SearchEntityGroup {
  family: SearchEntityFamily
  total: number
  items: SearchEntityItem[]
}

interface SearchEntityResult {
  groups: SearchEntityGroup[]
}

interface SearchTotals {
  galgame: number
  entity: number
  resource: number
  user: number
}

// What GET /search/overview and GET /search/quick both answer: every lane at
// once, plus the totals the category rail counts with. The palette asks for no
// 资料库 rows, so entities is empty there.
interface SearchLanes {
  galgames: GalgameCard[]
  entities: SearchEntityGroup[]
  resources: PatchResource[]
  users: SearchUser[]
  totals: SearchTotals
}

type SearchResultItem = GalgameCard | PatchResource | SearchUser
