<script setup lang="ts">
import { commentSurface, type CommentTarget } from '~/shared/utils/commentTarget'

const props = withDefaults(
  defineProps<{
    target: CommentTarget
    parentId?: number | null
    seed?: string
    isReply?: boolean
  }>(),
  { parentId: null, seed: '', isReply: false }
)

const emit = defineEmits<{
  close: []
  submitted: [comment: PatchPageComment]
}>()

const api = useApi()
const userStore = useUserStore()
const { requireLogin } = useAuthModal()

const surface = commentSurface(props.target)

const content = ref(props.seed)
const publishing = ref(false)
const editorKey = ref(0)

const resetToSeed = () => {
  content.value = props.seed
  editorKey.value++
}

watch(
  () => props.seed,
  (next) => {
    if (!content.value.trim()) {
      content.value = next
      editorKey.value++
    }
  }
)

const publish = async () => {
  if (!requireLogin()) return
  const text = content.value.trim()
  if (!text) {
    useKunMessage(props.isReply ? '回复内容不能为空' : '评论内容不能为空', 'warn')
    return
  }

  publishing.value = true
  try {
    const res = await api.post<PatchPageComment>(surface.createUrl, {
      content: text,
      ...(props.parentId ? { parent_id: props.parentId } : {})
    })
    if (res.code !== 0) {
      useKunMessage(res.message || '发布失败', 'error')
      return
    }
    resetToSeed()

    if (res.data?.status === 1) {
      useKunMessage(
        props.isReply
          ? '回复已提交，等待版主审核通过后显示'
          : '评论已提交，等待版主审核通过后显示',
        'info'
      )
      emit('close')
      return
    }
    emit('submitted', {
      ...res.data,
      user: userStore.user,
      reply: res.data.reply ?? []
    })
    useKunMessage(props.isReply ? '回复成功' : '评论发布成功', 'success')
    emit('close')
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <KunMarkdownEditor
      :key="editorKey"
      :model-value="content"
      :placeholder="isReply ? '写下你的回复～' : surface.composerPlaceholder"
      @update:model-value="(val) => (content = val)"
    />

    <div class="flex justify-end gap-2">
      <KunButton v-if="isReply" variant="light" size="sm" @click="emit('close')">
        取消
      </KunButton>
      <KunButton
        color="primary"
        rounded="full"
        :size="isReply ? 'sm' : 'md'"
        :loading="publishing"
        :disabled="publishing"
        @click="publish"
      >
        <KunIcon name="lucide:send-horizontal" class="size-4" />
        {{ isReply ? '发布回复' : '发布评论' }}
      </KunButton>
    </div>
  </div>
</template>
