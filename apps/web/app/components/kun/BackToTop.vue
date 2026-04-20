<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const { y } = useWindowScroll()

const show = computed(() => y.value > 400)

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <KunButton
      v-if="show"
      is-icon-only
      color="primary"
      class-name="fixed bottom-12 right-3 z-50"
      aria-label="回到顶部"
      @click="scrollToTop"
    >
      <KunIcon name="lucide:arrow-up" class="h-6 w-6" />
    </KunButton>
  </Transition>
</template>
