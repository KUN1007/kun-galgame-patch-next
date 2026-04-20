<script setup lang="ts">
import {
  KUN_CONTENT_LIMIT_LABEL,
  KUN_CONTENT_LIMIT_MAP
} from '~/constants/top-bar'

const settingStore = useSettingStore()

const options = [
  { key: 'sfw', icon: 'lucide:shield-check' },
  { key: 'nsfw', icon: 'lucide:ban' },
  { key: 'all', icon: 'lucide:circle-slash' }
] as const

const isDanger = computed(() => {
  const v = settingStore.data.kunNsfwEnable
  return !!v && v !== 'sfw'
})

const onSelect = (key: string) => {
  settingStore.setData({ kunNsfwEnable: key })
  if (import.meta.client) location.reload()
}
</script>

<template>
  <KunPopover position="bottom-end" inner-class="p-1 min-w-64">
    <template #trigger>
      <KunTooltip text="内容显示切换" position="bottom">
        <KunButton
          size="sm"
          variant="flat"
          :color="isDanger ? 'danger' : 'success'"
          aria-label="内容限制"
        >
          {{ KUN_CONTENT_LIMIT_LABEL[settingStore.data.kunNsfwEnable] }}
        </KunButton>
      </KunTooltip>
    </template>

    <div class="flex flex-col">
      <button
        v-for="opt in options"
        :key="opt.key"
        type="button"
        class="hover:bg-default-100 flex items-center gap-2 rounded px-3 py-2 text-left text-sm"
        :class="{
          'bg-default-100 text-primary':
            settingStore.data.kunNsfwEnable === opt.key
        }"
        @click="onSelect(opt.key)"
      >
        <KunIcon :name="opt.icon" class="size-5" />
        {{ KUN_CONTENT_LIMIT_MAP[opt.key] }}
      </button>
    </div>
  </KunPopover>
</template>
