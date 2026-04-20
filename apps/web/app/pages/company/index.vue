<script setup lang="ts">
const api = useApi()

useKunSeoMeta({
  title: '会社',
  description: '浏览全部 Galgame 制作会社'
})

interface ListResponse {
  companies: Company[]
  total: number
}

const { data, pending } = await useAsyncData<ListResponse>(
  'company-list',
  async () => {
    const res = await api.get<ListResponse>('/company?page=1&limit=100')
    if (res.code !== 0) return { companies: [], total: 0 }
    return res.data
  },
  { default: () => ({ companies: [], total: 0 }) }
)
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunHeader
      name="Galgame 会社"
      description="浏览本站收录的全部 Galgame 制作会社"
    />
    <KunLoading v-if="pending" description="正在获取会社数据..." />
    <div
      v-else
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <CompanyCard
        v-for="company in data?.companies"
        :key="company.id"
        :company="company"
      />
    </div>
    <KunNull
      v-if="!pending && !data?.companies?.length"
      description="暂无会社"
    />
  </div>
</template>
