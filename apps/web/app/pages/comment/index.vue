<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const api = useApi()

useKunSeoMeta({
  title: '评论',
  description: '浏览 鲲 Galgame 补丁 的最新评论'
})

const page = ref(Number(route.query.page ?? 1))
const limit = 20

interface ListResponse {
  comments: PatchComment[]
  total: number
}

const { data, pending, refresh } = await useAsyncData<ListResponse>(
  'comment-list',
  async () => {
    const res = await api.get<ListResponse>(
      `/comment?page=${page.value}&limit=${limit}`
    )
    return res.code === 0 ? res.data : { comments: [], total: 0 }
  },
  { default: () => ({ comments: [], total: 0 }) }
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
    <KunHeader name="最新评论" description="浏览全站的最新补丁评论" />
    <KunLoading v-if="pending" description="加载评论中..." />
    <div v-else class="space-y-4">
      <CommentCard
        v-for="c in data?.comments"
        :key="c.id"
        :comment="c"
      />
    </div>
    <KunNull
      v-if="!pending && !data?.comments?.length"
      description="暂无评论"
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
