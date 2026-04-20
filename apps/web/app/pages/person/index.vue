<script setup lang="ts">
const api = useApi()

useKunSeoMeta({
  title: '制作人',
  description: '浏览全部 Galgame 制作人'
})

interface ListResponse {
  persons: PatchPerson[]
  total: number
}

const { data, pending } = await useAsyncData<ListResponse>(
  'person-list',
  async () => {
    const res = await api.get<ListResponse>('/person?page=1&limit=100')
    if (res.code !== 0) return { persons: [], total: 0 }
    return res.data
  },
  { default: () => ({ persons: [], total: 0 }) }
)
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunHeader
      name="Galgame 制作人"
      description="浏览本站收录的 Galgame 制作人"
    />
    <KunLoading v-if="pending" description="正在获取制作人..." />
    <div
      v-else
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <PersonCard
        v-for="person in data?.persons"
        :key="person.id"
        :person="person"
      />
    </div>
    <KunNull
      v-if="!pending && !data?.persons?.length"
      description="暂无制作人"
    />
  </div>
</template>
