<script setup lang="ts">
// A thin, themed overlay scrollbar (overlayscrollbars) for any scroll box that
// would otherwise show the raw native bar. Pass the height / max-height as a
// class; the slot is the scrollable content.
//
// overlayscrollbars restructures the host into
//   .os-host > .os-padding > .os-viewport > .os-content > <slot>
// so the .os-viewport is the REAL scroller, NOT this host. Anything driving the
// scroll imperatively (scrollTop / scrollTo / scrollHeight) must go through
// getViewport(), not the element it passed a ref to.
//
// The handle is themed by --os-* custom properties set on the host in
// styles/index.css (.kun-os-scroll), which inherit down to .os-scrollbar. That
// is moyu's way rather than overlayscrollbars' built-in os-theme-dark /
// os-theme-light classes: those are two fixed palettes that have to be swapped
// per color mode from JS, whereas moyu's tokens already flip under
// .kun-dark-mode, so one rule covers both modes with no hydration-time swap.
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentRef
} from 'overlayscrollbars-vue'
import type { PartialOptions } from 'overlayscrollbars'

const props = withDefaults(
  defineProps<{
    // Defer initialization to browser-idle. Turn OFF when the consumer needs the
    // viewport synchronously right after mount (e.g. an initial scroll-to-bottom):
    // osInstance() — and so getViewport() — is null until initialization runs.
    defer?: boolean
  }>(),
  { defer: true }
)

const options: PartialOptions = {
  scrollbars: {
    // 'leave': visible while the pointer is over the area, auto-hiding ~500ms
    // after it leaves — an overlay bar, not a permanent fixture.
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
