<script setup lang="ts">
const route = useRoute()
const api = useApi()
const userId = computed(() => Number(route.params.id))

interface ListResponse {
  resources: UserResourceItem[]
  total: number
}

const { data, pending } = await useAsyncData<ListResponse>(
  () => `user-${userId.value}-resources`,
  async () => {
    const res = await api.get<ListResponse>(
      `/user/${userId.value}/resource?page=1&limit=20`
    )
    return res.code === 0 ? res.data : { resources: [], total: 0 }
  },
  { default: () => ({ resources: [], total: 0 }) }
)
</script>

<template>
  <div>
    <KunLoading v-if="pending" description="加载中..." />
    <div v-else-if="data?.resources?.length" class="space-y-3">
      <NuxtLink
        v-for="r in data.resources"
        :key="r.id"
        :to="`/patch/${r.patchId}/resource`"
        class="border-default/20 bg-background hover:bg-default-100 flex gap-4 rounded-lg border p-4 transition-colors"
      >
        <img
          :src="
            r.patchBanner
              ? r.patchBanner.replace(/\.avif$/, '-mini.avif')
              : '/kungalgame-trans.webp'
          "
          :alt="getPreferredLanguageText(r.patchName)"
          class="bg-default-100 h-24 w-40 shrink-0 rounded object-cover"
        />
        <div class="flex-1 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="hover:text-primary-500 text-lg font-semibold line-clamp-2">
              {{ getPreferredLanguageText(r.patchName) }}
            </h3>
            <KunBadge variant="flat">
              {{ formatDistanceToNow(r.created) }}
            </KunBadge>
          </div>
          <KunPatchAttribute
            :types="r.type"
            :languages="r.language"
            :platforms="r.platform"
            size="sm"
          />
        </div>
      </NuxtLink>
    </div>
    <KunNull v-else description="该用户暂未发布任何资源" />
  </div>
</template>
