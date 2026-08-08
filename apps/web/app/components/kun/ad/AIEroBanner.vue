<script setup lang="ts">
import { kunMoyuMoe } from '~/config/moyu-moe'

interface Props {
  className?: string
}
const props = withDefaults(defineProps<Props>(), { className: '' })

const userStore = useUserStore()
</script>

<template>
  <div
    v-if="!userStore.isAdFree"
    :class="cn('overflow-hidden rounded-2xl shadow-xl', props.className)"
  >
    <a
      :href="kunMoyuMoe.ad[0]?.url"
      target="_blank"
      rel="noopener noreferrer"
      class="block h-full w-full"
    >
      <KunImage
        src="/a/moyumoe1.avif"
        alt=""
        provider="none"
        aspect-ratio="1920 / 300"
        class-name="w-full"
        image-class-name="pointer-events-none select-none"
      />
    </a>
  </div>
</template>
