<script setup lang="ts">
const route = useRoute()
const api = useApi()
const userId = computed(() => Number(route.params.id))

interface ListResponse {
  contributes: UserContribute[]
  total: number
}

const { data, pending } = await useAsyncData<ListResponse>(
  () => `user-${userId.value}-contribute`,
  async () => {
    const res = await api.get<ListResponse>(
      `/user/${userId.value}/contribute?page=1&limit=20`
    )
    return res.code === 0 ? res.data : { contributes: [], total: 0 }
  },
  { default: () => ({ contributes: [], total: 0 }) }
)
</script>

<template>
  <div>
    <KunLoading v-if="pending" description="加载中..." />
    <div v-else-if="data?.contributes?.length" class="space-y-2">
      <NuxtLink
        v-for="c in data.contributes"
        :key="c.id"
        :to="`/patch/${c.patchId}/introduction`"
        class="border-default/20 bg-background hover:bg-default-100 flex items-center justify-between rounded-lg border p-3 transition-colors"
      >
        <span class="font-medium line-clamp-1">
          {{ getPreferredLanguageText(c.patchName) }}
        </span>
        <span class="text-default-500 text-xs">
          {{ formatDistanceToNow(c.created) }}
        </span>
      </NuxtLink>
    </div>
    <KunNull v-else description="该用户暂无贡献记录" />
  </div>
</template>
