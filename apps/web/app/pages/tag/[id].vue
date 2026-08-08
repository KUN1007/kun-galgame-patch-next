<script setup lang="ts">
const route = useRoute()
const api = useApi()

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
  await navigateTo(
    `/galgame/tag/${verdict.catalogId}${route.query.page ? `?page=${route.query.page}` : ''}`,
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
    <KunNull description="正在跳转到新的标签页面" />
  </div>
</template>
