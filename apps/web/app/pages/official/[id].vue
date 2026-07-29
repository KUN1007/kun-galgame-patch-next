<script setup lang="ts">
// Redirect shell for the legacy wiki-keyed official URL (wave A2-2 / R1).
// Same reasoning as tag/[id].vue: the page moved to /labels/:id in the CATALOG
// id space, and the two spaces overlap numerically, so this path forwards
// rather than guessing which company the caller meant.
//
// Unlike tags there is no 410 case: the A2-0 rescue registered all 24,334 wiki
// officials as exact external anchors, so the catalog reverse lookup resolves
// every id that was ever valid. A miss here means the id never was one.
const route = useRoute()
const api = useApi()

const { data } = await useAsyncData(
  () => `official-redirect-${route.params.id}`,
  async () => {
    const res = await api.get<{ catalog_id: number }>(
      `/taxonomy/resolve/official/${route.params.id}`
    )
    return res.code === 0 ? (res.data?.catalog_id ?? 0) : 0
  }
)

if (data.value) {
  await navigateTo(
    `/labels/${data.value}${route.query.page ? `?page=${route.query.page}` : ''}`,
    { redirectCode: 301 }
  )
}
</script>

<template>
  <div class="container mx-auto my-6">
    <KunNull description="会社不存在" />
  </div>
</template>
