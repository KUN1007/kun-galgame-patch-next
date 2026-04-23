// D8 / D11 / D12 后（2026-04-21），patch 相关类型大幅精简：
//   - cover/screenshot/char/person/release 由 Galgame Wiki 管理（D8）
//   - tag/company 也归 Wiki（D11）
//   - patch 自身不再存 name/introduction/banner/released/content_limit/engine/alias（D12）
//
// 后端 enricher 把 patch + Wiki galgame 合并成下面的形状返回。

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
  // 可选：Wiki 的原始 galgame 对象（含 age_limit、original_language 等）
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

// 补丁头部（/patch/:id）—— 现在等同于 GalgameCard + is_favorite。
interface PatchHeader extends GalgameCard {
  isFavorite: boolean
}

// 补丁详情（/patch/:id/detail）—— GalgameCard 基础上再附一份 Wiki 的完整 galgame 信息。
// introductionMarkdown 由后端调 Wiki /galgame/:gid 补上。
interface PatchDetail extends GalgameCard {
  introductionMarkdown: KunLanguage
  updated: string
  wikiTagIds: number[]       // Wiki 的 galgame_tag ID 列表（前端可按需再调 /tag 拉详情）
  wikiOfficialIds: number[]  // Wiki 的 galgame_official ID 列表
  wikiEngineIds: number[]
}
