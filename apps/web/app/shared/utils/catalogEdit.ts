import { catalogConfig } from '@nextmoe/edit-ui-catalog'
import type { EditFieldConfig, EditFieldConfigMap } from '@nextmoe/edit-ui-vue'

export interface CatalogEditTitle {
  lang: string
  title: string
  latin: string
  kind: number
}

// A type alias, not an interface: only an alias is assignable to the
// Record<string, unknown> body useApi takes.
export type CatalogEditRequest = {
  display_name?: string
  olang?: string
  content_rating?: number
  titles?: CatalogEditTitle[]
  note?: string
}

export const CATALOG_EDIT_FIELD = {
  displayName: 'catalog.work.display_name',
  olang: 'catalog.work.olang',
  contentRating: 'catalog.work.content_rating',
  titles: 'catalog.work.titles'
} as const

// The one cast: EditFieldConfig is generic in its `component` slot so core can
// stay framework-free, @nextmoe/edit-ui-vue pins that slot to Vue's Component,
// and catalogConfig returns the unpinned `unknown` one — the single member the
// two shapes differ in, and one nothing here ever sets.
const workPreset = catalogConfig('catalog.work') as EditFieldConfigMap

// The preset pairs titles with a `.suppressed` companion, and a configured
// identityKey is the signal SchemaForm reads to draw a per-row 隐藏 toggle. That
// toggle writes `catalog.work.titles.suppressed`, which moyu's write face — the
// four named fields beside catalogEditFieldKeys in the Go handler, and nothing
// else — drops without a word. Widening the surface is a product decision; until
// it is made the toggle would be a control that does nothing.
const withoutSuppression = (config: EditFieldConfig): EditFieldConfig => {
  const next = { ...config }
  delete next.identityKey
  return next
}

// The preset's own description says only an alias may omit its language, and its
// vocabulary offers 不限定语言 as a real option — but the column is required, and
// buildEditRow tests blankness before it matches an option, so an explicitly
// chosen empty language reads as a missing one. Editing any cell recomputes every
// row, so one such alias lights up 必填 the moment the user touches the field.
// Only the message is wrong: a blank is dropped from the payload either way, and
// moyu's named request sends lang: "" back regardless.
const withOptionalTitleLang = (config: EditFieldConfig): EditFieldConfig => ({
  ...config,
  columns: config.columns?.map((column) =>
    column.key === 'lang' ? { ...column, required: false } : column
  )
})

export const CATALOG_EDIT_CONFIG: EditFieldConfigMap = {
  ...workPreset,
  [CATALOG_EDIT_FIELD.titles]: {
    ...withOptionalTitleLang(
      withoutSuppression(workPreset[CATALOG_EDIT_FIELD.titles]!)
    ),
    // Seeds nothing but the enum: blankEditRow leaves kind empty, an empty enum
    // is not a row the engine accepts, and a row added to a work that already
    // has its official title is an alias.
    newRow: () => ({ kind: 1 })
  },
  [CATALOG_EDIT_FIELD.displayName]: {
    ...workPreset[CATALOG_EDIT_FIELD.displayName]!,
    // applyTitles ends with Update("display_name", deriveDisplayName(titles,
    // work.OLang)) — so editing 标题 overwrites this field, and someone who
    // changed both in one patch would watch their display name revert with
    // nothing on the page having said it would.
    description: `${workPreset[CATALOG_EDIT_FIELD.displayName]!.description ?? ''}保存标题时会被重写为原语言的官方标题。`
  }
}

const normalizeTitles = (value: unknown): CatalogEditTitle[] =>
  (Array.isArray(value) ? value : []).map((item) => {
    const row = item as Record<string, unknown>
    return {
      lang: String(row.lang ?? ''),
      title: String(row.title ?? '').trim(),
      latin: String(row.latin ?? '').trim(),
      kind: Number(row.kind ?? 0)
    }
  })

// SchemaForm emits the engine's full field keys; the BFF's write face is a named
// request whose four fields ARE the guard on what may reach the patch.
export const toCatalogEditRequest = (
  patch: Record<string, unknown>
): CatalogEditRequest => {
  const req: CatalogEditRequest = {}
  if (CATALOG_EDIT_FIELD.displayName in patch) {
    req.display_name = String(patch[CATALOG_EDIT_FIELD.displayName] ?? '')
  }
  if (CATALOG_EDIT_FIELD.olang in patch) {
    req.olang = String(patch[CATALOG_EDIT_FIELD.olang] ?? '')
  }
  if (CATALOG_EDIT_FIELD.contentRating in patch) {
    req.content_rating = Number(patch[CATALOG_EDIT_FIELD.contentRating] ?? 0)
  }
  if (CATALOG_EDIT_FIELD.titles in patch) {
    req.titles = normalizeTitles(patch[CATALOG_EDIT_FIELD.titles])
  }
  return req
}

export const catalogEditFieldLabel = (key: string) =>
  CATALOG_EDIT_CONFIG[key]?.label ?? key
