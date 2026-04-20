<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const api = useApi()

const tagId = computed(() => Number(route.params.id))
const page = ref(Number(route.query.page ?? 1))
const limit = 24

interface GalgamesResponse {
  galgames: GalgameCard[]
  total: number
}

const { data: tag } = await useAsyncData<TagDetail | null>(
  () => `tag-${tagId.value}`,
  async () => {
    const res = await api.get<TagDetail>(`/tag/${tagId.value}`)
    return res.code === 0 ? res.data : null
  }
)

const { data: galgames, pending, refresh } = await useAsyncData<GalgamesResponse>(
  () => `tag-${tagId.value}-galgames`,
  async () => {
    const res = await api.get<GalgamesResponse>(
      `/tag/${tagId.value}/galgame?page=${page.value}&limit=${limit}`
    )
    return res.code === 0 ? res.data : { galgames: [], total: 0 }
  },
  { default: () => ({ galgames: [], total: 0 }) }
)

useKunSeoMeta({
  title: tag.value?.name ?? `标签 ${tagId.value}`,
  description: tag.value?.introduction ?? ''
})

const totalPages = computed(() => Math.ceil((galgames.value?.total ?? 0) / limit))

const onChangePage = async (v: number) => {
  page.value = v
  await router.replace({ query: { page: v } })
  await refresh()
  if (import.meta.client) window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <div v-if="tag" class="space-y-4">
      <KunHeader :name="tag.name" :description="tag.introduction" />
      <div v-if="tag.alias.length" class="flex flex-wrap gap-2">
        <KunBadge
          v-for="a in tag.alias"
          :key="a"
          variant="flat"
          color="secondary"
        >
          {{ a }}
        </KunBadge>
      </div>
    </div>

    <KunLoading v-if="pending" description="正在获取 Galgame..." />
    <div
      v-else
      class="grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      <GalgameCard
        v-for="patch in galgames?.galgames"
        :key="patch.id"
        :patch="patch"
      />
    </div>

    <KunNull
      v-if="!pending && !galgames?.galgames?.length"
      description="此标签暂无关联 Galgame"
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
