<script setup lang="ts">
import { ALL_SUPPORTED_TYPE, SUPPORTED_TYPE_MAP } from '~/constants/resource'
import { GALGAME_SORT_FIELD_LABEL_MAP } from '~/constants/galgame'

defineOptions({ name: 'galgame-list' })

const route = useRoute()
const router = useRouter()
const api = useApi()
const settingStore = useSettingStore()

useKunSeoMeta({
  title: 'Galgame 列表',
  description:
    '浏览资料库中的全部 Galgame，打开任意作品即可发布补丁。按热度、资源更新时间、浏览量、下载量排序，支持按翻译类型筛选，免费下载 Windows / 安卓 / KRKR / Tyranor 等平台的 Galgame 中文汉化补丁。'
})

const page = ref(Number(route.query.page ?? 1))
const pageHref = usePageHref()
const selectedType = ref(String(route.query.type ?? 'all'))
const sortField = ref(String(route.query.sort_field ?? 'popularity'))
const sortOrder = ref(String(route.query.sort_order ?? 'desc'))

const releasedFrom = ref(String(route.query.released_from ?? ''))
const releasedTo = ref(String(route.query.released_to ?? ''))
const parseMonthsQuery = (q: unknown): number[] => {
  const s = String(q ?? '').trim()
  if (!s) return []
  return s
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12)
}
const selectedMonths = ref<number[]>(parseMonthsQuery(route.query.released_months))

const limit = 24

interface ListResponse {
  galgames: GalgameCard[]
  total: number
}

const { data, pending, refresh } = await useAsyncData<ListResponse>(
  'galgame-list',
  async () => {
    const params = new URLSearchParams({
      selected_type: selectedType.value,
      sort_field: sortField.value,
      sort_order: sortOrder.value,
      page: String(page.value),
      limit: String(limit)
    })
    if (releasedFrom.value) params.set('released_from', releasedFrom.value)
    if (releasedTo.value) params.set('released_to', releasedTo.value)
    if (selectedMonths.value.length > 0) {
      params.set(
        'released_months',
        [...selectedMonths.value].sort((a, b) => a - b).join(',')
      )
    }

    const res = await api.get<ListResponse>(`/galgame?${params.toString()}`)
    if (res.code !== 0) return { galgames: [], total: 0 }
    return res.data
  },
  { default: () => ({ galgames: [], total: 0 }) }
)

const typeOptions = computed(() =>
  ALL_SUPPORTED_TYPE.map((t) => ({
    value: t,
    label: SUPPORTED_TYPE_MAP[t] ?? t
  }))
)

const sortFieldOptions = computed(() =>
  Object.entries(GALGAME_SORT_FIELD_LABEL_MAP).map(([value, label]) => ({
    value,
    label
  }))
)

const currentYear = new Date().getFullYear()
const yearOptions = computed(() => [
  { value: '', label: '不限' },
  ...Array.from({ length: currentYear - 1979 }, (_, i) => {
    const y = String(currentYear - i)
    return { value: y, label: `${y} 年` }
  })
])

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} 月`
}))

const showFilters = ref(false)

const hasAdvancedFilter = computed(
  () =>
    !!releasedFrom.value ||
    !!releasedTo.value ||
    selectedMonths.value.length > 0
)

const hasActiveFilter = computed(
  () =>
    selectedType.value !== 'all' ||
    sortField.value !== 'popularity' ||
    sortOrder.value !== 'desc' ||
    hasAdvancedFilter.value
)

const buildQuery = (): Record<string, string> => {
  const q: Record<string, string> = {
    page: String(page.value),
    type: selectedType.value,
    sort_field: sortField.value,
    sort_order: sortOrder.value
  }
  if (releasedFrom.value) q.released_from = releasedFrom.value
  if (releasedTo.value) q.released_to = releasedTo.value
  if (selectedMonths.value.length > 0) {
    q.released_months = [...selectedMonths.value]
      .sort((a, b) => a - b)
      .join(',')
  }
  return q
}

const updateQuery = async () => {
  await router.replace({ query: buildQuery() })
  await refresh()
}

watch(
  () => settingStore.data.showGalgamesWithoutResource,
  () => {
    page.value = 1
    updateQuery()
  }
)

const setType = (v: string) => {
  if (selectedType.value === v) return
  selectedType.value = v
  page.value = 1
  updateQuery()
}
const setSortField = (v: string) => {
  if (sortField.value === v) return
  sortField.value = v
  page.value = 1
  updateQuery()
}
const setSortOrder = (v: 'asc' | 'desc') => {
  if (sortOrder.value === v) return
  sortOrder.value = v
  page.value = 1
  updateQuery()
}

const setFromYear = (year: string) => {
  if (releasedFrom.value === year) return
  releasedFrom.value = year
  if (year && releasedTo.value && Number(releasedTo.value) < Number(year)) {
    releasedTo.value = year
  }
  page.value = 1
  updateQuery()
}
const setToYear = (year: string) => {
  if (releasedTo.value === year) return
  releasedTo.value = year
  if (year && releasedFrom.value && Number(releasedFrom.value) > Number(year)) {
    releasedFrom.value = year
  }
  page.value = 1
  updateQuery()
}

const toggleMonth = (m: number) => {
  selectedMonths.value = selectedMonths.value.includes(m)
    ? selectedMonths.value.filter((x) => x !== m)
    : [...selectedMonths.value, m]
  page.value = 1
  updateQuery()
}

const resetFilters = () => {
  selectedType.value = 'all'
  sortField.value = 'popularity'
  sortOrder.value = 'desc'
  releasedFrom.value = ''
  releasedTo.value = ''
  selectedMonths.value = []
  page.value = 1
  updateQuery()
}

const onChangePage = (v: number) => {
  page.value = v
  updateQuery()
  if (import.meta.client) window.scrollTo({ top: 0 })
}

const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / limit))

const chipClass = (active: boolean) => [
  'shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-sm whitespace-nowrap transition-colors',
  active
    ? 'bg-primary/15 text-primary font-medium'
    : 'text-default-600 hover:bg-default-100'
]
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunHeader
      name="Galgame"
      description="浏览资料库中的全部 Galgame，打开任意作品即可发布补丁。本页面默认仅显示 SFW（内容安全）条目，您可以在网站右上角切换显示全部（包括 NSFW）。"
    />

    <div class="space-y-1.5">
      <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
        <button
          v-for="opt in typeOptions"
          :key="opt.value"
          type="button"
          :class="chipClass(selectedType === opt.value)"
          @click="setType(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
        <button
          v-for="opt in sortFieldOptions"
          :key="opt.value"
          type="button"
          :class="chipClass(sortField === opt.value)"
          @click="setSortField(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-label="降序"
          :class="[
            'shrink-0 cursor-pointer rounded-md p-1 transition-colors',
            sortOrder === 'desc'
              ? 'bg-primary/15 text-primary'
              : 'text-default-500 hover:bg-default-100'
          ]"
          @click="setSortOrder('desc')"
        >
          <KunIcon name="lucide:arrow-down" class="size-4" />
        </button>
        <button
          type="button"
          aria-label="升序"
          :class="[
            'shrink-0 cursor-pointer rounded-md p-1 transition-colors',
            sortOrder === 'asc'
              ? 'bg-primary/15 text-primary'
              : 'text-default-500 hover:bg-default-100'
          ]"
          @click="setSortOrder('asc')"
        >
          <KunIcon name="lucide:arrow-up" class="size-4" />
        </button>

        <span
          class="bg-default-200 mx-1 h-5 w-px shrink-0 self-center"
          aria-hidden="true"
        />

        <button
          type="button"
          class="text-default-500 hover:text-primary flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors"
          :class="hasAdvancedFilter && 'text-warning'"
          @click="showFilters = !showFilters"
        >
          <KunIcon name="lucide:sliders-horizontal" class="text-inherit" />
          <span>高级筛选</span>
        </button>

        <GalgameDisplaySettings />

        <button
          v-if="hasActiveFilter"
          type="button"
          class="text-default-500 hover:text-danger flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors"
          @click="resetFilters"
        >
          <KunIcon name="lucide:rotate-ccw" class="text-inherit" />
          <span>重置筛选</span>
        </button>
      </div>

      <div
        v-if="showFilters"
        class="border-default-200 bg-default-50 space-y-4 rounded-lg border p-3"
      >
        <div
          class="text-primary border-default-200 border-b pb-1 text-sm font-semibold"
        >
          发售日期
        </div>

        <div>
          <div class="text-default-700 mb-1.5 text-xs font-medium">起始年份</div>
          <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
            <button
              v-for="opt in yearOptions"
              :key="opt.value || 'from-all'"
              type="button"
              :class="chipClass(releasedFrom === opt.value)"
              @click="setFromYear(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div>
          <div class="text-default-700 mb-1.5 text-xs font-medium">结束年份</div>
          <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
            <button
              v-for="opt in yearOptions"
              :key="opt.value || 'to-all'"
              type="button"
              :class="chipClass(releasedTo === opt.value)"
              @click="setToYear(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div>
          <div class="text-default-700 mb-1.5 text-xs font-medium">
            发售月份
            <span class="text-default-400 font-normal">(可多选, 含历年)</span>
          </div>
          <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
            <button
              v-for="opt in monthOptions"
              :key="opt.value"
              type="button"
              :class="chipClass(selectedMonths.includes(opt.value))"
              @click="toggleMonth(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <KunLoading v-if="pending" description="正在获取 Galgame 数据..." />
    <div
      v-else
      class="mx-auto mb-8 grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      <GalgameCard
        v-for="patch in data?.galgames"
        :key="patch.id"
        :patch="patch"
      />
    </div>

    <KunNull v-if="!pending && !data?.galgames?.length" description="暂无数据" />

    <div v-if="totalPages > 1" class="flex justify-center">
      <KunPagination
        :current-page="page"
        :total-page="totalPages"
        :is-loading="pending"
        :page-href="pageHref"
        @update:current-page="onChangePage"
      />
    </div>
  </div>
</template>
