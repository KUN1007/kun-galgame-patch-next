<script setup lang="ts">
import localforage from 'localforage'

interface Props {
  errors?: string
}

defineProps<Props>()

const previewUrl = ref<string>('')
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  const saved = await localforage.getItem<Blob>('kun-patch-banner')
  if (saved) {
    previewUrl.value = URL.createObjectURL(saved)
  }
})

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    useKunMessage('请选择图片文件', 'error')
    return
  }
  await localforage.setItem('kun-patch-banner', file)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
}

const removeBanner = async () => {
  await localforage.removeItem('kun-patch-banner')
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <h2 class="text-xl">预览图片</h2>
    <p>
      注意, <b>您不可以使用 R18 图片作为封面</b>, 建议使用 1920×1080 尺寸
    </p>
    <p v-if="errors" class="text-danger-500 text-xs">{{ errors }}</p>

    <div
      class="border-default/20 bg-default-50 relative rounded-lg border-2 border-dashed p-4"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="banner preview"
        class="bg-default-100 aspect-video w-full rounded object-cover"
      />
      <div
        v-else
        class="text-default-500 flex aspect-video w-full items-center justify-center"
      >
        <div class="text-center">
          <KunIcon name="lucide:image" class="mx-auto mb-2 size-12" />
          <p class="text-sm">点击下方按钮选择图片</p>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />

      <div class="mt-3 flex gap-2">
        <KunButton color="primary" variant="flat" @click="fileInput?.click()">
          选择图片
        </KunButton>
        <KunButton
          v-if="previewUrl"
          color="danger"
          variant="light"
          @click="removeBanner"
        >
          删除
        </KunButton>
      </div>
    </div>
  </div>
</template>
