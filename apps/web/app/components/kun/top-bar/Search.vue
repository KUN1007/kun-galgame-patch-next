<script setup lang="ts">
import { useMagicKeys } from '@vueuse/core'

const keys = useMagicKeys()
watch([keys['ctrl+k'], keys['meta+k']], ([ctrlK, metaK]) => {
  if (ctrlK || metaK) {
    navigateTo('/search')
  }
})
</script>

<template>
  <KunTooltip text="Ctrl + K 快速搜索" position="bottom">
    <KunButton
      size="sm"
      is-icon-only
      variant="light"
      color="default"
      aria-label="搜索"
      href="/search"
    >
      <KunIcon name="lucide:search" class="text-default-500 size-6" />
    </KunButton>
  </KunTooltip>
</template>
