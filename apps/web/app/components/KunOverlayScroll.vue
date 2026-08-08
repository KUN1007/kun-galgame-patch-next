<script setup lang="ts">
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentRef
} from 'overlayscrollbars-vue'
import type { PartialOptions } from 'overlayscrollbars'

const props = withDefaults(
  defineProps<{
    defer?: boolean
  }>(),
  { defer: true }
)

const options: PartialOptions = {
  scrollbars: {
    autoHide: 'leave',
    autoHideDelay: 500
  }
}

const osRef = ref<OverlayScrollbarsComponentRef | null>(null)

const getViewport = (): HTMLElement | null =>
  osRef.value?.osInstance()?.elements().viewport ?? null

defineExpose({ getViewport })
</script>

<template>
  <OverlayScrollbarsComponent
    ref="osRef"
    class="kun-os-scroll"
    :options="options"
    :defer="props.defer"
  >
    <slot />
  </OverlayScrollbarsComponent>
</template>
