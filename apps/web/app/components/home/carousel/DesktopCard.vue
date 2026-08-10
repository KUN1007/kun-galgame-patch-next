<script setup lang="ts">
import { aboutDirectoryLabelMap } from '~/constants/about'

interface Props {
  post: HomeCarouselMetadata
  eager?: boolean
}

const props = defineProps<Props>()

const post = computed(() => props.post)
</script>

<template>
  <div v-if="post" class="group hidden h-full sm:block">
    <KunImage
      :src="post.banner"
      :alt="post.title"
      provider="none"
      :loading="props.eager ? 'eager' : 'lazy'"
      :fetchpriority="props.eager ? 'high' : 'auto'"
      class-name="block h-full w-full rounded-2xl"
      image-class-name="brightness-75"
    />
    <div
      class="absolute inset-0 rounded-2xl bg-black/20"
    />

    <HomeCarouselNavigationMenu />

    <div
      class="bg-background/80 absolute right-4 bottom-4 left-4 rounded-lg border-none p-4 backdrop-blur-md"
    >
      <div class="flex justify-between">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <KunAvatar :user="post.author" size="sm" />
            <span class="text-foreground/80 text-sm">
              {{ post.author.name }}
            </span>
          </div>
          <KunLink
            color="default"
            underline="none"
            :to="post.link"
            class-name="hover:text-primary-500 mb-2 text-2xl font-bold line-clamp-1"
          >
            <h1>{{ post.title }}</h1>
          </KunLink>
        </div>
      </div>

      <p class="text-foreground/80 mb-2 text-sm line-clamp-1">
        {{ post.description }}
      </p>
      <div class="flex flex-wrap gap-2">
        <KunChip variant="flat" size="sm" color="primary">
          {{ aboutDirectoryLabelMap[post.directory] }}
        </KunChip>

        <KunChip variant="flat" size="sm">
          {{ formatDistanceToNow(post.date) }}
        </KunChip>
      </div>
    </div>
  </div>
</template>
