<script setup lang="ts" generic="T extends GalgameCard">
const props = defineProps<{ items: T[] }>()

defineSlots<{ meta?: (props: { item: T }) => unknown }>()

const settingStore = useSettingStore()

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
