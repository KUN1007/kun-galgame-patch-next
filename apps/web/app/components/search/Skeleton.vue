<script setup lang="ts">
withDefaults(
  defineProps<{
    shape?: 'row' | 'card'
    count?: number
  }>(),
  { shape: 'row', count: 4 }
)
</script>

<template>
  <div
    v-if="shape === 'card'"
    class="grid grid-cols-2 gap-4 lg:grid-cols-3"
    aria-hidden="true"
  >
    <KunSkeleton v-for="i in count" :key="i" height="10rem" rounded="lg" />
  </div>

  <div v-else class="space-y-3" aria-hidden="true">
    <KunSkeleton v-for="i in count" :key="i" height="5.5rem" rounded="lg" />
  </div>
</template>
