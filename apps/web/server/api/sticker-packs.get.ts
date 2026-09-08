interface StickerItem {
  src: string
  name: string
}

interface StickerPack {
  name: string
  stickers: StickerItem[]
}

/**
 * The official sticker packs, proxied from sticker.kungal.com.
 *
 * The picker's list used to be built here in the browser from
 * `sticker.kungal.com/stickers/KUNgal{set}/{n}.webp` and a hardcoded
 * `[80,80,80,80,80,80,18]`. Every one of those 498 URLs 404s today: the path
 * addressed a position in a collection on a site we do not own, and that site
 * stopped serving static files.
 *
 * Server-side because the browser must not reach across origins for it, and
 * cached because 82 KB is worth fetching once an hour rather than per picker
 * open. `staleMaxAge` is the load-bearing part: a sticker site outage should
 * cost last week's packs, not an empty picker.
 */
export default defineCachedEventHandler(
  async (): Promise<{ packs: StickerPack[] }> => {
    const base = useRuntimeConfig().stickerBaseUrl
    const res = await $fetch<{
      code: number
      message: string
      data: { packs: StickerPack[] } | null
    }>(`${base}/api/v1/editor-packs`, { timeout: 8000 })
    if (res.code !== 0 || !res.data) {
      throw createError({
        statusCode: 502,
        statusMessage: res.message || 'sticker packs unavailable'
      })
    }
    return res.data
  },
  { name: 'sticker-packs', maxAge: 3600, staleMaxAge: 604800, swr: true }
)
