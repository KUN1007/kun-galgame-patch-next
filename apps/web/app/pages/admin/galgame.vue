<script setup lang="ts">
useKunSeoMeta({ title: 'Galgame 管理' })

const api = useApi()
const page = ref(1)
const limit = 30

interface ListResponse {
  galgames: AdminGalgame[]
  total: number
}

const { data, pending, refresh } = await useAsyncData<ListResponse>(
  'admin-galgames',
  async () => {
    const res = await api.get<ListResponse>(
      `/admin/galgame?page=${page.value}&limit=${limit}`
    )
    return res.code === 0 ? res.data : { galgames: [], total: 0 }
  },
  { default: () => ({ galgames: [], total: 0 }) }
)

watch(page, () => refresh())

const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / limit))

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除这个 Galgame 吗? 此操作不可恢复')) return
  const res = await api.delete(`/admin/galgame/${id}`)
  if (res.code === 0) {
    useKunMessage('已删除', 'success')
    await refresh()
  } else {
    useKunMessage(res.message || '删除失败', 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Galgame 管理</h1>
    <KunLoading v-if="pending" description="加载中..." />
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-default/20 border-b">
          <tr>
            <th class="px-3 py-2 text-left">封面</th>
            <th class="px-3 py-2 text-left">名称</th>
            <th class="px-3 py-2 text-left">发布者</th>
            <th class="px-3 py-2 text-left">发布时间</th>
            <th class="px-3 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="g in data?.galgames"
            :key="g.id"
            class="border-default/20 hover:bg-default-50 border-b"
          >
            <td class="px-3 py-2">
              <img
                v-if="g.banner"
                :src="g.banner.replace(/\.avif$/, '-mini.avif')"
                class="bg-default-100 h-10 w-20 rounded object-cover"
                alt=""
              />
            </td>
            <td class="px-3 py-2">
              <NuxtLink
                :to="`/patch/${g.id}/introduction`"
                class="text-primary hover:underline"
              >
                {{ getPreferredLanguageText(g.name) }}
              </NuxtLink>
            </td>
            <td class="px-3 py-2">{{ g.user?.name ?? '—' }}</td>
            <td class="text-default-500 px-3 py-2 text-xs">
              {{ formatDate(g.created, { isShowYear: true }) }}
            </td>
            <td class="px-3 py-2">
              <KunButton
                size="sm"
                variant="light"
                color="danger"
                @click="handleDelete(g.id)"
              >
                删除
              </KunButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <KunNull
      v-if="!pending && !data?.galgames?.length"
      description="暂无数据"
    />

    <div v-if="totalPages > 1" class="flex justify-center">
      <KunPagination
        :current-page="page"
        :total-page="totalPages"
        :is-loading="pending"
        @update:current-page="(v) => (page = v)"
      />
    </div>
  </div>
</template>
