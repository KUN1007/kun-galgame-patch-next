<script setup lang="ts" generic="T extends GalgameCard">
const props = defineProps<{ items: T[] }>()

defineSlots<{ meta?: (props: { item: T }) => unknown }>()

const settingStore = useSettingStore()

// Which shape every galgame list draws. Only the /galgame and /gallib lanes
// hydrate GalgameCard.facet, so the row layout shows its credits and tags
// there and falls back to cover + title + maker elsewhere.
const layout = computed(() => settingStore.data.galgameListLayout ?? 'poster')
</script>

<template>
  <GalgameRowGrid v-if="layout === 'row'">
    <GalgameRowCard v-for="item in props.items" :key="item.id" :patch="item">
      <template v-if="$slots.meta" #meta>
        <slot name="meta" :item="item" />
      </template>
    </GalgameRowCard>
  </GalgameRowGrid>
  <GalgameCardGrid v-else>
    <GalgameCard v-for="item in props.items" :key="item.id" :patch="item">
      <template v-if="$slots.meta" #meta>
        <slot name="meta" :item="item" />
      </template>
    </GalgameCard>
  </GalgameCardGrid>
</template>
