// useGalgameEdit — typed client for the galgame taxonomy + relation surface
// moyu still proxies to the galgame service: links/aliases relations and
// tag/official/engine/series CRUD (incl. taxonomy revision history + revert).
// Galgame metadata editing (revision history, edit-request PRs, direct edit)
// moved to kungal in the "编辑面归 kungal" wave. Every call goes through OUR
// backend proxy (/api/v1/...), which forwards the user's session/access_token
// to the galgame service and relays galgame's {code,message,data} verbatim (see
// internal/patch/handler/galgame_edit.go).
//
// galgame owns authorization (admin/moderator for PUT·DELETE taxonomy + revert;
// any logged-in user for POST taxonomy). We do NOT re-check it client-side — on
// a permission failure the backend forwards galgame's code+message and the caller
// shows it.

export interface GalgamePage<T> {
  items: T[]
  total: number
}

// galgame-proxied relation shapes are aliased to the generated OpenAPI schemas
// (shared/types/galgame-wiki.ts) so a backend wire change fails the drift gate
// + tsc here instead of breaking at runtime. Re-exported so the relation
// surface keeps importing them from this one composable.
export type { GalgameLink, GalgameAlias } from '~/shared/types/galgame-wiki'

// W3 / galgame U3 — taxonomy revision (multi-polymorphic single-table on the
// galgame side; entity column distinguishes tag/official/engine/series). snapshot
// shape varies per entity; we render it generically as Record<string, unknown>.
// See docs/galgame_wiki/04-taxonomy.md §修订与回滚.
export interface TaxonomyRevision {
  id: number
  entity: 'tag' | 'official' | 'engine' | 'series'
  target_id: number
  revision: number
  action: 'created' | 'updated' | 'deleted' | 'reverted' | string
  user_id: number
  user_role: number
  snapshot: Record<string, unknown>
  changed_fields: string[]
  // `deleted` rows only:
  ref_count?: number
  affected_galgame_ids?: number[]
  note: string
  created: string
}

// StaffTaxonomyRow is one row of a staff picker list. It is the IDENTITY subset
// ONLY — the console picks a row and then reads the full record by id
// (taxonomyRecord below). One shape promises "everything the form needs", and it
// is not this one; that separation is what stopped the console silently wiping
// fields it could not see.
export interface StaffTaxonomyRow {
  id: number
  name: string
}

// BrowseTag / BrowseOfficial are the PUBLIC taxonomy pages' entities. Their ids
// are CATALOG ids since wave A2-2 (P2 / R1) — a different key space from the
// staff rows above, which is why they are a different type.
export interface BrowseTag {
  id: number
  name: string
  // Always []: the canonical tag vocabulary has no alias table (the wiki's
  // 8,700 aliases were deliberately not migrated). The key stays on the wire so
  // the loss is visible instead of inferred from a missing key.
  aliases: string[]
  // The safety axis. `sexual` is the flag the catalog publishes; `category` is
  // derived from it ('sexual' | 'content') so every consumer that keys on that
  // literal keeps working off one boolean. COVERAGE: an unmapped folksonomy tag
  // reads false, which means "this source has no such axis", NOT "confirmed
  // safe". `tier`/`kind` below are a different coordinate system entirely — not
  // a rename of the wiki's old category.
  sexual: boolean
  category: string
  tier: 'core' | 'longtail' | 'hidden' | string
  kind: 'content' | 'meta' | string
  description: string
  galgame_count: number
}

export interface BrowseOfficial {
  id: number
  name: string
  aliases: string[]
  // The catalog's label vocabulary: game_brand | bunko | publisher |
  // anime_studio | doujin_circle | group. It REPLACED the wiki's
  // company|individual|amateur — a visible wording change, and the canonical
  // vocabulary from here on.
  category: string
  lang: string
  link: string
  description: string
  galgame_count: number
}

type Q = Record<string, string | number | boolean | undefined>

const qs = (q?: Q): string => {
  if (!q) return ''
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const useGalgameEdit = () => {
  const api = useApi()

  // ─── Relations (writes only) ────────────────────────
  // The list/prefill GETs were retired in wave A1 — no page ever called them,
  // and the backend dropped both routes with their reshapers.
  const createLink = (gid: number, body: { name: string; link: string }) =>
    api.post(`/galgame/${gid}/links`, body)
  const deleteLink = (gid: number, id: number) =>
    api.delete(`/galgame/${gid}/links`, { id })

  const createAlias = (gid: number, name: string) =>
    api.post(`/galgame/${gid}/aliases`, { name })
  const deleteAlias = (gid: number, id: number) =>
    api.delete(`/galgame/${gid}/aliases`, { id })

  // ─── Taxonomy: the staff EDIT-FORM read-back ────────
  //
  // The update ops below are WHOLESALE replacements — a field the form cannot
  // prefill is a field it erases on save. The list rows the console picks from
  // carry only an identity subset, so every edit used to wipe `alias` (all four
  // families), tag/official `description`, and a series' entire membership.
  // This read (wave A2-2, backed by the staff face's per-family record) is the
  // fix: read the record, prefill the form, then replace.
  //
  // Wiki ids end to end — the same key space the update ops and the revision
  // history take. The PUBLIC browse pages moved to catalog ids; this lane
  // deliberately did not follow them.
  interface StaffTaxonomyRecord {
    id: number
    name: string
    category?: string
    original?: string
    link?: string
    lang?: string
    description?: string
    alias?: string[]
    galgame_ids?: number[]
  }
  const taxonomyRecord = (
    kind: 'tag' | 'official' | 'engine' | 'series',
    id: number
  ) => api.get<StaffTaxonomyRecord>(`/taxonomy/${kind}/${id}`)

  // ─── Taxonomy: tag ──────────────────────────────────
  const tagSearch = (q: string, category?: string, limit = 30) =>
    api.get<{ items: StaffTaxonomyRow[]; total: number }>(
      `/tag/search${qs({ q, category, limit })}`
    )
  const createTag = (body: {
    name: string
    category: string
    description?: string
    alias?: string[]
  }) => api.post<StaffTaxonomyRow>('/tag', body)
  const updateTag = (body: {
    tag_id: number
    name: string
    category: string
    description?: string
    alias?: string[]
  }) => api.put<StaffTaxonomyRow>('/tag', body)
  // Two-stage safe delete (docs/galgame_wiki/04-taxonomy.md, 00 §15.1):
  // without force, galgame rejects with code:7 + reference count if the tag is
  // still used; force=true cascades. Same for official/engine.
  const deleteTag = (id: number, force = false) =>
    api.delete<{
      deleted: boolean
      forced: boolean
      purged_relations: number
      purged_aliases: number
    }>(`/tag/${id}${force ? '?force=true' : ''}`)

  // ─── Taxonomy: official ─────────────────────────────
  const officialSearch = (
    q: string,
    category?: string,
    lang?: string,
    limit = 30
  ) =>
    api.get<{ items: StaffTaxonomyRow[]; total: number }>(
      `/official/search${qs({ q, category, lang, limit })}`
    )
  const createOfficial = (body: {
    name: string
    category: string
    original?: string
    link?: string
    lang?: string
    description?: string
    alias?: string[]
  }) => api.post<StaffTaxonomyRow>('/official', body)
  const updateOfficial = (body: {
    official_id: number
    name: string
    category: string
    link?: string
    lang?: string
    description?: string
    alias?: string[]
  }) => api.put<StaffTaxonomyRow>('/official', body)
  const deleteOfficial = (id: number, force = false) =>
    api.delete<{
      deleted: boolean
      forced: boolean
      purged_relations: number
      purged_aliases: number
    }>(`/official/${id}${force ? '?force=true' : ''}`)

  // ─── Taxonomy: engine ───────────────────────────────
  // The engine and series panes are staff SEARCH lanes now (same face, bounded
  // instead of "every row"), so both answer the {items,total} envelope its
  // tag/official siblings always did.
  const engineList = () =>
    api.get<{ items: StaffTaxonomyRow[]; total: number }>('/engine')
  const createEngine = (body: {
    name: string
    description?: string
    alias?: string[]
  }) => api.post<StaffTaxonomyRow>('/engine', body)
  const updateEngine = (body: {
    engine_id: number
    name: string
    description?: string
    alias?: string[]
  }) => api.put<StaffTaxonomyRow>('/engine', body)
  // engine has no alias table → response has no purged_aliases.
  const deleteEngine = (id: number, force = false) =>
    api.delete<{
      deleted: boolean
      forced: boolean
      purged_relations: number
    }>(`/engine/${id}${force ? '?force=true' : ''}`)

  // ─── Taxonomy: series ───────────────────────────────
  // seriesSearch (`GET /series/search`) and seriesDetail (`GET /series/:id`)
  // were retired in wave A1 alongside their backend routes — census-verified
  // uncalled. The list read below stays: pages/galgame/taxonomy.vue drives it.
  const seriesList = (opts?: { page?: number; limit?: number }) =>
    api.get<GalgamePage<StaffTaxonomyRow>>(`/series${qs(opts as Q)}`)
  const createSeries = (body: {
    name: string
    description?: string
    galgame_ids: number[]
  }) => api.post<StaffTaxonomyRow>('/series', body)
  const seriesModal = (ids: number[]) =>
    api.post<unknown[]>('/series/modal', { ids })
  const updateSeries = (
    id: number,
    body: { name?: string; description?: string; galgame_ids?: number[] }
  ) => api.put(`/series/${id}`, body)
  const deleteSeries = (id: number) => api.delete(`/series/${id}`)

  // ─── W3 / PR4 — Taxonomy 修订历史 + 回滚（4 实体 × 3 端点 = 12 个方法）─
  // 全部由通用 GalgameEditProxy 代理；galgame 端鉴权（GET 公开、revert 需 admin/
  // moderator）；snapshot 形态因 entity 而异（TagSnapshot / OfficialSnapshot /
  // EngineSnapshot / SeriesSnapshot），UI 层用泛型 Record 展示，无需逐型建模。
  // docs/galgame_wiki/04-taxonomy.md §修订与回滚 + 00-handbook §15.
  type TaxKind = 'tag' | 'official' | 'engine' | 'series'

  const taxListRevisions = (
    kind: TaxKind,
    id: number,
    opts?: { page?: number; limit?: number }
  ) =>
    api.get<GalgamePage<TaxonomyRevision>>(
      `/${kind}/${id}/revisions${qs(opts as Q)}`
    )

  const taxGetRevision = (kind: TaxKind, id: number, rev: number) =>
    api.get<TaxonomyRevision>(`/${kind}/${id}/revisions/${rev}`)

  const taxRevert = (kind: TaxKind, id: number, revision: number) =>
    api.post<{ reverted_to: number }>(`/${kind}/${id}/revert`, { revision })

  // ─── Taxonomy detail pages (tag / official "view-by-id" pages) ─────────
  // galgame's `GET /<entity>/:name?<entity>_id=X` returns the entity itself +
  // the associated galgame list (paginated, with optional sort + NSFW filter).
  // `:name` is cosmetic per galgame convention (Wikipedia-style URL beauty);
  // the real filter is the *_id query param. We always pass "_" as the path
  // segment to keep the URL short — moyu's standalone detail pages already
  // own the human-readable URL on their side.
  // docs/galgame_wiki/04-taxonomy.md §标签 (Tag) / 开发商 (Official).
  interface TaxonomyListOpts {
    page?: number
    limit?: number
    sort_field?: string
    sort_order?: 'asc' | 'desc'
    content_limit?: 'sfw' | 'nsfw'
  }
  // Backend (GalgameTaxonomyDetailProxy) rewrites galgame's flat `galgame` brief
  // array into moyu's enriched `GalgameCard` shape so tag/official detail
  // pages can render the same <GalgameCard> as the home / galgame index —
  // the FE no longer has to map between two shapes. Wire field is
  // standardized on `galgames` here.
  const tagDetail = (id: number, opts?: TaxonomyListOpts) =>
    api.get<{
      tag?: BrowseTag
      galgames?: GalgameCard[]
      total?: number
    }>(`/tag/_${qs({ tag_id: id, ...(opts as Q) })}`)

  const officialDetail = (id: number, opts?: TaxonomyListOpts) =>
    api.get<{
      official?: BrowseOfficial
      galgames?: GalgameCard[]
      total?: number
    }>(`/official/_${qs({ official_id: id, ...(opts as Q) })}`)

  return {
    taxonomyRecord,
    createLink,
    deleteLink,
    createAlias,
    deleteAlias,
    tagSearch,
    createTag,
    updateTag,
    deleteTag,
    officialSearch,
    createOfficial,
    updateOfficial,
    deleteOfficial,
    engineList,
    createEngine,
    updateEngine,
    deleteEngine,
    seriesList,
    createSeries,
    seriesModal,
    updateSeries,
    deleteSeries,
    taxListRevisions,
    taxGetRevision,
    taxRevert,
    tagDetail,
    officialDetail
  }
}
