<script setup lang="ts">
interface Props {
  post: KunPostMetadata
}

const props = defineProps<Props>()
</script>

<template>
  <NuxtLink
    :to="`/doc/${props.post.slug}`"
    class="bg-content1 shadow-kun-sm border-default/20 hover:bg-default-100 group block w-full overflow-hidden rounded-lg border transition-all duration-200 hover:scale-[1.02]"
  >
    <div class="space-y-3 p-4">
      <h2 class="mb-2 text-xl font-bold">{{ props.post.title }}</h2>

      <KunImage
        v-if="props.post.banner"
        :src="props.post.banner"
        :alt="props.post.title"
        provider="none"
        loading="lazy"
        aspect-ratio="16 / 9"
        class-name="rounded-t-lg"
      />

      <div class="text-default-500 flex items-center gap-4 text-sm">
        <div v-if="props.post.date" class="flex items-center gap-1">
          <KunIcon name="lucide:calendar" class="size-4" />
          <time>{{ formatDistanceToNow(props.post.date) }}</time>
        </div>
        <div class="flex items-center gap-1">
          <KunIcon name="lucide:type" class="size-4" />
          <span>{{ props.post.text_count ?? 0 }} 字</span>
        </div>
      </div>
    </div>

    <div
      class="border-default-200 bg-default-50 text-default-600 flex items-center gap-1 border-t px-5 py-3 text-sm"
    >
      <span>点击阅读更多</span>
      <KunIcon name="lucide:arrow-right" class="size-4" />
    </div>
  </NuxtLink>
</template>
