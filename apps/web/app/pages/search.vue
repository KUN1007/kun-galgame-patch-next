<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

useKunSeoMeta({
  title: '搜索',
  description: '搜索 鲲 Galgame 补丁 的 Galgame'
})

const route = useRoute()
const router = useRouter()
const api = useApi()

const query = ref(String(route.query.q ?? ''))
const page = ref(Number(route.query.page ?? 1))
const limit = 24

const searchInAlias = ref(true)
const searchInIntroduction = ref(false)
const searchInTag = ref(false)

const results = ref<GalgameCard[]>([])
const total = ref(0)
const loading = ref(false)
const hasSearched = ref(false)

const doSearch = async () => {
  if (!query.value.trim()) {
    results.value = []
    total.value = 0
    hasSearched.value = false
    return
  }
  loading.value = true
  try {
    const res = await api.post<{ galgames: GalgameCard[]; total: number }>(
      '/search',
      {
        query: query.value.split(' ').filter((t) => t.length > 0),
        page: page.value,
        limit,
        searchOption: {
          searchInAlias: searchInAlias.value,
          searchInIntroduction: searchInIntroduction.value,
          searchInTag: searchInTag.value
        }
      }
    )
    if (res.code === 0) {
      results.value = res.data.galgames
      total.value = res.data.total
      hasSearched.value = true
      router.replace({ query: { q: query.value, page: page.value } })
    }
  } finally {
    loading.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  page.value = 1
  doSearch()
}, 500)

watch(
  [query, searchInAlias, searchInIntroduction, searchInTag],
  () => {
    debouncedSearch()
  }
)

onMounted(() => {
  if (query.value) doSearch()
})

const totalPages = computed(() => Math.ceil(total.value / limit))
const onChangePage = (v: number) => {
  page.value = v
  doSearch()
  if (import.meta.client) window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunHeader name="搜索" description="搜索本站的 Galgame 补丁" />

    <KunInput
      v-model="query"
      placeholder="输入关键词搜索..."
      size="lg"
      autofocus
    >
      <template #prefix>
        <KunIcon name="lucide:search" class="text-default-400 size-5" />
      </template>
    </KunInput>

    <div class="flex flex-wrap gap-4">
      <KunCheckBox v-model="searchInAlias" label="搜索别名" />
      <KunCheckBox v-model="searchInIntroduction" label="搜索简介" />
      <KunCheckBox v-model="searchInTag" label="搜索标签" />
    </div>

    <KunLoading v-if="loading" description="正在搜索..." />
    <div
      v-else-if="results.length"
      class="grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      <GalgameCard v-for="p in results" :key="p.id" :patch="p" />
    </div>
    <KunNull
      v-else-if="hasSearched"
      description="没有找到匹配的 Galgame"
    />

    <div v-if="totalPages > 1" class="flex justify-center">
      <KunPagination
        :current-page="page"
        :total-page="totalPages"
        :is-loading="loading"
        @update:current-page="onChangePage"
      />
    </div>
  </div>
</template>
