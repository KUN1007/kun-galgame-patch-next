<script setup lang="ts">
// Standalone moyu tag detail page, at /galgame/tag/:id. The entity is a
// CANONICAL CATALOG TAG since wave A2-2 — `:id` is a catalog_tag id, NOT the
// wiki tag id this page used to take (refs/proj/106 R1 / P2).
//
// That is why the page left /tag/:id rather than changing meaning in place: the
// two id spaces overlap numerically — a great many wiki tag ids are also live
// catalog tag ids — so one path serving both would have silently rendered the
// WRONG tag for years-old links. /tag/:id survives as a pure redirect shell that
// resolves the old id and 301s here (or 410s, for the 1,507 wiki tags whose
// vocabulary entry has no canonical successor).
//
// The address settled here in wave 146: entry pages live under the /galgame/
// namespace on BOTH sites, in the singular, so one URL shape describes a tag
// whether you meet it on moyu or on kungal. The intermediate /tags/:id (one
// week old, published 07-29) 301s here from the server middleware.
//
// Reads `GET /tag/_?tag_id=N&page&limit`, which returns the tag entity + its
// paginated galgame list.

import type { KunUIColor } from '@kungal/ui-core'

// keepalive: returning from a galgame restores this tag's page + scroll. The
// page is a computed off `?page=`, so on reactivation it re-reads the URL and
// refetches the right page (a brief, silent re-fetch — list fetches return null
// on miss, no toast). Mirrors kungal's feed keepalive.
// Kept alive via the central include list in app.vue, keyed by this name.
defineOptions({ name: 'tag-detail' })

const route = useRoute()
const router = useRouter()
const ge = useGalgameEdit()

const tagID = computed(() => Number(route.params.id))
const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (v: number) => {
    router.push({ query: { ...route.query, page: v } })
  }
})
const pageHref = usePageHref() // crawlable pagination (<a href>)
const limit = 24

// The canonical vocabulary's two axes, which REPLACED the wiki's
// content|sexual|technical category. They are not a rename: `kind` says whether
// a tag describes the work or the record, `tier` how central it is. Neither
// carries the sexual signal the old `category` did — see the SEO note below.
const KIND_LABEL: Record<string, string> = {
  content: '内容',
  meta: '元信息'
}
const TIER_LABEL: Record<string, string> = {
  core: '核心',
  longtail: '长尾',
  hidden: '隐藏'
}
const TIER_COLOR: Record<string, KunUIColor> = {
  core: 'primary',
  longtail: 'default',
  hidden: 'warning'
}

// moyu answers an id the registry has no tag for with its own not-found
// envelope (GalgameTaxonomyDetailProxy); every other non-zero code is a failure
// to serve a tag that may well exist.
const VERDICT_NOT_FOUND = 40400

const { data, pending } = await useAsyncData(
  () => `tag-detail-${tagID.value}-${page.value}`,
  async () => {
    const res = await ge.tagDetail(tagID.value, { page: page.value, limit })
    return { code: res.code, detail: res.code === 0 ? res.data : null }
  },
  // Refetch on page change AND tag change (navigating between ids without
  // a full remount). Do NOT watch the derived `tag` entity and call refresh():
  // each fetch yields a new `data` object → new `tag` ref → the watch re-fires →
  // refresh() loops forever, pinning `pending` true, which disables every
  // KunPagination button (is-loading) so paging gets stuck after one click.
  { watch: [page, tagID] }
)

// An unknown id ANSWERS 404 instead of rendering an empty 200 shell. A shell is
// a soft 404: the crawler is told the URL is fine, keeps it indexed, keeps
// spending budget on it, and reads the "不存在" copy as thin content on a live
// page — the status line is the only part of that answer it obeys. Deliberately
// NOT thrown for a backend failure, which would retire a live tag because the
// registry blinked; that case keeps the in-page failure state below.
const notFound = () =>
  createError({ statusCode: 404, statusMessage: '标签不存在', fatal: true })

if (data.value?.code === VERDICT_NOT_FOUND) throw notFound()
// Re-checked on every refetch: navigating between two tag ids reuses this
// component (see the watch above), so setup does not run a second time.
watch(data, (v) => {
  if (v?.code === VERDICT_NOT_FOUND) showError(notFound())
})

// galgame shapes the response with `tag` for the entity + `items`/`galgames` +
// `total` for the paginated galgame list. Be defensive about which key it
// uses since the doc shows the request but not the exact response.
const tag = computed(() => data.value?.detail?.tag ?? null)
const galgames = computed<GalgameCard[]>(
  () => data.value?.detail?.galgames ?? []
)
const total = computed(() => data.value?.detail?.total ?? 0)
const totalPage = computed(() => Math.max(1, Math.ceil(total.value / limit)))

// A sexual tag's own NAME is an NSFW signal, so those pages stay out of the
// index — the same rule patch/[id].vue applies. The works list under the tag is
// sfw-gated by the face, so an ordinary tag page is safe to index.
//
// This gate was a blanket noindex for one wave: the canonical tag record
// carried no safety flag (it rode the work detail's tags[] only), so the page
// could not tell the two apart and took the safe direction. A2-1f put `sexual`
// on the record and the gate is precise again.
//
// Also disabled when the tag is missing / the fetch failed, to avoid indexing a
// 404 stub.
if (tag.value && !tag.value.sexual) {
  useKunSeoMeta({
    title: `标签 · ${tag.value.name}`,
    description: `${tag.value.name}（${tag.value.galgame_count ?? '0'} 个 Galgame）汉化补丁、中文补丁资源下载合集`
  })
} else {
  useKunDisableSeo(tag.value ? `标签 · ${tag.value.name}` : '标签详情')
}
</script>

<template>
  <div class="container mx-auto my-6">
    <KunLoading v-if="pending && !tag" description="加载中..." />

    <!-- Only ever the FAILURE state now: a missing tag left through the 404
         above, so this no longer has to say "不存在或". -->
    <KunNull v-else-if="!tag" description="标签加载失败，请稍后重试" />

    <template v-else>
      <!-- Header -->
      <section class="border-default/20 rounded-xl border p-5">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold sm:text-3xl">{{ tag.name }}</h1>
          <KunChip
            :color="TIER_COLOR[tag.tier] ?? 'default'"
            variant="flat"
            size="sm"
          >
            {{ TIER_LABEL[tag.tier] ?? tag.tier }}
          </KunChip>
          <KunChip v-if="tag.kind" color="default" variant="flat" size="sm">
            {{ KIND_LABEL[tag.kind] ?? tag.kind }}
          </KunChip>
          <KunChip color="default" size="sm">
            {{ tag.galgame_count ?? 0 }} 个 Galgame
          </KunChip>
        </div>
        <p
          v-if="tag.description"
          class="text-default-700 mt-3 text-sm whitespace-pre-wrap"
        >
          {{ tag.description }}
        </p>
        <div v-if="tag.aliases?.length" class="mt-3 flex flex-wrap gap-2">
          <span class="text-default-500 text-sm">别名：</span>
          <span
            v-for="a in tag.aliases"
            :key="a"
            class="bg-default-100 rounded-full px-2 py-0.5 text-xs"
          >
            {{ a }}
          </span>
        </div>
      </section>

      <!-- Associated Galgames -->
      <section class="mt-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="bg-primary h-6 w-1 rounded" />
          <h2 class="text-xl font-bold">包含此标签的 Galgame</h2>
        </div>

        <KunNull v-if="!galgames.length" description="暂无关联作品" />

        <div
          v-else
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          <!-- Backend now serves moyu-enriched GalgameCard shape for tag
               detail (GalgameTaxonomyDetailProxy joins each galgame galgame with
               its local patch row for stats), so no client-side adapter
               is needed — render the same component as home / galgame
               index does for full visual + data parity. -->
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
