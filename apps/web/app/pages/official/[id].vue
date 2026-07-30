<script setup lang="ts">
// Redirect shell for the legacy wiki-keyed official URL (wave A2-2 / R1).
// Same reasoning as tag/[id].vue: the page moved to /galgame/official/:id in the
// CATALOG id space, and the two spaces overlap numerically, so this path
// forwards rather than guessing which company the caller meant. And, like its
// sibling, it ANSWERS when it cannot forward — rendering 200 over a target that
// does not exist is a soft 404, which keeps a dead URL indexed instead of
// retiring it.
//
// The target is the FINAL address (wave 146), not the week-old /labels/:id: a
// shell that forwards to a path which itself 301s is a redirect CHAIN, which is
// two hops of latency and lost link equity for exactly zero benefit.
//
// Unlike tags there is no 410 case: the A2-0 rescue registered all 24,334 wiki
// officials as exact external anchors, so the catalog reverse lookup resolves
// every id that was ever valid. A miss here means the id never was one.
const route = useRoute()
const api = useApi()

const VERDICT_NOT_FOUND = 40400

const { data } = await useAsyncData(
  () => `official-redirect-${route.params.id}`,
  async () => {
    const res = await api.get<{ catalog_id: number }>(
      `/taxonomy/resolve/official/${route.params.id}`
    )
    return { code: res.code, catalogId: res.data?.catalog_id ?? 0 }
  }
)

// The lookup is LIVE for this family, so "the resolver failed" is a real and
// distinct outcome here — and it must not be spelled 404, which would report an
// id that exists as one that never did.
const answerFor = (code: number) =>
  code === VERDICT_NOT_FOUND
    ? { statusCode: 404, statusMessage: '会社不存在' }
    : { statusCode: 502, statusMessage: '会社解析服务暂时不可用' }

const verdict = data.value
if (verdict?.code === 0 && verdict.catalogId > 0) {
  await navigateTo(
    `/galgame/official/${verdict.catalogId}${route.query.page ? `?page=${route.query.page}` : ''}`,
    { redirectCode: 301 }
  )
} else {
  throw createError({ ...answerFor(verdict?.code ?? -1), fatal: true })
}
</script>

<template>
  <div class="container mx-auto my-6">
    <!-- Only ever on screen for the client-side redirect tick. -->
    <KunNull description="正在跳转到新的会社页面" />
  </div>
</template>
