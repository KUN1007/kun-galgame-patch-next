<script setup lang="ts">
// The compose box behind every comment area — root mode (rendered by
// CommentSection above the list) and reply mode (rendered by CommentRow inline
// beneath the post being replied to). Which endpoint it posts to comes from the
// target's descriptor, so adding a comment area needs no change here.
import { commentSurface, type CommentTarget } from '~/shared/utils/commentTarget'

const props = withDefaults(
  defineProps<{
    target: CommentTarget
    // Reply mode: the ROOT comment this attaches to (replies are one tier).
    parentId?: number | null
    // Pre-filled body, e.g. the @mention seeded when replying to a reply.
    seed?: string
    isReply?: boolean
  }>(),
  { parentId: null, seed: '', isReply: false }
)

const emit = defineEmits<{
  close: []
  // The server-returned comment, so the container can splice it in without
  // re-fetching. Not emitted for a comment held for review — there is nothing
  // to show yet and the message below says so.
  submitted: [comment: PatchPageComment]
}>()

const api = useApi()
const userStore = useUserStore()
const { requireLogin } = useAuthModal()

const surface = commentSurface(props.target)

const content = ref(props.seed)
const publishing = ref(false)
// <KunMarkdownEditor> is uncontrolled; bump the key to remount it after a
// successful post.
const editorKey = ref(0)

// Reset to the SEED, not to empty. On the resource area the seed is the
// publisher's @mention placeholder, which has to come back for the next comment
// too — clearing to empty would silently make only the FIRST comment notify
// them. A seedless composer resets to empty, as before.
const resetToSeed = () => {
  content.value = props.seed
  editorKey.value++
}

// The seed can arrive after mount: the resource page resolves its publisher from
// an awaited fetch, so an editor mounted before that would sit empty forever.
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
    // The create response carries user_id but NOT the resolved `user` (only the
    // list endpoint enriches it via the OAuth batch). The author is the current
    // user, so stamp it — else CommentRow throws on comment.user.name.
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
