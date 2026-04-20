<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify'

const route = useRoute()
const api = useApi()

const resourceId = computed(() => Number(route.params.id))

const { data: detail, pending } = await useAsyncData<PatchResourceDetail | null>(
  () => `resource-${resourceId.value}`,
  async () => {
    const res = await api.get<PatchResourceDetail>(
      `/resource/${resourceId.value}`
    )
    return res.code === 0 ? res.data : null
  }
)

const noteHtml = computed(() => {
  if (!detail.value?.resource.noteHtml) return ''
  return DOMPurify.sanitize(detail.value.resource.noteHtml)
})

useKunSeoMeta({
  title: detail.value
    ? `${getPreferredLanguageText(detail.value.patch.name)} - 资源下载`
    : '资源详情',
  description: detail.value?.resource.name ?? ''
})
</script>

<template>
  <div class="container mx-auto my-4 space-y-6">
    <KunLoading v-if="pending" description="加载资源中..." />

    <template v-else-if="detail">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="md:col-span-2">
          <KunCard :bordered="true">
            <h1 class="mb-2 text-2xl font-bold">
              {{ detail.resource.name || '补丁资源' }}
            </h1>
            <div class="text-default-500 mb-4 text-sm">
              来自:
              <NuxtLink
                :to="`/patch/${detail.patch.id}/introduction`"
                class="text-primary hover:underline"
              >
                {{ getPreferredLanguageText(detail.patch.name) }}
              </NuxtLink>
            </div>

            <KunPatchAttribute
              :types="detail.resource.type"
              :languages="detail.resource.language"
              :platforms="detail.resource.platform"
              :model-name="detail.resource.modelName"
              :storage="detail.resource.storage"
              :storage-size="detail.resource.size"
            />

            <div v-if="noteHtml" class="kun-prose mt-4" v-html="noteHtml" />
            <p
              v-else-if="detail.resource.note"
              class="mt-4 text-sm whitespace-pre-wrap"
            >
              {{ detail.resource.note }}
            </p>

            <div class="text-default-500 mt-6 space-y-2 text-sm">
              <div v-if="detail.resource.code">
                提取码: <code>{{ detail.resource.code }}</code>
              </div>
              <div v-if="detail.resource.password">
                解压密码: <code>{{ detail.resource.password }}</code>
              </div>
              <div v-if="detail.resource.hash" class="break-all">
                Hash: {{ detail.resource.hash }}
                <NuxtLink
                  :to="`/check-hash?hash=${detail.resource.hash}&content=${encodeURIComponent(detail.resource.content || '')}`"
                  class="text-primary ml-2 hover:underline"
                >
                  校验文件
                </NuxtLink>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <KunButton color="primary" size="lg">
                <KunIcon name="lucide:download" class="size-5" />
                下载资源
              </KunButton>
              <div class="text-default-500 flex items-center gap-4 text-sm">
                <div class="flex items-center gap-1">
                  <KunIcon name="lucide:heart" class="size-4" />
                  {{ detail.resource.likeCount }}
                </div>
                <div class="flex items-center gap-1">
                  <KunIcon name="lucide:download" class="size-4" />
                  {{ detail.resource.download }}
                </div>
              </div>
            </div>
          </KunCard>

          <div v-if="detail.recommendations?.length" class="mt-6">
            <h2 class="mb-3 text-xl font-bold">推荐资源</h2>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ResourceCard
                v-for="r in detail.recommendations"
                :key="r.id"
                :resource="r"
              />
            </div>
          </div>
        </div>

        <div>
          <KunCard :bordered="true">
            <h3 class="mb-3 text-lg font-bold">Galgame 信息</h3>
            <NuxtLink
              :to="`/patch/${detail.patch.id}/introduction`"
              class="block"
            >
              <img
                v-if="detail.patch.banner"
                :src="detail.patch.banner.replace(/\.avif$/, '-mini.avif')"
                :alt="getPreferredLanguageText(detail.patch.name)"
                class="bg-default-100 mb-3 aspect-video w-full rounded object-cover"
              />
              <div class="hover:text-primary-500 font-semibold">
                {{ getPreferredLanguageText(detail.patch.name) }}
              </div>
            </NuxtLink>
            <div class="text-default-500 mt-3 space-y-1 text-sm">
              <div>浏览: {{ formatNumber(detail.patch.view) }}</div>
              <div>下载: {{ formatNumber(detail.patch.download) }}</div>
              <div>收藏: {{ detail.patch._count.favorite_by }}</div>
              <div>资源数: {{ detail.patch._count.resource }}</div>
            </div>
          </KunCard>
        </div>
      </div>
    </template>

    <KunNull v-else description="资源不存在" />
  </div>
</template>
