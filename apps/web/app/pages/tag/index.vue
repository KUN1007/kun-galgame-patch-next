<script setup lang="ts">
const api = useApi()

useKunSeoMeta({
  title: '标签',
  description: '浏览全部 Galgame 标签'
})

interface ListResponse {
  tags: Tag[]
  total: number
}

const { data, pending } = await useAsyncData<ListResponse>(
  'tag-list',
  async () => {
    const res = await api.get<ListResponse>('/tag?page=1&limit=100')
    if (res.code !== 0) return { tags: [], total: 0 }
    return res.data
  },
  { default: () => ({ tags: [], total: 0 }) }
)
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunHeader
      name="Galgame 标签"
      description="浏览本站收录的全部 Galgame 标签"
    />
    <KunLoading v-if="pending" description="正在获取标签数据..." />
    <div
      v-else
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <TagCard v-for="tag in data?.tags" :key="tag.id" :tag="tag" />
    </div>
    <KunNull v-if="!pending && !data?.tags?.length" description="暂无标签" />
  </div>
</template>
