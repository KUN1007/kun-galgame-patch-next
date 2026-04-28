<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const api = useApi()

useKunSeoMeta({
  title: '资源下载',
  description: '浏览 鲲 Galgame 补丁 的最新补丁资源'
})

const page = ref(Number(route.query.page ?? 1))
const limit = 20

// /api/v1/resource is a paginated list — see apps/api/internal/common/handler.go
// resourceListRequest. sort_field / sort_order are required.
interface ListResponse {
  items: PatchResource[]
  total: number
}

const { data, pending, refresh } = await useAsyncData<ListResponse>(
  'resource-list',
  async () => {
    const params = new URLSearchParams({
      sort_field: 'created',
      sort_order: 'desc',
      page: String(page.value),
      limit: String(limit)
    })
    const res = await api.get<ListResponse>(`/resource?${params.toString()}`)
    return res.code === 0 ? res.data : { items: [], total: 0 }
  },
  { default: () => ({ items: [], total: 0 }) }
)

const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / limit))
const onChangePage = async (v: number) => {
  page.value = v
  await router.replace({ query: { page: v } })
  await refresh()
  if (import.meta.client) window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunHeader
      name="补丁资源"
      description="浏览本站收录的最新补丁资源下载"
    />
    <KunLoading v-if="pending" description="加载资源中..." />
    <div v-else class="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
      <ResourceCard
        v-for="r in data?.items"
        :key="r.id"
        :resource="r"
      />
    </div>
    <KunNull
      v-if="!pending && !data?.items?.length"
      description="暂无资源"
    />
    <div v-if="totalPages > 1" class="flex justify-center">
      <KunPagination
        :current-page="page"
        :total-page="totalPages"
        :is-loading="pending"
        @update:current-page="onChangePage"
      />
    </div>
  </div>
</template>
