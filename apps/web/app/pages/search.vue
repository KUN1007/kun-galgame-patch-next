<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

useKunDisableSeo('搜索')

defineOptions({ name: 'search-page' })

const route = useRoute()
const router = useRouter()
const api = useApi()

type SearchMode = 'galgame' | 'model'
const mode = ref<SearchMode>(route.query.mode === 'model' ? 'model' : 'galgame')

const query = ref(String(route.query.q ?? ''))
const page = ref(Number(route.query.page ?? 1))
const limit = 24

const searchInIntroduction = ref(false)

const results = ref<GalgameCard[]>([])
const resourceResults = ref<PatchResource[]>([])
const total = ref(0)
const loading = ref(false)
const hasSearched = ref(false)

interface SearchHit {
  id: number
  vndb_id: string
  name_en_us: string
  name_ja_jp: string
  name_zh_cn: string
  name_zh_tw: string
  banner: string
  effective_banner_hash?: string
  effective_banner_thumbhash?: string
  effective_portrait_hash?: string
  effective_portrait_thumbhash?: string
  maker?: GalgameMaker
  content_limit: string
  release_date?: string | null
  has_patch: boolean
  patch?: {
    id: number
    view?: number
    download?: number
    created?: string
    resource_update_time?: string
    type?: string[]
    language?: string[]
    platform?: string[]
    favorite_count?: number
    contribute_count?: number
    comment_count?: number
    resource_count?: number
  } | null
}

const mapHit = (h: SearchHit): GalgameCard =>
  ({
    id: h.id,
    vndb_id: h.vndb_id,
    bid: null,
    name: {
      'en-us': h.name_en_us ?? '',
      'ja-jp': h.name_ja_jp ?? '',
      'zh-cn': h.name_zh_cn ?? '',
      'zh-tw': h.name_zh_tw ?? ''
    },
    banner: h.banner ?? '',
    effective_banner_hash: h.effective_banner_hash ?? '',
    effective_banner_thumbhash: h.effective_banner_thumbhash ?? '',
    effective_portrait_hash: h.effective_portrait_hash ?? '',
    effective_portrait_thumbhash: h.effective_portrait_thumbhash ?? '',
    maker: h.maker,
    view: h.patch?.view ?? 0,
    download: h.patch?.download ?? 0,
    type: h.patch?.type ?? [],
    language: h.patch?.language ?? [],
    platform: h.patch?.platform ?? [],
    content_limit: (h.content_limit as KunContentLimit) || 'sfw',
    status: 0,
    release_date: h.release_date ?? null,
    created: h.patch?.created ?? new Date().toISOString(),
    resource_update_time:
      h.patch?.resource_update_time ??
      h.patch?.created ??
      new Date().toISOString(),
    count: {
      favorite_by: h.patch?.favorite_count ?? 0,
      contribute_by: h.patch?.contribute_count ?? 0,
      resource: h.patch?.resource_count ?? 0,
      comment: h.patch?.comment_count ?? 0
    }
  }) as GalgameCard

const resetResults = () => {
  results.value = []
  resourceResults.value = []
  total.value = 0
  hasSearched.value = false
}

const searchModel = async (q: string) => {
  const params = new URLSearchParams({
    model: q,
    sort_field: 'created',
    sort_order: 'desc',
    page: String(page.value),
    limit: String(limit)
  })
  const res = await api.get<{ items: PatchResource[]; total: number }>(
    `/resource?${params.toString()}`
  )
  if (res.code === 0) {
    resourceResults.value = res.data?.items ?? []
    total.value = res.data?.total ?? 0
  } else {
    resourceResults.value = []
    total.value = 0
    useKunMessage(res.message || '搜索失败', 'error')
  }
  router.replace({ query: { q: query.value, page: page.value, mode: 'model' } })
}

const searchGalgame = async (q: string) => {
  const res = await api.post<{ items: SearchHit[]; total: number }>('/search', {
    q,
    page: page.value,
    limit,
    include_intro: searchInIntroduction.value
  })
  if (res.code === 0) {
    results.value = (res.data?.items ?? []).map(mapHit)
    total.value = res.data?.total ?? 0
  } else {
    results.value = []
    total.value = 0
    useKunMessage(res.message || '搜索失败', 'error')
  }
  router.replace({ query: { q: query.value, page: page.value } })
}

const doSearch = async () => {
  const q = query.value.trim()
  if (!q) {
    resetResults()
    return
  }
  loading.value = true
  try {
    if (mode.value === 'model') {
      await searchModel(q)
    } else {
      await searchGalgame(q)
    }
    hasSearched.value = true
  } finally {
    loading.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  page.value = 1
  doSearch()
}, 500)

watch([query, searchInIntroduction], () => {
  debouncedSearch()
})
watch(mode, () => {
  page.value = 1
  resetResults()
  doSearch()
})

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
    <KunHeader
      name="搜索"
      description="搜索本站的 Galgame 补丁，或按模型搜索补丁资源"
    />

    <div class="flex flex-wrap gap-2">
      <KunButton
        :variant="mode === 'galgame' ? 'flat' : 'light'"
        :color="mode === 'galgame' ? 'primary' : 'default'"
        rounded="full"
        @click="mode = 'galgame'"
      >
        <KunIcon name="lucide:gamepad-2" class="size-4" />
        搜索 Galgame
      </KunButton>
      <KunButton
        :variant="mode === 'model' ? 'flat' : 'light'"
        :color="mode === 'model' ? 'primary' : 'default'"
        rounded="full"
        @click="mode = 'model'"
      >
        <KunIcon name="lucide:bot" class="size-4" />
        按模型搜索资源
      </KunButton>
    </div>

    <KunInput
      v-model="query"
      :placeholder="
        mode === 'model'
          ? '输入模型名搜索补丁资源，例如 claude-opus-4.7'
          : '输入关键词搜索...'
      "
      size="lg"
      autofocus
    >
      <template #prefix>
        <KunIcon name="lucide:search" class="text-default-400 size-5" />
      </template>
    </KunInput>

    <div v-if="mode === 'galgame'" class="flex flex-wrap gap-4">
      <KunCheckBox v-model="searchInIntroduction" label="搜索简介内容" />
    </div>

    <KunLoading v-if="loading" description="正在搜索..." />

    <GalgameList
      v-else-if="mode === 'galgame' && results.length"
      :items="results"
    />

    <div
      v-else-if="mode === 'model' && resourceResults.length"
      class="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2"
    >
      <ResourceCard v-for="r in resourceResults" :key="r.id" :resource="r" />
    </div>

    <KunNull
      v-else-if="hasSearched"
      :description="
        mode === 'model'
          ? '没有找到使用该模型的补丁资源'
          : '没有找到匹配的 Galgame'
      "
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
