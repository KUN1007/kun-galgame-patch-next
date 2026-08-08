<script setup lang="ts">
interface Props {
  posts: HomeCarouselMetadata[]
}

const props = defineProps<Props>()
</script>

<template>
  <KunCarousel
    :autoplay="5000"
    :slides-per-view="1"
    aria-label="置顶公告轮播"
  >
    <KunCarouselItem
      v-for="(post, index) in props.posts"
      :key="post.link ?? index"
      class-name="relative h-[300px] overflow-hidden rounded-2xl md:h-auto md:aspect-video"
    >
      <HomeCarouselDesktopCard :post="post" :eager="index === 0" />
      <HomeCarouselMobileCard :post="post" :eager="index === 0" />
    </KunCarouselItem>
  </KunCarousel>
</template>
