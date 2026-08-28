<script setup lang="ts">
const props = defineProps<{ layout: 'poster' | 'row' }>()
</script>

<template>
  <div
    class="bg-content1 border-default/20 pointer-events-none mx-auto flex h-[104px] w-full max-w-[150px] flex-col justify-center rounded-md border p-2"
  >
    <div v-if="props.layout === 'row'" class="space-y-2">
      <div v-for="n in 2" :key="n" class="flex gap-1.5">
        <div
          class="bg-default-300 w-7 shrink-0 rounded-xs"
          style="aspect-ratio: 5 / 7"
        />
        <div class="flex-1 space-y-1.5 py-0.5">
          <div class="bg-default-300 h-1.5 rounded-full" />
          <div class="bg-default-200 h-1 w-1/2 rounded-full" />
          <div class="bg-default-200 h-1 w-3/4 rounded-full" />
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-3 gap-1.5">
      <div v-for="n in 3" :key="n" class="space-y-1">
        <div class="bg-default-300 rounded-xs" style="aspect-ratio: 5 / 7" />
        <div class="bg-default-200 h-1 w-3/4 rounded-full" />
      </div>
    </div>
  </div>
</template>
