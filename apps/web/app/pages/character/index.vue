<script setup lang="ts">
const api = useApi()

useKunSeoMeta({
  title: '角色',
  description: '浏览全部 Galgame 角色'
})

interface ListResponse {
  characters: PatchCharacter[]
  total: number
}

const { data, pending } = await useAsyncData<ListResponse>(
  'character-list',
  async () => {
    const res = await api.get<ListResponse>('/character?page=1&limit=60')
    if (res.code !== 0) return { characters: [], total: 0 }
    return res.data
  },
  { default: () => ({ characters: [], total: 0 }) }
)
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunHeader
      name="Galgame 角色"
      description="浏览本站收录的 Galgame 角色"
    />
    <KunLoading v-if="pending" description="正在获取角色..." />
    <div
      v-else
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      <CharacterCard
        v-for="c in data?.characters"
        :key="c.id"
        :character="c"
      />
    </div>
    <KunNull
      v-if="!pending && !data?.characters?.length"
      description="暂无角色"
    />
  </div>
</template>
