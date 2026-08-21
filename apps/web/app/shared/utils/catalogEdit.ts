import type { EditFieldConfigMap, EditSelectOption } from '@nextmoe/edit-ui-vue'

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

const OLANG_OPTIONS: EditSelectOption[] = [
  { value: 'ja', label: '日语 ja' },
  { value: 'zh', label: '中文 zh' },
  { value: 'zh-Hans', label: '简体中文 zh-Hans' },
  { value: 'zh-Hant', label: '繁體中文 zh-Hant' },
  { value: 'en', label: '英语 en' },
  { value: 'ko', label: '韩语 ko' }
]

const RATING_OPTIONS: EditSelectOption[] = [
  { value: 0, label: '全年龄' },
  { value: 1, label: '含敏感内容' },
  { value: 2, label: 'R18' }
]

// The engine accepts kind 0/1/2 only (editspec/work_titles.go: "kind must be 0
// (official), 1 (alias) or 2 (abbreviation)"). Search hints are kind 3 and are
// maintained by the importers — offering them here would 422 on save.
const TITLE_KIND_OPTIONS: EditSelectOption[] = [
  { value: 0, label: '正式名' },
  { value: 1, label: '别名' },
  { value: 2, label: '简称' }
]

const titleKindLabel = (kind: unknown) =>
  TITLE_KIND_OPTIONS.find((o) => o.value === Number(kind))?.label ?? ''

export const CATALOG_EDIT_CONFIG: EditFieldConfigMap = {
  [CATALOG_EDIT_FIELD.titles]: {
    label: '标题（正式名 / 别名）',
    control: 'object-list',
    columns: [
      { key: 'title', label: '标题', width: 'flex-[2]' },
      { key: 'lang', label: '语言', control: 'select', options: OLANG_OPTIONS },
      {
        key: 'kind',
        label: '类型',
        control: 'select',
        options: TITLE_KIND_OPTIONS
      },
      { key: 'latin', label: '罗马字（可选）' }
    ],
    newRow: () => ({ lang: 'ja', title: '', latin: '', kind: 1 }),
    formatItem: (item) => {
      const row = item as Record<string, unknown>
      const kind = titleKindLabel(row.kind)
      return `${String(row.title ?? '')}${row.lang ? ` (${String(row.lang)})` : ''}${kind ? ` · ${kind}` : ''}`
    },
    description: '至少需要一个「正式名」；游戏的展示名会自动取原语言的正式名。'
  },
  [CATALOG_EDIT_FIELD.displayName]: {
    label: '展示名（保存标题时会自动派生）'
  },
  [CATALOG_EDIT_FIELD.olang]: {
    label: '原语言',
    options: OLANG_OPTIONS
  },
  [CATALOG_EDIT_FIELD.contentRating]: {
    label: '内容分级',
    options: RATING_OPTIONS
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
