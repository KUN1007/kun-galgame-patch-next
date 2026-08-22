<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { normalizeLinkHref } from '@kungal/editor-core'
import type { KunEditorToolbarApi } from '@kungal/editor-vue'

const props = defineProps<{
  api: KunEditorToolbarApi
  upload: (file: File) => Promise<string>
}>()

const HISTORY_KEY = 'moyu-editor-image-history'
const HISTORY_MAX = 12

const url = ref('')
const history = ref<string[]>([])
const busy = ref(false)
let popover: { close: () => void } | null = null
const setPopover = (el: unknown) => {
  popover = el as { close: () => void } | null
}
let fileEl: HTMLInputElement | null = null
const setFile = (el: unknown) => {
  fileEl = el as HTMLInputElement | null
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) history.value = JSON.parse(raw)
  } catch {
    history.value = []
  }
})
const remember = (src: string) => {
  history.value = [src, ...history.value.filter((s) => s !== src)].slice(
    0,
    HISTORY_MAX
  )
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  } catch {
    return
  }
}

const insertUrl = () => {
  const src = normalizeLinkHref(url.value)
  if (!src) return
  props.api.insertImage({ src })
  remember(src)
  url.value = ''
  popover?.close()
}

const uploadFiles = async (files: File[]) => {
  const imgs = files.filter((f) => !f.type || f.type.startsWith('image/'))
  if (!imgs.length) return
  busy.value = true
  try {
    for (const f of imgs) {
      const src = await props.upload(f)
      props.api.insertImage({ src })
      remember(src)
    }
  } finally {
    busy.value = false
  }
  popover?.close()
}

const pick = () => fileEl?.click()
const onFile = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  if (files.length) void uploadFiles(files)
}
const onDrop = (e: DragEvent) => {
  if (e.dataTransfer?.files?.length) {
    void uploadFiles(Array.from(e.dataTransfer.files))
  }
}
const insertFromHistory = (src: string) => {
  props.api.insertImage({ src })
  remember(src)
  popover?.close()
}
</script>

<template>
  <KunPopover
    :ref="setPopover"
    position="bottom-start"
    :opaque="true"
    inner-class="w-80 space-y-3 p-3"
  >
    <template #trigger>
      <KunTooltip text="插入图片" :delay-show="300">
        <KunButton
          variant="light"
          size="sm"
          :is-icon-only="true"
          aria-label="插入图片"
        >
          <KunIcon name="lucide:image" />
        </KunButton>
      </KunTooltip>
    </template>

    <form class="flex items-center gap-1" @submit.prevent="insertUrl">
      <!-- Not type="url": native validation rejects a schemeless src, and the
           form's submit event then never fires, so Enter did nothing at all. -->
      <KunInput
        v-model="url"
        inputmode="url"
        size="sm"
        placeholder="粘贴图片链接…"
        class="flex-1"
      />
      <KunButton type="submit" variant="flat" color="primary" size="sm">
        插入
      </KunButton>
    </form>

    <div
      class="border-default-300 text-default-500 hover:border-primary rounded-kun-md border border-dashed p-4 text-center text-sm transition-colors"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <KunIcon name="lucide:cloud-upload" class="mx-auto mb-1 text-xl" />
      <p>拖拽一张或多张图片到此处</p>
      <KunButton
        variant="flat"
        size="sm"
        class="mt-2"
        :loading="busy"
        @click="pick"
      >
        选择图片
      </KunButton>
      <input
        :ref="setFile"
        type="file"
        accept="image/*"
        multiple
        hidden
        @change="onFile"
      />
    </div>

    <div v-if="history.length">
      <div class="text-default-500 mb-1 text-xs">最近使用</div>
      <div class="grid grid-cols-4 gap-1">
        <button
          v-for="(src, i) in history"
          :key="i"
          type="button"
          class="hover:ring-primary overflow-hidden rounded ring-2 ring-transparent"
          @click="insertFromHistory(src)"
        >
          <img :src="src" alt="" class="h-14 w-full object-cover" />
        </button>
      </div>
    </div>
  </KunPopover>
</template>
