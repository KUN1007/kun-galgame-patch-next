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
// Three outcomes, from the resolver (`GET /taxonomy/resolve/tag/:id`), and the
// shell ANSWERS in all three rather than rendering in two of them:
//   301 -> /tags/:catalogId   the 1,530 wiki tags with a canonical successor
//   410                        the 1,507 with none — permanently retired, and
//                              "gone" is the honest word for a URL we published
//   404                        never a wiki tag id at all
//
// A shell that renders 200 over a target that does not exist is a SOFT 404: the
// crawler is told the URL is fine, keeps it indexed, keeps spending budget on
// it, and the "已退役" text is read as thin content on a live page. The status
// line is the only part of that answer a crawler actually obeys.
const route = useRoute()
const api = useApi()

// The resolver's own verdicts (moyu envelope codes), as opposed to the HTTP
// status this page answers with.
const VERDICT_GONE = 410
const VERDICT_NOT_FOUND = 40400

const { data } = await useAsyncData(
  () => `tag-redirect-${route.params.id}`,
  async () => {
    const res = await api.get<{ catalog_id: number }>(
      `/taxonomy/resolve/tag/${route.params.id}`
    )
    return { code: res.code, catalogId: res.data?.catalog_id ?? 0 }
  }
)

// A non-verdict — the resolver itself failed — is deliberately NOT a 404: that
// would tell a crawler this URL is dead because our backend blinked, and a
// retired-forever answer is not something to guess at.
const answerFor = (code: number) => {
  if (code === VERDICT_GONE) {
    return {
      statusCode: 410,
      statusMessage: '该标签已永久退役，没有对应的新词条'
    }
  }
  if (code === VERDICT_NOT_FOUND) {
    return { statusCode: 404, statusMessage: '标签不存在' }
  }
  return { statusCode: 502, statusMessage: '标签解析服务暂时不可用' }
}

const verdict = data.value
if (verdict?.code === 0 && verdict.catalogId > 0) {
  // 301, not 302: the move is permanent, and a crawler that learns it stops
  // spending its budget on the old URL and passes the ranking along.
  await navigateTo(
    `/tags/${verdict.catalogId}${route.query.page ? `?page=${route.query.page}` : ''}`,
    {
      redirectCode: 301
    }
  )
} else {
  throw createError({ ...answerFor(verdict?.code ?? -1), fatal: true })
}
</script>

<template>
  <div class="container mx-auto my-6">
    <!-- Only ever on screen for the client-side redirect tick: every other path
         out of this page is a status code, not a render. -->
    <KunNull description="正在跳转到新的标签页面" />
  </div>
</template>
