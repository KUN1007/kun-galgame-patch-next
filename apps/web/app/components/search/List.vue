<script setup lang="ts">
import {
  SEARCH_CATEGORY_MAP,
  SEARCH_PAGE_SIZE,
  isSearchResourceScope,
  readSearchGalgameFilter,
  searchGalgameFilterQuery
} from './items'

const props = defineProps<{
  keywords: string
  type: SearchPagedType
}>()

const route = useRoute()
const api = useApi()

const results = ref<SearchResultItem[]>([])
const total = ref(0)
const pending = ref(!!props.keywords)
const failed = ref(false)
const page = ref(1)
const top = useTemplateRef<HTMLElement>('top')

const meta = computed(() => SEARCH_CATEGORY_MAP[props.type])
const limit = computed(() => SEARCH_PAGE_SIZE[props.type])
const totalPage = computed(() => Math.ceil(total.value / limit.value))

// Each lane reads its own filters off the URL, the same place the keyword and
// the category come from, so a filtered search is one shareable link.
const laneParams = computed<Record<string, string>>(() => {
  if (props.type === 'galgame') {
    return searchGalgameFilterQuery(readSearchGalgameFilter(route.query))
  }
  if (props.type === 'resource' && isSearchResourceScope(route.query.scope)) {
    return { scope: 'model' }
  }
  return {}
})

let latest = 0

const load = async () => {
  const current = ++latest
  if (!props.keywords) {
    results.value = []
    total.value = 0
    pending.value = false
    return
  }
  pending.value = true
  const query = new URLSearchParams({
    keywords: props.keywords,
    type: props.type,
    page: String(page.value),
    limit: String(limit.value),
    ...laneParams.value
  })
  const res = await api.get<{ items: SearchResultItem[]; total: number }>(
    `/search?${query.toString()}`
  )
  if (current !== latest) {
    return
  }
  // Telling the reader "nothing found" when the request never came back is the
  // one thing this must not do.
  failed.value = res.code !== 0
  results.value = res.data?.items ?? []
  total.value = res.data?.total ?? 0
  pending.value = false
}

watch(page, async () => {
  await load()
  // The paginator sits below a full page of results, so a page opened from it
  // would otherwise start scrolled past its own first row.
  top.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

watch(
  [() => props.keywords, laneParams],
  () => {
    page.value = 1
    results.value = []
    load()
  },
  { immediate: true }
)
</script>

<template>
  <div ref="top" class="scroll-mt-40 space-y-6">
    <SearchGalgameFilter v-if="type === 'galgame'" />
    <SearchResourceScope
      v-else-if="type === 'resource'"
      :keywords="keywords"
    />

    <p class="text-default-500 text-sm">
      <template v-if="pending && !results.length">正在搜索…</template>
      <template v-else-if="total">
        共 <span class="text-default-700 tabular-nums">{{ total }}</span>
        {{ meta.countUnit }}
      </template>
    </p>

    <SearchSkeleton
      v-if="pending && !results.length"
      :shape="type === 'galgame' ? 'card' : 'row'"
    />

    <!--
      KunLoading's wrapper is display:contents, which generates no box — so the
      space-y margin lands on nothing and the results sit flush against the
      paginator. The div gives that margin something to be applied to.
    -->
    <div v-else-if="results.length">
      <KunLoading :loading="pending">
        <SearchResult :results="results" :type="type" :keywords="keywords" />
      </KunLoading>
    </div>

    <KunNull v-else-if="failed" description="搜索没能完成, 请稍后重试" />

    <KunNull v-else-if="keywords" description="杂鱼杂鱼杂鱼~什么也没有搜索到" />

    <div v-if="totalPage > 1" class="flex justify-center">
      <KunPagination
        v-model:current-page="page"
        :total-page="totalPage"
        :is-loading="pending"
      />
    </div>
  </div>
</template>
