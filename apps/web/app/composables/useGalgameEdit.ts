// useGalgameEdit — typed client for what is left of the galgame taxonomy +
// relation surface. Galgame metadata editing (revision history, edit-request
// PRs, direct edit) moved to kungal in the "编辑面归 kungal" wave, and the
// taxonomy STAFF console (tag/official/engine/series CRUD + revision history +
// revert) was retired in wave 159 (N4) — the catalog owns the vocabulary now
// and kungal hosts the one staff surface.
//
// What remains: the links/aliases relation writes, and the two PUBLIC taxonomy
// browse pages. Every call goes through OUR backend proxy (/api/v1/...), which
// relays the upstream {code,message,data} verbatim (see
// internal/patch/handler/galgame_edit.go).

// galgame-proxied relation shapes are aliased to the vendored wire types
// (shared/types/galgame-wiki.ts) so a backend wire change fails tsc here
// instead of breaking at runtime. Re-exported so the relation surface keeps
// importing them from this one composable.
export type { GalgameLink, GalgameAlias } from '~/shared/types/galgame-wiki'

// BrowseTag / BrowseOfficial are the PUBLIC taxonomy pages' entities. Their ids
// are CATALOG ids since wave A2-2 (P2 / R1).
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

  // `moved_to` arrives ALONE, in place of the record, when this label id was
  // merged away in the catalog: the company lives on under that id and the page
  // 301s there. Never alongside the record — one company must not be reachable
  // at two URLs.
  const officialDetail = (id: number, opts?: TaxonomyListOpts) =>
    api.get<{
      official?: BrowseOfficial
      galgames?: GalgameCard[]
      total?: number
      moved_to?: number
    }>(`/official/_${qs({ official_id: id, ...(opts as Q) })}`)

  return {
    createLink,
    deleteLink,
    createAlias,
    deleteAlias,
    tagDetail,
    officialDetail
  }
}
