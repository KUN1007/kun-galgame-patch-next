<script setup lang="ts">
const route = useRoute()
const api = useApi()
const userId = computed(() => Number(route.params.id))

interface ListResponse {
  galgames: GalgameCard[]
  total: number
}

const { data, pending } = await useAsyncData<ListResponse>(
  () => `user-${userId.value}-galgames`,
  async () => {
    const res = await api.get<ListResponse>(
      `/user/${userId.value}/galgame?page=1&limit=20`
    )
    return res.code === 0 ? res.data : { galgames: [], total: 0 }
  },
  { default: () => ({ galgames: [], total: 0 }) }
)
</script>

<template>
  <div>
    <KunLoading v-if="pending" description="加载中..." />
    <div
      v-else-if="data?.galgames?.length"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      <GalgameCard
        v-for="patch in data.galgames"
        :key="patch.id"
        :patch="patch"
      />
    </div>
    <KunNull v-else description="该用户暂未发布任何 Galgame" />
  </div>
</template>
