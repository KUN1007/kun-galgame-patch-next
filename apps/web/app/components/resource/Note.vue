<script setup lang="ts">
const props = withDefaults(
  defineProps<{ html: string; maxHeight?: number }>(),
  { maxHeight: 100 }
)

const contentRef = ref<HTMLElement | null>(null)
const measured = ref(false)
const collapsible = ref(false)
const collapsed = ref(true)

const clampStyle = computed(() =>
  !measured.value || (collapsible.value && collapsed.value)
    ? { maxHeight: `${props.maxHeight}px` }
    : {}
)
const showFade = computed(() => collapsible.value && collapsed.value)

const measure = () => {
  const el = contentRef.value
  if (!el) return
  collapsible.value = el.scrollHeight > props.maxHeight + 4
  measured.value = true
}

onMounted(() => nextTick(measure))
watch(
  () => props.html,
  () => {
    measured.value = false
    collapsed.value = true
    nextTick(measure)
  }
)
</script>

<template>
  <div class="border-default/15 bg-default-50 rounded-xl border p-3 text-sm">
    <div class="relative">
      <div
        ref="contentRef"
        class="overflow-hidden transition-[max-height] duration-300"
        :style="clampStyle"
      >
        <KunContent :content="props.html" />
      </div>
      <div
        v-if="showFade"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-default-50/90"
      />
    </div>

    <button
      v-if="collapsible"
      type="button"
      class="text-primary hover:text-primary-600 mt-2 flex items-center gap-1 text-xs font-medium transition-colors"
      @click="collapsed = !collapsed"
    >
      <KunIcon
        :name="collapsed ? 'lucide:chevron-down' : 'lucide:chevron-up'"
        class="size-3.5"
      />
      {{ collapsed ? '展开' : '收起' }}
    </button>
  </div>
</template>
