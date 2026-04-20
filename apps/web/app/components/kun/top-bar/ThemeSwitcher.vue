<script setup lang="ts">
const colorMode = useColorMode()

const themes = [
  { key: 'light', label: '浅色主题', icon: 'lucide:sun' },
  { key: 'dark', label: '深色主题', icon: 'lucide:moon' },
  { key: 'system', label: '跟随系统', icon: 'lucide:sun-moon' }
] as const

const activeIcon = computed(() => {
  if (colorMode.preference === 'light') return 'lucide:sun'
  if (colorMode.preference === 'dark') return 'lucide:moon'
  return 'lucide:sun-moon'
})

const setTheme = (key: 'light' | 'dark' | 'system') => {
  colorMode.preference = key
}
</script>

<template>
  <KunPopover position="bottom-end" inner-class="p-1 min-w-36">
    <template #trigger>
      <KunButton
        size="sm"
        is-icon-only
        variant="light"
        color="default"
        aria-label="主题切换"
      >
        <KunIcon :name="activeIcon" class="text-default-500 size-5" />
      </KunButton>
    </template>

    <div class="flex flex-col">
      <button
        v-for="t in themes"
        :key="t.key"
        type="button"
        class="hover:bg-default-100 flex items-center gap-2 rounded px-3 py-2 text-left text-sm"
        :class="{
          'bg-default-100 text-primary': colorMode.preference === t.key
        }"
        @click="setTheme(t.key)"
      >
        <KunIcon :name="t.icon" class="size-4" />
        {{ t.label }}
      </button>
    </div>
  </KunPopover>
</template>
