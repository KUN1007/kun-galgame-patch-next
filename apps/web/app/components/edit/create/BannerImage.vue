<script setup lang="ts">
interface Props {
  errors?: string
}

defineProps<Props>()

const previewUrl = ref<string>('')

onMounted(async () => {
  const saved = await getImage('kun-patch-banner')
  if (saved) {
    previewUrl.value = URL.createObjectURL(saved)
  }
})

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

const handleCropComplete = async (blob: Blob) => {
  await saveImage(blob, 'kun-patch-banner')
}

const handleRemove = async () => {
  await deleteImage('kun-patch-banner')
}
</script>

<template>
  <div class="space-y-2">
    <h2 class="text-xl">预览图片</h2>
    <p>
      注意, <b>您不可以使用 R18 图片作为封面</b>, 如果有, 请更换图片、打码或裁剪
    </p>
    <p>
      预览图片实在太影响排版了, 无论如何请尽量寻找一个清晰的图片
    </p>
    <p v-if="errors" class="text-danger-500 text-xs">{{ errors }}</p>

    <KunCropperImageCropper
      :aspect-ratio="16 / 9"
      :initial-image="previewUrl"
      hint="点击或拖放图片到此处裁剪"
      description="您的预览图片将会被固定为 16:9 比例"
      @complete="handleCropComplete"
      @remove="handleRemove"
    />
  </div>
</template>
