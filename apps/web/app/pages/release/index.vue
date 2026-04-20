<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const api = useApi()

const now = new Date()
const year = ref(Number(route.query.year ?? now.getFullYear()))
const month = ref(Number(route.query.month ?? now.getMonth() + 1))

useKunSeoMeta({
  title: 'Galgame 新作',
  description: '浏览 Galgame 月度新作'
})

interface ListResponse {
  galgames: GalgameReleaseCard[]
}

const fetchData = async (): Promise<ListResponse> => {
  const res = await api.get<ListResponse>(
    `/release?year=${year.value}&month=${month.value}`
  )
  if (res.code !== 0) return { galgames: [] }
  return res.data
}

const { data, pending, refresh } = await useAsyncData<ListResponse>(
  () => `release-${year.value}-${month.value}`,
  fetchData,
  { default: () => ({ galgames: [] }) }
)

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} 月`
  }))
)

const yearOptions = computed(() => {
  const y = now.getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    value: y - i + 1,
    label: `${y - i + 1} 年`
  }))
})

const updateQuery = async () => {
  await router.replace({
    query: { year: year.value, month: month.value }
  })
  await refresh()
}
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunHeader
      name="Galgame 新作"
      description="浏览每月的 Galgame 发售列表"
    />

    <KunCard>
      <div class="flex flex-wrap items-end gap-3">
        <KunSelect
          label="年份"
          :model-value="year"
          :options="yearOptions"
          class-name="min-w-32"
          @update:model-value="
            (v) => {
              year = Number(v)
              updateQuery()
            }
          "
        />
        <KunSelect
          label="月份"
          :model-value="month"
          :options="monthOptions"
          class-name="min-w-32"
          @update:model-value="
            (v) => {
              month = Number(v)
              updateQuery()
            }
          "
        />
      </div>
    </KunCard>

    <KunLoading v-if="pending" description="正在获取新作..." />
    <div
      v-else
      class="grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      <ReleaseCard
        v-for="p in data?.galgames"
        :key="p.patchId"
        :patch="p"
      />
    </div>
    <KunNull
      v-if="!pending && !data?.galgames?.length"
      description="该月暂无新作"
    />
  </div>
</template>
