// After D8 / D11 / D12 (2026-04-21), patch-related types are significantly slimmed:
//   - cover/screenshot/char/person/release are owned by the Galgame Wiki (D8)
//   - tag/company also belong to Wiki (D11)
//   - patch itself no longer stores name/introduction/banner/released/content_limit/engine/alias (D12)
//
// The backend enricher merges patch + Wiki galgame into the shape below.

interface GalgameCard {
  id: number
  name: KunLanguage
  vndbId: string
  bid: number | null
  banner: string
  view: number
  download: number
  type: string[]
  language: string[]
  platform: string[]
  content_limit: KunContentLimit
  status: number
  created: Date | string
  resourceUpdateTime: Date | string
  _count: {
    favorite_by: number
    contribute_by: number
    resource: number
    comment: number
  }
  user?: KunUser
  // Optional: raw Wiki galgame object (includes age_limit, original_language, etc.)
  galgame?: {
    id: number
    vndb_id: string
    name_en_us: string
    name_zh_cn: string
    name_ja_jp: string
    name_zh_tw: string
    banner: string
    content_limit: string
    age_limit: string
    original_language: string
    user_id: number
    resource_update_time: string
  }
}

// Patch header (/patch/:id) -- now equivalent to GalgameCard + is_favorite.
interface PatchHeader extends GalgameCard {
  isFavorite: boolean
}

// Patch detail (/patch/:id/detail) -- GalgameCard plus Wiki's full galgame info.
// introductionMarkdown is filled in by the backend via Wiki /galgame/:gid.
interface PatchDetail extends GalgameCard {
  introductionMarkdown: KunLanguage
  updated: string
  wikiTagIds: number[]       // list of Wiki galgame_tag IDs (frontend can call /tag for details as needed)
  wikiOfficialIds: number[]  // list of Wiki galgame_official IDs
  wikiEngineIds: number[]
}
