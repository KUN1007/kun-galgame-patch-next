<script setup lang="ts">
// The resource's change history, expanded inline under the download card.
//
// Same public endpoint the list rows open in a modal
// (GET /patch/resource/:id/revisions): one entry per edit, each carrying the
// per-field "before → after" diff computed server-side. It is safe to render to
// anyone — service.diffResourceFields records the download link / 提取码 / 解压密码
// only as "已更新", never their values.
//
// Inline rather than behind a click, because on the detail page the history is
// part of what a reader is judging: whether a patch has been re-uploaded, and
// what changed when. Nothing renders when a resource has never been edited —
// most have not, and an empty "暂无更改历史" card would be noise on every page.
//
// Costs one extra request per detail view. Unavoidable for an always-visible
// section: knowing whether there is anything to show IS the request.

// Imported explicitly rather than leaning on the shared/utils auto-import, which
// is the same form Gallery.vue / Covers.vue use for resolveBannerUrl. The types
// need it regardless (textDiff exports module types, not the ambient globals the
// .d.ts files declare), and naming the module keeps the dependency visible.
import {
  diffTextSegments,
  diffTextStats,
  type TextDiffOp,
  type TextDiffSegment
} from '~/shared/utils/textDiff'

interface Props {
  resourceId: number
}

const props = defineProps<Props>()

const api = useApi()

// Mirrors the wire shape of the revisions endpoint.
interface ResourceFieldChange {
  field: string
  label: string
  before: string
  after: string
}
interface ResourceRevisionItem {
  id: number
  action: string
  reason: string
  actor_role: number
  created_at: string
  changes: ResourceFieldChange[]
}

const ACTOR_ROLE_LABEL: Record<number, string> = {
  0: '未知',
  1: '普通用户',
  2: '版主',
  3: '管理员'
}

// `action` is a column with room to grow: today UpdateResource is its only
// writer and always stores "updated". Anything else falls back to the raw value
// rather than being labelled 编辑 — a new action must not silently inherit the
// old wording.
const ACTION_LABEL: Record<string, string> = {
  updated: '编辑'
}

// ─── Diff rendering ───────────────────────────────────
// One UNIFIED block per field with only the changed runs tinted, replacing the
// before/after columns this started as. Those columns printed the whole field
// twice, so the actual edit was invisible in them — a real revision here changed
// `DL版版` to `DL版`, one character inside 381, and nothing about two tinted
// walls of text pointed at it.
//
// Long untouched runs are elided the way a code review folds context: the reader
// came for the change, not the 250 characters around it. Per-field toggle to see
// everything.
const ELIDE_OVER = 180
const CONTEXT = 60

type DiffPiece =
  | { kind: 'text'; op: TextDiffOp; text: string }
  | { kind: 'elision'; count: number }

const piecesFor = (
  segments: TextDiffSegment[],
  expanded: boolean
): DiffPiece[] => {
  if (expanded || segments.length === 1) {
    return segments.map((s) => ({ kind: 'text', op: s.op, text: s.text }))
  }
  const out: DiffPiece[] = []
  segments.forEach((s, i) => {
    if (s.op !== 'equal' || s.text.length <= ELIDE_OVER) {
      out.push({ kind: 'text', op: s.op, text: s.text })
      return
    }
    // Keep the context on the side that faces a change: the run before the first
    // change only needs its tail, the run after the last only its head.
    const isFirst = i === 0
    const isLast = i === segments.length - 1
    if (isFirst) {
      out.push({ kind: 'elision', count: s.text.length - CONTEXT })
      out.push({ kind: 'text', op: 'equal', text: s.text.slice(-CONTEXT) })
    } else if (isLast) {
      out.push({ kind: 'text', op: 'equal', text: s.text.slice(0, CONTEXT) })
      out.push({ kind: 'elision', count: s.text.length - CONTEXT })
    } else {
      out.push({ kind: 'text', op: 'equal', text: s.text.slice(0, CONTEXT) })
      out.push({ kind: 'elision', count: s.text.length - 2 * CONTEXT })
      out.push({ kind: 'text', op: 'equal', text: s.text.slice(-CONTEXT) })
    }
  })
  return out
}

// Expanded state keyed per revision+field, so opening one long note does not
// unfold every other change on the page.
const expandedKeys = ref(new Set<string>())
const keyOf = (revId: number, field: string) => `${revId}:${field}`
const isExpanded = (revId: number, field: string) =>
  expandedKeys.value.has(keyOf(revId, field))
const toggleExpanded = (revId: number, field: string) => {
  const k = keyOf(revId, field)
  const next = new Set(expandedKeys.value)
  if (next.has(k)) next.delete(k)
  else next.add(k)
  expandedKeys.value = next
}

// Diffing every field of every revision on the page is pure computation over
// data already fetched, so do it once here rather than per re-render.
interface RenderedChange {
  field: string
  label: string
  segments: TextDiffSegment[]
  stats: { added: number; removed: number }
  elidable: boolean
}

const renderChanges = (rev: ResourceRevisionItem): RenderedChange[] =>
  rev.changes.map((c) => {
    const segments = diffTextSegments(c.before, c.after)
    return {
      field: c.field,
      label: c.label,
      segments,
      stats: diffTextStats(segments),
      elidable:
        segments.length > 1 &&
        segments.some((s) => s.op === 'equal' && s.text.length > ELIDE_OVER)
    }
  })

const page = ref(1)
const limit = 20

const { data, pending } = await useAsyncData(
  () => `resource-revisions-${props.resourceId}-${page.value}`,
  async () => {
    const res = await api.get<{
      items: ResourceRevisionItem[]
      total: number
    }>(
      `/patch/resource/${props.resourceId}/revisions?page=${page.value}&limit=${limit}`
    )
    // A failure here must not take the page down with it — the history is
    // supplementary to the download, which is why this resolves to empty
    // instead of throwing.
    if (res.code !== 0) return { items: [], total: 0 }
    return { items: res.data?.items ?? [], total: res.data?.total ?? 0 }
  },
  { watch: [page] }
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

// Only the FIRST load decides whether the section exists at all; later pages
// keep it mounted while they fetch (`pending` flips on every page change).
const hasHistory = computed(() => total.value > 0)
</script>

<template>
  <div
    v-if="hasHistory"
    class="border-default/20 bg-content1 shadow-kun-sm space-y-4 rounded-2xl border p-5"
  >
    <div class="flex items-center gap-2">
      <KunIcon name="lucide:history" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">更改历史</h2>
      <KunChip color="default" variant="flat" size="sm">
        {{ total }} 次编辑
      </KunChip>
    </div>

    <div class="text-default-500 space-y-1 text-sm">
      <p>
        该补丁资源每次编辑的字段变化，只标出改动的部分：
        <del
          class="bg-danger/15 text-danger-700 decoration-danger-700/50 rounded px-1"
        >删除</del>
        <ins
          class="bg-success/15 text-success-700 ml-1 rounded px-1 no-underline"
        >新增</ins>
      </p>
      <p>
        为安全起见，下载链接、提取码与解压密码只标记为「已更新」，不显示内容。
      </p>
    </div>

    <KunLoading v-if="pending" description="正在加载更改历史..." />

    <div v-else class="space-y-3">
      <div
        v-for="rev in items"
        :key="rev.id"
        class="border-default/20 bg-default-50 space-y-3 rounded-xl border p-3"
      >
        <!-- Meta: what kind of change, when, by which role, and why. -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <KunChip color="primary" variant="flat" size="xs">
            <KunIcon name="lucide:pencil-line" class="size-3" />
            {{ ACTION_LABEL[rev.action] ?? rev.action }}
          </KunChip>
          <span class="text-default-500">
            {{
              formatDate(rev.created_at, {
                isShowYear: true,
                isPrecise: true
              })
            }}
          </span>
          <KunChip color="default" variant="flat" size="xs">
            {{ ACTOR_ROLE_LABEL[rev.actor_role] ?? '未知' }}
          </KunChip>
          <span v-if="rev.reason" class="text-default-400">
            原因：{{ rev.reason }}
          </span>
        </div>

        <!-- Field diff: one unified block, only the changed runs tinted. -->
        <div class="space-y-3">
          <div v-for="c in renderChanges(rev)" :key="c.field">
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <span class="text-default-500 text-xs font-medium">
                {{ c.label }}
              </span>
              <span
                v-if="c.stats.added"
                class="text-success-700 text-[10px] tabular-nums"
              >
                +{{ c.stats.added }}
              </span>
              <span
                v-if="c.stats.removed"
                class="text-danger-700 text-[10px] tabular-nums"
              >
                −{{ c.stats.removed }}
              </span>
              <button
                v-if="c.elidable"
                type="button"
                class="text-primary hover:underline text-[10px]"
                @click="toggleExpanded(rev.id, c.field)"
              >
                {{ isExpanded(rev.id, c.field) ? '折叠未改动内容' : '显示全部' }}
              </button>
            </div>

            <!-- whitespace-pre-wrap keeps the note's own line structure: it is
                 markdown source, and collapsing its newlines was half of why
                 the old view was unreadable. -->
            <div
              class="border-default/30 bg-content1 rounded-lg border px-2 py-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap"
            >
              <template
                v-for="(p, pi) in piecesFor(
                  c.segments,
                  isExpanded(rev.id, c.field)
                )"
                :key="pi"
              >
                <del
                  v-if="p.kind === 'text' && p.op === 'delete'"
                  class="bg-danger/15 text-danger-700 decoration-danger-700/50 rounded px-0.5"
                >{{ p.text }}</del>
                <ins
                  v-else-if="p.kind === 'text' && p.op === 'insert'"
                  class="bg-success/15 text-success-700 rounded px-0.5 no-underline"
                >{{ p.text }}</ins>
                <span
                  v-else-if="p.kind === 'text'"
                  class="text-default-500"
                >{{ p.text }}</span>
                <span
                  v-else
                  class="text-default-400 bg-default-100 mx-1 rounded px-1 text-[10px] select-none"
                  >⋯ 省略 {{ p.count }} 字未改动 ⋯</span
                >
              </template>
              <span
                v-if="!c.segments.length"
                class="text-default-400 text-xs"
              >
                (空)
              </span>
            </div>
          </div>
          <p v-if="!rev.changes.length" class="text-default-400 text-sm">
            无字段变化
          </p>
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex justify-center pt-1">
        <KunPagination v-model:current-page="page" :total-page="totalPages" />
      </div>
    </div>
  </div>
</template>
