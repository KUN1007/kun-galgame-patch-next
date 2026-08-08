<script setup lang="ts">
const settingStore = useSettingStore()

const isSafeMode = computed(() => settingStore.data.kunNsfwEnable === 'sfw')
</script>

<template>
  <div
    v-if="isSafeMode"
    class="bg-danger/10 text-danger border-danger/20 w-full border-b px-3 py-1.5 text-center text-xs"
    role="status"
    aria-live="polite"
  >
    <KunIcon
      name="lucide:shield-check"
      class="mr-1 inline size-3.5 align-text-bottom"
    />
    当前为 SFW 模式，部分 R18 / NSFW 内容已隐藏 — 您可在右上角切换 "显示全部内容"
  </div>
</template>
