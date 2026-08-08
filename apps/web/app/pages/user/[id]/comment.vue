<script setup lang="ts">
import { commentPermalink } from '~/shared/utils/commentTarget'

defineOptions({ name: 'user-comment' })

const route = useRoute()
const router = useRouter()
const api = useApi()
const userId = computed(() => Number(route.params.id))

interface ListResponse {
  items: UserComment[]
  total: number
}

const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (v) => router.replace({ query: { ...route.query, page: String(v) } })
})
const limit = 20
const { data, pending } = await useAsyncData<ListResponse>(
  () => `user-${userId.value}-comments`,
  async () => {
    const res = await api.get<ListResponse>(
      `/user/${userId.value}/comment?page=${page.value}&limit=${limit}`
    )
    return res.code === 0 ? res.data : { items: [], total: 0 }
  },
  { default: () => ({ items: [], total: 0 }), watch: [page] }
)
const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / limit))
const onChangePage = (v: number) => {
  page.value = v
  if (import.meta.client) window.scrollTo({ top: 0 })
}

const patchName = (c: UserComment) =>
  c.patch?.name ? getPreferredLanguageText(c.patch.name) : `补丁 #${c.galgame_id}`
</script>

<template>
  <div>
    <KunLoading v-if="pending" description="加载中..." />
    <div v-else-if="data?.items?.length" class="space-y-3">
      <NuxtLink
        v-for="c in data.items"
        :key="c.id"
        :to="commentPermalink(c)"
        class="border-default/20 bg-content1 shadow-kun-sm hover:bg-default-100 block rounded-lg border p-4 transition-colors"
      >
        <div class="text-default-500 mb-1 text-sm">
          {{ c.resource_id ? '评论了' : '评论在' }}
          <span class="text-primary">{{ patchName(c) }}</span>
          <template v-if="c.resource_id">的补丁资源</template>
        </div>
        <p class="whitespace-pre-wrap line-clamp-3">{{ c.content }}</p>
        <div class="text-default-500 mt-2 flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1">
            <KunIcon name="lucide:thumbs-up" class="size-3.5" />
            {{ c.like_count }}
          </div>
          <span>{{ formatDistanceToNow(c.created) }}</span>
        </div>
      </NuxtLink>
    </div>
    <KunNull v-else description="该用户暂无评论" />

    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <KunPagination
        :current-page="page"
        :total-page="totalPages"
        :is-loading="pending"
        @update:current-page="onChangePage"
      />
    </div>
  </div>
</template>
