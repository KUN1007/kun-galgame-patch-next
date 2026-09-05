<script setup lang="ts">
import {
  SEARCH_GALGAME_FILTER_KEYS,
  SEARCH_GALGAME_SORTS,
  SEARCH_GALGAME_TAG_MAX,
  SEARCH_GALGAME_YEAR_MIN,
  readSearchGalgameFilter,
  searchGalgameFilterCount,
  searchGalgameFilterQuery
} from './items'

const route = useRoute()
const router = useRouter()
const api = useApi()

const filter = computed(() => readSearchGalgameFilter(route.query))
const activeCount = computed(() => searchGalgameFilterCount(filter.value))

const showPanel = ref(activeCount.value > 0)

const apply = (next: Partial<SearchGalgameFilter>) => {
  const merged = { ...filter.value, ...next }
  const kept = Object.fromEntries(
    Object.entries(route.query).filter(
      ([key]) => !SEARCH_GALGAME_FILTER_KEYS.includes(key)
    )
  )
  router.replace({ query: { ...kept, ...searchGalgameFilterQuery(merged) } })
}

const currentYear = new Date().getFullYear()
const yearOptions = [
  { value: '', label: '不限' },
  ...Array.from({ length: currentYear - SEARCH_GALGAME_YEAR_MIN + 1 }, (_, i) => {
    const year = String(currentYear - i)
    return { value: year, label: `${year} 年` }
  })
]

const setFromYear = (year: string) => {
  const to = filter.value.released_to
  const clamped = year && to && Number(to) < Number(year) ? year : to
  apply({ released_from: year, released_to: clamped })
}

const setToYear = (year: string) => {
  const from = filter.value.released_from
  const clamped = year && from && Number(from) > Number(year) ? year : from
  apply({ released_to: year, released_from: clamped })
}

const toggleTag = (id: number) => {
  const ids = filter.value.tag_ids
  apply({
    tag_ids: ids.includes(id)
      ? ids.filter((value) => value !== id)
      : [...ids, id].slice(0, SEARCH_GALGAME_TAG_MAX)
  })
}

const reset = () =>
  apply({
    tag_ids: [],
    company_id: 0,
    released_from: '',
    released_to: ''
  })

// The URL carries ids so a filtered search can be shared; a link opened cold
// has nothing to draw its chips with until catalog answers the names.
const named = reactive(new Map<string, SearchEntityItem>())
const keyOf = (family: string, id: number) => `${family}:${id}`

const remember = (item: SearchEntityItem) =>
  named.set(keyOf(item.family, item.id), item)

const labelOf = (family: string, id: number) => {
  const item = named.get(keyOf(family, id))
  return item ? getPreferredLanguageText(item.name) : `#${id}`
}

const resolveNames = async () => {
  const missing = {
    company: filter.value.company_id
      ? [filter.value.company_id].filter(
          (id) => !named.has(keyOf('company', id))
        )
      : [],
    tag: filter.value.tag_ids.filter((id) => !named.has(keyOf('tag', id)))
  }
  await Promise.all(
    (['company', 'tag'] as const).map(async (family) => {
      if (!missing[family].length) {
        return
      }
      const res = await api.get<{ items: SearchEntityItem[] }>(
        `/search/entity/resolve?family=${family}&ids=${missing[family].join(',')}`
      )
      if (res.code === 0) {
        for (const item of res.data?.items ?? []) {
          remember(item)
        }
      }
    })
  )
}

watch(filter, resolveNames, { immediate: true })

const pickCompany = (item: SearchEntityItem) => {
  remember(item)
  apply({ company_id: item.id })
}

const pickTag = (item: SearchEntityItem) => {
  remember(item)
  toggleTag(item.id)
}

const chipClass = (active: boolean) => [
  'shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-sm whitespace-nowrap transition-colors',
  active
    ? 'bg-primary/15 text-primary font-medium'
    : 'text-default-600 hover:bg-default-100'
]
</script>

<template>
  <div class="space-y-1.5">
    <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
      <button
        v-for="option in SEARCH_GALGAME_SORTS"
        :key="option.value"
        type="button"
        :class="chipClass(filter.sort === option.value)"
        @click="apply({ sort: option.value })"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        class="text-default-500 hover:text-primary flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors"
        :class="activeCount > 0 && 'text-warning'"
        @click="showPanel = !showPanel"
      >
        <KunIcon name="lucide:sliders-horizontal" class="text-inherit" />
        <span>高级筛选</span>
        <span v-if="activeCount" class="tabular-nums">({{ activeCount }})</span>
      </button>

      <button
        v-if="activeCount"
        type="button"
        class="text-default-500 hover:text-danger flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors"
        @click="reset"
      >
        <KunIcon name="lucide:rotate-ccw" class="text-inherit" />
        <span>重置筛选</span>
      </button>
    </div>

    <div
      v-if="showPanel"
      class="border-default-200 bg-default-50 space-y-4 rounded-lg border p-3"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <SearchEntityPicker
            family="company"
            label="会社"
            placeholder="搜索会社名, 例如 Key"
            @select="pickCompany"
          />
          <div v-if="filter.company_id" class="flex flex-wrap gap-1.5">
            <KunButton
              size="sm"
              variant="flat"
              color="primary"
              rounded="full"
              @click="apply({ company_id: 0 })"
            >
              {{ labelOf('company', filter.company_id) }}
              <KunIcon name="lucide:x" class="size-3.5" />
            </KunButton>
          </div>
        </div>

        <div class="space-y-1.5">
          <SearchEntityPicker
            family="tag"
            label="标签"
            :description="`可多选, 最多 ${SEARCH_GALGAME_TAG_MAX} 个`"
            placeholder="搜索标签, 例如 校园"
            @select="pickTag"
          />
          <div v-if="filter.tag_ids.length" class="flex flex-wrap gap-1.5">
            <KunButton
              v-for="id in filter.tag_ids"
              :key="id"
              size="sm"
              variant="flat"
              color="primary"
              rounded="full"
              @click="toggleTag(id)"
            >
              {{ labelOf('tag', id) }}
              <KunIcon name="lucide:x" class="size-3.5" />
            </KunButton>
          </div>
        </div>
      </div>

      <div>
        <div class="text-default-700 mb-1.5 text-xs font-medium">起始年份</div>
        <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          <button
            v-for="option in yearOptions"
            :key="option.value || 'from-all'"
            type="button"
            :class="chipClass(filter.released_from === option.value)"
            @click="setFromYear(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div>
        <div class="text-default-700 mb-1.5 text-xs font-medium">结束年份</div>
        <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          <button
            v-for="option in yearOptions"
            :key="option.value || 'to-all'"
            type="button"
            :class="chipClass(filter.released_to === option.value)"
            @click="setToYear(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <p class="text-default-400 text-xs">
        资料库尚未提供按评分筛选, 想按评分挑选请到游戏页查看 VNDB / Bangumi 评分。
      </p>
    </div>
  </div>
</template>
