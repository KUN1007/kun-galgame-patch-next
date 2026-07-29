<script setup lang="ts">
// Redirect shell for the legacy wiki-keyed tag URL (wave A2-2 / refs/proj/106 R1).
//
// This path used to render the tag page addressed by a WIKI tag id. The page
// moved to /tags/:id in the CATALOG id space, and the two spaces overlap
// numerically — a large share of wiki tag ids are also live catalog tag ids —
// so this path cannot keep rendering: it would silently show a different tag
// than the link promised. It resolves and forwards instead, which is the only
// answer that is never wrong.
//
// Three outcomes, from the resolver (`GET /taxonomy/resolve/tag/:id`):
//   301 -> /tags/:catalogId   the 1,530 wiki tags with a canonical successor
//   410                        the 1,507 with none — permanently retired, and
//                              "gone" is the honest word for a URL we published
//   404                        never a wiki tag id at all
const route = useRoute()
const api = useApi()

const { data } = await useAsyncData(
  () => `tag-redirect-${route.params.id}`,
  async () => {
    const res = await api.get<{ catalog_id: number }>(
      `/taxonomy/resolve/tag/${route.params.id}`
    )
    return res.code === 0 ? (res.data?.catalog_id ?? 0) : 0
  }
)

if (data.value) {
  // 301, not 302: the move is permanent, and a crawler that learns it stops
  // spending its budget on the old URL and passes the ranking along.
  await navigateTo(
    `/tags/${data.value}${route.query.page ? `?page=${route.query.page}` : ''}`,
    {
      redirectCode: 301
    }
  )
}
</script>

<template>
  <div class="container mx-auto my-6">
    <KunNull description="该标签已永久退役，没有对应的新词条" />
  </div>
</template>
