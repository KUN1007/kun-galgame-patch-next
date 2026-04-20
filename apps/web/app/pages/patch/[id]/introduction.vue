<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify'
import { GALGAME_SORT_YEARS_MAP } from '~/constants/galgame'
import { ROLE_LABELS } from '~/constants/character'

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
  if (!detail.value) return 'zh-cn' as Language
  const langs: Language[] = ['zh-cn', 'ja-jp', 'en-us']
  return langs.find((l) => detail.value!.introduction[l]) ?? 'zh-cn'
}

watchEffect(() => {
  lang.value = pickInitialLang()
})

const introHtml = computed(() => {
  if (!detail.value) return ''
  const text = getPreferredLanguageText(detail.value.introduction, lang.value)
  return DOMPurify.sanitize(text)
})

const showSpoiler = ref(false)
const tagProvider = ref<'vndb' | 'bangumi'>('vndb')

const filteredTags = computed(() => {
  if (!detail.value) return []
  const base = detail.value.tag.filter((t) => t.provider === tagProvider.value)
  return showSpoiler.value
    ? base
    : base.filter((t) => (t.spoiler_level ?? 0) === 0)
})

const langOptions = [
  { value: 'zh-cn', label: '中文' },
  { value: 'ja-jp', label: '日本語' },
  { value: 'en-us', label: 'English' }
]
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
        <div v-if="detail.released" class="flex items-center gap-2 text-sm">
          <KunIcon name="lucide:calendar" class="size-4" />
          <span>
            发售时间:
            {{ GALGAME_SORT_YEARS_MAP[detail.released] ?? detail.released }}
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

      <div
        v-if="detail.company.length"
        class="text-default-500 mt-4 flex flex-wrap items-center gap-2 text-sm"
      >
        <KunIcon name="lucide:building-2" class="size-4" />
        <span class="shrink-0">制作会社:</span>
        <NuxtLink
          v-for="c in detail.company"
          :key="c.id"
          :to="`/company/${c.id}`"
          class="text-primary hover:underline"
        >
          {{ c.name }} +{{ c.count }}
        </NuxtLink>
      </div>

      <div
        v-if="detail.alias.length"
        class="text-default-500 mt-2 flex flex-wrap items-center gap-2 text-sm"
      >
        <span class="shrink-0">别名:</span>
        <span v-for="a in detail.alias" :key="a.id">{{ a.name }}</span>
      </div>
    </section>

    <section>
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="bg-primary h-6 w-1 rounded" />
          <h2 class="text-2xl font-bold">标签</h2>
        </div>
        <div class="flex items-center gap-3">
          <KunCheckBox v-model="showSpoiler" label="显示剧透" />
          <div class="flex gap-1">
            <button
              type="button"
              :class="
                cn(
                  'px-3 py-1 text-sm',
                  tagProvider === 'vndb'
                    ? 'border-primary text-primary border-b-2'
                    : 'text-default-500'
                )
              "
              @click="tagProvider = 'vndb'"
            >
              VNDB
            </button>
            <button
              type="button"
              :class="
                cn(
                  'px-3 py-1 text-sm',
                  tagProvider === 'bangumi'
                    ? 'border-primary text-primary border-b-2'
                    : 'text-default-500'
                )
              "
              @click="tagProvider = 'bangumi'"
            >
              Bangumi
            </button>
          </div>
        </div>
      </div>
      <div class="flex max-h-[300px] flex-wrap gap-2 overflow-y-auto">
        <NuxtLink
          v-for="tag in filteredTags"
          :key="`${tag.provider}-${tag.id}`"
          :to="`/tag/${tag.id}`"
        >
          <KunBadge
            :color="
              tag.category === 'content'
                ? 'primary'
                : tag.category === 'sexual'
                  ? 'danger'
                  : 'success'
            "
            variant="flat"
          >
            {{ getPreferredLanguageText(tag.name) }} +{{ tag.count }}
            <span v-if="tag.spoiler_level > 0" class="text-warning-600 font-bold">
              *剧透
            </span>
          </KunBadge>
        </NuxtLink>
        <KunNull
          v-if="!filteredTags.length"
          description="暂无标签, 或者您未开启网站 NSFW 模式"
        />
      </div>
    </section>

    <section v-if="detail.screenshot?.length">
      <div class="mb-4 flex items-center gap-3">
        <div class="bg-primary h-6 w-1 rounded" />
        <h2 class="text-2xl font-bold">截图</h2>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        <img
          v-for="s in detail.screenshot"
          :key="s.id"
          :src="s.thumbnail_url || s.url"
          :alt="s.image_id"
          class="bg-default-100 h-40 w-full rounded object-cover"
        />
      </div>
    </section>

    <section v-if="detail.char?.length">
      <div class="mb-4 flex items-center gap-3">
        <div class="bg-primary h-6 w-1 rounded" />
        <h2 class="text-2xl font-bold">角色</h2>
      </div>
      <div
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        <CharacterCard v-for="c in detail.char" :key="c.id" :character="c" />
      </div>
    </section>

    <section v-if="detail.person?.length">
      <div class="mb-4 flex items-center gap-3">
        <div class="bg-primary h-6 w-1 rounded" />
        <h2 class="text-2xl font-bold">制作人员</h2>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PersonCard v-for="p in detail.person" :key="p.id" :person="p" />
      </div>
    </section>

    <section v-if="detail.release?.length">
      <div class="mb-4 flex items-center gap-3">
        <div class="bg-primary h-6 w-1 rounded" />
        <h2 class="text-2xl font-bold">发行版本</h2>
      </div>
      <div class="space-y-2">
        <div
          v-for="r in detail.release"
          :key="r.id"
          class="border-default/20 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
        >
          <div class="flex-1">
            <div class="font-semibold line-clamp-1">{{ r.title }}</div>
            <div class="text-default-500 text-xs">
              {{ r.released }}
              <span v-if="r.minage" class="ml-2">{{ r.minage }}+</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-1">
            <KunBadge
              v-for="p in r.platforms"
              :key="p"
              size="sm"
              variant="flat"
              color="success"
            >
              {{ p }}
            </KunBadge>
            <KunBadge
              v-for="l in r.languages"
              :key="l"
              size="sm"
              variant="flat"
              color="secondary"
            >
              {{ l }}
            </KunBadge>
          </div>
        </div>
      </div>
    </section>
  </div>

  <KunNull v-else description="加载失败" />
</template>
