<script setup lang="ts">
import { kunMoyuMoe } from '~/config/moyu-moe'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}
interface PinnedDoc {
  title: string
  banner: string
  description: string
  date: string
  slug: string
  category: string
  author_name: string
  author_avatar: string
}

const config = useRuntimeConfig()
const baseUrl = (
  import.meta.server && config.apiBaseSsr
    ? config.apiBaseSsr
    : config.public.apiBase
) as string

const { data } = await useFetch<ApiEnvelope<PinnedDoc[]>>(
  `${baseUrl}/doc/pinned`,
  { key: 'home-carousel-pinned', default: () => ({ code: 0, message: '', data: [] }) }
)

const posts = computed<HomeCarouselMetadata[]>(() =>
  (data.value?.data ?? []).map((d) => ({
    title: d.title,
    banner: d.banner,
    description: d.description,
    date: d.date,
    author: { id: 0, name: d.author_name, avatar: d.author_avatar },
    pin: true,
    directory: d.category,
    link: `/doc/${d.slug}`
  }))
)
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
    <div class="pointer-events-none hidden select-none md:block">
      <KunImage
        src="/kungalgame-trans.webp"
        :alt="kunMoyuMoe.titleShort"
        loading="eager"
        aspect-ratio="16 / 9"
        class-name="rounded-2xl"
      />
    </div>

    <HomeCarousel :posts="posts ?? []" />
  </div>
</template>
