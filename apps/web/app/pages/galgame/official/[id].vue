<script setup lang="ts">
// Standalone moyu label (brand / publisher / circle — what the wiki called an
// "official") detail page, at /galgame/official/:id. Mirrors the sibling tag
// page's layout.
//
// The entity is a CANONICAL CATALOG LABEL since wave A2-2 — `:id` is a
// catalog_label id, not the wiki official id this page used to take. Hence the
// move off /official/:id: the two id spaces overlap numerically, so serving
// both from one path would render the wrong company (refs/proj/106 R1 / P2).
// /official/:id survives as a pure redirect shell, which resolves every old id
// through the catalog reverse lookup — the rescue wave registered all 24,334 of
// them, so that lane needs no static table and has no 410 case.
//
// The address settled here in wave 146: entry pages live under the /galgame/
// namespace on BOTH sites, and the noun is `official` on both — the intermediate
// /labels/:id (one week old, published 07-29) 301s here from the server
// middleware. "label" was the catalog's word for the record; the two sites'
// users only ever say 会社/official.

// keepalive: returning from a galgame restores this official's page + scroll.
// The page is a computed off `?page=`, so reactivation re-reads the URL and
// refetches the right page (brief silent re-fetch). Mirrors kungal's feed.
// Kept alive via the central include list in app.vue, keyed by this name.
defineOptions({ name: 'label-detail' })

const route = useRoute()
const router = useRouter()
const ge = useGalgameEdit()

const officialID = computed(() => Number(route.params.id))
const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (v: number) => {
    router.push({ query: { ...route.query, page: v } })
  }
})
const pageHref = usePageHref() // crawlable pagination (<a href>)
const limit = 24

// The catalog's label vocabulary, which REPLACED the wiki's
// company|individual|amateur. A visible wording change on this page, and the
// canonical set from here on; an unmapped token renders verbatim.
const CATEGORY_LABEL: Record<string, string> = {
  game_brand: '游戏品牌',
  bunko: '文库',
  publisher: '发行商',
  anime_studio: '动画工作室',
  doujin_circle: '同人社团',
  group: '团体',
  other: '其他'
}

// moyu answers an id the registry has no label for with its own not-found
// envelope (GalgameTaxonomyDetailProxy); every other non-zero code is a failure
// to serve a company that may well exist.
const VERDICT_NOT_FOUND = 40400

const { data, pending } = await useAsyncData(
  () => `official-detail-${officialID.value}-${page.value}`,
  async () => {
    const res = await ge.officialDetail(officialID.value, {
      page: page.value,
      limit
    })
    return { code: res.code, detail: res.code === 0 ? res.data : null }
  },
  // Watches the ID as well as the page — navigating between two officials
  // reuses this component. This used to be `watch(official, () => refresh())`,
  // which is the loop the sibling tag page warns about: every fetch yields a
  // new `data` object → a new `official` ref → the watch re-fires → refresh()
  // never settles and `pending` stays true, disabling the pagination buttons.
  { watch: [page, officialID] }
)

// An unknown id ANSWERS 404 rather than rendering an empty 200 shell — see the
// sibling tag page for why a soft 404 is the one thing a crawler will not
// forgive. A backend failure deliberately does NOT 404; it keeps the in-page
// failure state below.
const notFound = () =>
  createError({ statusCode: 404, statusMessage: '会社不存在', fatal: true })

if (data.value?.code === VERDICT_NOT_FOUND) throw notFound()
watch(data, (v) => {
  if (v?.code === VERDICT_NOT_FOUND) showError(notFound())
})

const official = computed(() => data.value?.detail?.official ?? null)
const galgames = computed<GalgameCard[]>(
  () => data.value?.detail?.galgames ?? []
)
const total = computed(() => data.value?.detail?.total ?? 0)
const totalPage = computed(() => Math.max(1, Math.ceil(total.value / limit)))

// The label lane keeps its SEO: a company name is not itself an NSFW signal
// (which is why the old gate only ever special-cased sexual TAGS), and the
// works list under it is sfw-gated by the face. Only the missing-entity stub is
// kept out of the index.
if (official.value) {
  useKunSeoMeta({
    title: `会社 · ${official.value.name}`,
    description: `${official.value.name}（${official.value.galgame_count ?? '0'} 个 Galgame）的汉化补丁、中文补丁资源下载合集`
  })
} else {
  useKunDisableSeo('会社详情')
}
</script>

<template>
  <div class="container mx-auto my-6">
    <KunLoading v-if="pending && !official" description="加载中..." />

    <!-- Only ever the FAILURE state now: a missing company left through the
         404 above, so this no longer has to say "不存在或". -->
    <KunNull v-else-if="!official" description="会社加载失败，请稍后重试" />

    <template v-else>
      <!-- Header -->
      <section class="border-default/20 rounded-xl border p-5">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold sm:text-3xl">{{ official.name }}</h1>
          <KunChip color="success" variant="flat" size="sm">
            {{ CATEGORY_LABEL[official.category] ?? official.category }}
          </KunChip>
          <KunChip color="default" size="sm">
            {{ official.galgame_count ?? 0 }} 个 Galgame
          </KunChip>
          <a
            v-if="official.link"
            :href="official.link"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary text-sm hover:underline"
          >
            <KunIcon name="lucide:external-link" class="inline size-3.5" />
            官网
          </a>
        </div>
        <p
          v-if="official.description"
          class="text-default-700 mt-3 text-sm whitespace-pre-wrap"
        >
          {{ official.description }}
        </p>
        <div v-if="official.aliases?.length" class="mt-3 flex flex-wrap gap-2">
          <span class="text-default-500 text-sm">别名：</span>
          <span
            v-for="a in official.aliases"
            :key="a"
            class="bg-default-100 rounded-full px-2 py-0.5 text-xs"
          >
            {{ a }}
          </span>
        </div>
        <p v-if="official.lang" class="text-default-500 mt-2 text-xs">
          主语言: {{ official.lang }}
        </p>
      </section>

      <!-- Associated Galgames -->
      <section class="mt-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="bg-primary h-6 w-1 rounded" />
          <h2 class="text-xl font-bold">由此会社发布的 Galgame</h2>
        </div>

        <KunNull v-if="!galgames.length" description="暂无关联作品" />

        <div
          v-else
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          <!-- Backend now serves moyu-enriched GalgameCard shape for
               official detail (GalgameTaxonomyDetailProxy) — same shape as
               home / galgame index, render the same component. -->
          <GalgameCard v-for="g in galgames" :key="g.id" :patch="g" />
        </div>

        <KunPagination
          v-if="totalPage > 1"
          v-model:current-page="page"
          :total-page="totalPage"
          :is-loading="pending"
          :page-href="pageHref"
          class="mt-6"
        />
      </section>
    </template>
  </div>
</template>
