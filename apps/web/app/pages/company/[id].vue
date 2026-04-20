<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const api = useApi()

const companyId = computed(() => Number(route.params.id))
const page = ref(Number(route.query.page ?? 1))
const limit = 24

interface GalgamesResponse {
  galgames: GalgameCard[]
  total: number
}

const { data: company } = await useAsyncData<CompanyDetail | null>(
  () => `company-${companyId.value}`,
  async () => {
    const res = await api.get<CompanyDetail>(`/company/${companyId.value}`)
    return res.code === 0 ? res.data : null
  }
)

const { data: galgames, pending, refresh } = await useAsyncData<GalgamesResponse>(
  () => `company-${companyId.value}-galgames`,
  async () => {
    const res = await api.get<GalgamesResponse>(
      `/company/${companyId.value}/galgame?page=${page.value}&limit=${limit}`
    )
    return res.code === 0 ? res.data : { galgames: [], total: 0 }
  },
  { default: () => ({ galgames: [], total: 0 }) }
)

useKunSeoMeta({
  title: company.value?.name ?? `会社 ${companyId.value}`,
  description: company.value?.introduction ?? ''
})

const totalPages = computed(() =>
  Math.ceil((galgames.value?.total ?? 0) / limit)
)

const onChangePage = async (v: number) => {
  page.value = v
  await router.replace({ query: { page: v } })
  await refresh()
  if (import.meta.client) window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <div v-if="company" class="space-y-4">
      <div class="flex items-center gap-4">
        <img
          v-if="company.logo"
          :src="company.logo"
          :alt="company.name"
          class="bg-default-100 size-16 rounded-lg object-contain"
        />
        <div>
          <h1 class="text-2xl font-bold">{{ company.name }}</h1>
          <p v-if="company.introduction" class="text-default-500">
            {{ company.introduction }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <KunBadge
          v-for="a in company.alias"
          :key="a"
          variant="flat"
          color="secondary"
        >
          {{ a }}
        </KunBadge>
        <a
          v-for="w in company.official_website"
          :key="w"
          :href="w"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary text-sm hover:underline"
        >
          {{ w }}
        </a>
      </div>
    </div>

    <KunLoading v-if="pending" description="正在获取 Galgame..." />
    <div
      v-else
      class="grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      <GalgameCard
        v-for="patch in galgames?.galgames"
        :key="patch.id"
        :patch="patch"
      />
    </div>

    <KunNull
      v-if="!pending && !galgames?.galgames?.length"
      description="该会社暂无 Galgame"
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
