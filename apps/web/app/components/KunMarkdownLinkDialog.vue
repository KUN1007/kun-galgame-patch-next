<script setup lang="ts">
const isOpen = ref(false)
const url = ref('')
const selection = ref('')

let resolve: ((href: string | null) => void) | null = null

const settle = (href: string | null) => {
  resolve?.(href)
  resolve = null
  isOpen.value = false
}

const prompt = (text: string): Promise<string | null> => {
  settle(null)
  selection.value = text
  url.value = /^https?:\/\//i.test(text.trim()) ? text.trim() : ''
  isOpen.value = true
  return new Promise((r) => (resolve = r))
}

// Escape, the backdrop and the close button all just flip the model, so any
// dismiss that is not 「取消」 would leave the promise pending forever.
watch(isOpen, (open) => {
  if (!open) {
    settle(null)
  }
})

const submit = () => settle(url.value.trim() || null)

const description = computed(() =>
  selection.value
    ? `为选中的「${selection.value.slice(0, 30)}${selection.value.length > 30 ? '…' : ''}」添加链接`
    : '链接地址会作为链接文本插入'
)

defineExpose({ prompt })
</script>

<template>
  <KunModal
    v-model="isOpen"
    title="插入链接"
    :description="description"
    inner-class-name="max-w-md w-[94vw]"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <KunInput
        v-model="url"
        type="url"
        placeholder="https://…"
        :autofocus="true"
      />
      <div class="flex justify-end gap-2">
        <KunButton variant="light" @click="settle(null)">取消</KunButton>
        <KunButton type="submit" variant="flat" color="primary">插入</KunButton>
      </div>
    </form>
  </KunModal>
</template>
