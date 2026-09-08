<script setup lang="ts">
import { emojiArray } from '~/constants/emoji'

const emit = defineEmits<{
  emoji: [emoji: string]
  sticker: [url: string]
}>()

const tab = ref<'emoji' | 'sticker'>('emoji')

// Loaded on first open of the sticker tab, not on mount: most messages are sent
// without one, and the payload is 82 KB.
const { packs, load } = useStickerPacks()
const stickers = computed(() => packs.value.flatMap((pack) => pack.stickers))
watch(tab, (value) => {
  if (value === 'sticker') load()
})
</script>

<template>
  <div class="w-80 sm:w-96">
    <KunTab
      v-model="tab"
      :items="[
        { value: 'emoji', textValue: '表情' },
        { value: 'sticker', textValue: '贴纸' }
      ]"
      variant="underlined"
      color="primary"
      size="sm"
      class="mb-2"
    />

    <div v-show="tab === 'emoji'" class="h-48 overflow-y-auto">
      <div class="grid grid-cols-8 gap-1 p-1">
        <KunButton
          v-for="(e, i) in emojiArray"
          :key="i"
          variant="light"
          color="default"
          size="sm"
          is-icon-only
          class-name="text-xl"
          @click="emit('emoji', e)"
        >
          {{ e }}
        </KunButton>
      </div>
    </div>

    <div v-show="tab === 'sticker'" class="h-48 overflow-y-auto">
      <div class="grid grid-cols-5 gap-2 p-1">
        <KunButton
          v-for="sticker in stickers"
          :key="sticker.src"
          variant="light"
          color="default"
          size="sm"
          is-icon-only
          class-name="p-1"
          @click="emit('sticker', sticker.src)"
        >
          <KunImage
            :src="sticker.src"
            :alt="sticker.name"
            :width="64"
            :height="64"
            loading="lazy"
            object-fit="contain"
            class-name="size-16"
          />
        </KunButton>
      </div>
    </div>
  </div>
</template>
