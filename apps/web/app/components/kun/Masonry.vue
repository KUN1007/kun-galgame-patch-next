<script setup lang="ts" generic="T">
interface Props {
  items: readonly T[]
  colMinWidth?: number
  gap?: number
  className?: string
}
const props = withDefaults(defineProps<Props>(), {
  colMinWidth: 256,
  gap: 24,
  className: ''
})

defineSlots<{
  default(props: { item: T; columnIndex: number; itemIndex: number }): unknown
}>()

const containerRef = ref<HTMLElement | null>(null)
const { columns, colCount, isReady } = useMasonryColumns<T>(
  () => props.items,
  {
    containerRef,
    colMinWidth: () => props.colMinWidth,
    gap: () => props.gap
  }
)
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'grid w-full transition-opacity duration-300',
        isReady ? 'opacity-100' : 'opacity-0',
        className
      )
    "
    :style="{
      gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
      gap: `${props.gap}px`
    }"
  >
    <div
      v-for="(col, ci) in columns"
      :key="ci"
      class="flex min-w-0 flex-col"
      :style="{ gap: `${props.gap}px` }"
    >
      <slot
        v-for="(item, ii) in col"
        :item="item"
        :column-index="ci"
        :item-index="ii"
      />
    </div>
  </div>
</template>
