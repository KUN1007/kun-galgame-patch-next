<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify'

const route = useRoute()
const api = useApi()

const patchId = computed(() => Number(route.params.id))

const { data: detail } = await useAsyncData<PatchDetail | null>(
  () => `patch-detail-${patchId.value}`,
  async () => {
    const res = await api.get<PatchDetail>(`/patch/${patchId.value}/detail`)
    return res.code === 0 ? res.data : null
  }
)

const lang = ref<Language>('zh-cn')

const pickInitialLang = () => {
  if (!detail.value?.introductionMarkdown) return 'zh-cn' as Language
  const langs: Language[] = ['zh-cn', 'ja-jp', 'en-us']
  return (
    langs.find((l) => detail.value!.introductionMarkdown[l]) ?? ('zh-cn' as Language)
  )
}

watchEffect(() => {
  lang.value = pickInitialLang()
})

const introHtml = computed(() => {
  if (!detail.value?.introductionMarkdown) return ''
  const text = getPreferredLanguageText(
    detail.value.introductionMarkdown,
    lang.value
  )
  return DOMPurify.sanitize(text)
})

const langOptions = [
  { value: 'zh-cn', label: '中文' },
  { value: 'ja-jp', label: '日本語' },
  { value: 'en-us', label: 'English' }
]

// Wiki frontend origin (used to link to the Wiki galgame detail page)
const config = useRuntimeConfig()
const wikiOrigin =
  ((config.public as { wikiOrigin?: string }).wikiOrigin as string) ??
  'https://galgame.kungal.com'
</script>

<template>
  <div v-if="detail" class="space-y-8">
    <section>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="bg-primary h-6 w-1 rounded" />
        <h2 class="text-2xl font-bold">简介</h2>
        <KunSelect
          :model-value="lang"
          :options="langOptions"
          class-name="max-w-36"
          @update:model-value="(v) => (lang = v as Language)"
        />
      </div>
      <div v-if="introHtml" class="kun-prose max-w-none" v-html="introHtml" />
      <KunNull
        v-else
        description="此 Galgame 暂无简介，可到 Galgame Wiki 补充"
      />

      <div class="text-default-500 mt-6 grid gap-4 sm:grid-cols-2">
        <div class="flex items-center gap-2 text-sm">
          <KunIcon name="lucide:clock" class="size-4" />
          <span>
            创建时间: {{ formatDate(detail.created, { isShowYear: true }) }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <KunIcon name="lucide:refresh-cw" class="size-4" />
          <span>
            更新时间: {{ formatDate(detail.updated, { isShowYear: true }) }}
          </span>
        </div>
        <div v-if="detail.vndbId" class="flex items-center gap-2 text-sm">
          <KunIcon name="lucide:link" class="size-4" />
          <span>
            VNDB ID:
            <a
              :href="`https://vndb.org/${detail.vndbId}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              {{ detail.vndbId }}
            </a>
          </span>
        </div>
        <div v-if="detail.galgame" class="flex items-center gap-2 text-sm">
          <KunIcon name="lucide:book-open" class="size-4" />
          <span>
            Galgame Wiki:
            <a
              :href="`${wikiOrigin}/galgame/${detail.galgame.id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              #{{ detail.galgame.id }}（完整角色 / 制作 / 发行信息）
            </a>
          </span>
        </div>
        <div v-if="detail.bid" class="flex items-center gap-2 text-sm">
          <KunIcon name="lucide:tv" class="size-4" />
          <span>
            Bangumi ID:
            <a
              :href="`https://bangumi.tv/subject/${detail.bid}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              {{ detail.bid }}
            </a>
          </span>
        </div>
      </div>
    </section>

    <!-- Tags / officials / characters / staff / screenshots / releases are all
         owned by the Galgame Wiki. We only surface an ID overview and a link
         here; see Wiki for the full details. -->
    <section v-if="detail.galgame">
      <div class="mb-4 flex items-center gap-3">
        <div class="bg-primary h-6 w-1 rounded" />
        <h2 class="text-2xl font-bold">更多信息</h2>
      </div>
      <div class="text-default-600 space-y-2 text-sm">
        <p>
          标签、会社、角色、制作人员、截图、发行版本等详细信息由
          <a
            :href="`${wikiOrigin}/galgame/${detail.galgame.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:underline"
          >
            Galgame Wiki
          </a>
          统一维护。
        </p>
        <div
          v-if="detail.wikiTagIds?.length"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-default-500 shrink-0">标签 ID:</span>
          <KunBadge
            v-for="id in detail.wikiTagIds"
            :key="id"
            size="sm"
            variant="flat"
            color="primary"
          >
            #{{ id }}
          </KunBadge>
        </div>
        <div
          v-if="detail.wikiOfficialIds?.length"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-default-500 shrink-0">发行商 ID:</span>
          <KunBadge
            v-for="id in detail.wikiOfficialIds"
            :key="id"
            size="sm"
            variant="flat"
            color="success"
          >
            #{{ id }}
          </KunBadge>
        </div>
      </div>
    </section>
  </div>

  <KunNull v-else description="加载失败" />
</template>
