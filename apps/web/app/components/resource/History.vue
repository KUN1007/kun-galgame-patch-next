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

    <p class="text-default-500 text-sm">
      该补丁资源每次编辑的字段变化。为安全起见，下载链接、提取码与解压密码只标记为「已更新」，不显示内容。
    </p>

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

        <!-- Field diff: left = before, right = after. -->
        <div class="space-y-2">
          <div v-for="(c, i) in rev.changes" :key="i">
            <div class="text-default-500 mb-1 text-xs font-medium">
              {{ c.label }}
            </div>
            <div class="flex items-stretch gap-2">
              <div
                class="border-danger/30 bg-danger/5 text-danger-700 min-w-0 flex-1 rounded-lg border px-2 py-1 text-sm break-words"
              >
                <span class="text-default-400 block text-[10px]">改动前</span>
                {{ c.before || '(空)' }}
              </div>
              <KunIcon
                name="lucide:arrow-right"
                class="text-default-400 size-4 shrink-0 self-center"
              />
              <div
                class="border-success/30 bg-success/5 text-success-700 min-w-0 flex-1 rounded-lg border px-2 py-1 text-sm break-words"
              >
                <span class="text-default-400 block text-[10px]">改动后</span>
                {{ c.after || '(空)' }}
              </div>
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
