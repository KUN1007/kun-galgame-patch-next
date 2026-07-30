<script setup lang="ts">
// One comment node — the SINGLE node component behind every comment area on the
// site (the patch comment tab and a resource's comment area). Everything
// area-specific comes from the target's descriptor in shared/utils/commentTarget.
//
// The structural model is two tiers:
//
//   depth 0 = root; depth 1 = reply (parent_id = the ROOT's id, never a reply)
//
// A root renders its own replies; replying to a reply pre-fills an @mention of
// that reply's author so the "回复 @某人" context survives without a deeper tree.
// It owns the network calls and emits the RESULT — the container holds the
// comments array and patches it by id (we never mutate the `comment` prop).
//
// LAYOUT NOTES. This is kungal's comment-row rhythm, adopted verbatim so every
// comment area across both sites reads the same. Three things carry it:
//   1. ONE action strip of uniform KunReaction pills, with every secondary
//      action behind ⋯. Previously moyu put edit/delete in a top-right ⋮ and
//      sat a like pill next to a taller 回复 button, so the row never read as a
//      single line.
//   2. An explicit meta → body → actions cadence (2 / 2.5) rather than a flat
//      space-y, so the body is the element with room around it.
//   3. Tier grouping is carried purely by SPACING CONTRAST — 4 inside a reply
//      group against 8 between roots (set by the container). kungal tried a rule
//      + indent here and dropped it: the spacing alone separates the tiers.
import {
  commentAnchorId,
  commentAbsoluteUrl,
  commentSurface,
  type CommentTarget
} from '~/shared/utils/commentTarget'

const props = withDefaults(
  defineProps<{
    comment: PatchPageComment
    target: CommentTarget
    depth?: number
    canModerate?: boolean
    // Root-only: whether this root's replies are fully expanded (owned by the
    // container so a deep-link jump can open the right thread).
    expanded?: boolean
  }>(),
  { depth: 0, canModerate: false, expanded: false }
)

const emit = defineEmits<{
  liked: [id: number, liked: boolean]
  replyAdded: [reply: PatchPageComment]
  edited: [updated: PatchPageComment]
  removed: [id: number]
  toggleExpand: [rootId: number]
}>()

const api = useApi()
const userStore = useUserStore()
const { requireLogin } = useAuthModal()
const { open: openReport } = useReportModal()

// A mounted area never changes kind, so resolve the descriptor once.
const surface = commentSurface(props.target)

const isAuthor = computed(() => userStore.user.id === props.comment.user_id)
// Edit is author-only; delete is author OR moderator (mirrors the backend
// DeleteComment privilege check — the patch owner is NOT privileged there).
const canEdit = computed(() => isAuthor.value)
const canDelete = computed(() => isAuthor.value || props.canModerate)
const isEdited = computed(() => !!props.comment.edit)

// ─── Replies (root only) ───────────────────────────────
const INLINE_LIMIT = 3
const replies = computed(() => props.comment.reply ?? [])
const visibleReplies = computed(() =>
  props.expanded ? replies.value : replies.value.slice(0, INLINE_LIMIT)
)
const canToggle = computed(() => replies.value.length > INLINE_LIMIT)

// ─── Like ──────────────────────────────────────────────
// KunReaction is an optimistic v-model toggle, so mirror the (parent-owned)
// comment into local refs it can drive, kept in sync if the parent patches it.
const liked = ref(props.comment.is_liked)
const likeCount = ref(props.comment.like_count)
watch(
  () => props.comment.is_liked,
  (v) => (liked.value = v)
)
watch(
  () => props.comment.like_count,
  (v) => (likeCount.value = v)
)

const revertLike = (active: boolean) => {
  liked.value = !active
  likeCount.value = Math.max(0, likeCount.value + (active ? -1 : 1))
}

const onLikeChange = async (active: boolean) => {
  if (!requireLogin()) {
    revertLike(active)
    return
  }
  const res = await api.put<{ liked: boolean }>(
    `/patch/comment/${props.comment.id}/like`
  )
  if (res.code === 0) {
    emit('liked', props.comment.id, res.data.liked)
  } else {
    revertLike(active)
    useKunMessage(res.message || '操作失败', 'error')
  }
}

// ─── Reply ─────────────────────────────────────────────
const replying = ref(false)
const replySeed = ref('')

const openReply = () => {
  if (!requireLogin()) return
  // Replying to a reply (depth 1): seed an @mention so the target is clear,
  // while still attaching to the root (one tier). Markdown renders
  // [@name](/user/id) as a kun-mention link.
  replySeed.value =
    props.depth === 1 && props.comment.user
      ? `[@${props.comment.user.name}](/user/${props.comment.user_id}) `
      : ''
  replying.value = true
}

// A reply always attaches to the ROOT: at depth 1 that is our own parent.
const rootId = computed(() =>
  props.depth === 1 ? (props.comment.parent_id ?? props.comment.id) : props.comment.id
)

const onReplySubmitted = (reply: PatchPageComment) => {
  replying.value = false
  emit('replyAdded', reply)
}

// ─── Edit ──────────────────────────────────────────────
const editing = ref(false)
const editContent = ref('')
const editKey = ref(0)
const savingEdit = ref(false)

const startEdit = () => {
  editContent.value = props.comment.content
  editKey.value++
  editing.value = true
}

const submitEdit = async () => {
  const text = editContent.value.trim()
  if (!text) {
    useKunMessage('评论内容不能为空', 'warn')
    return
  }
  if (text === props.comment.content) {
    editing.value = false
    return
  }
  savingEdit.value = true
  try {
    const res = await api.put<PatchPageComment>(
      `/patch/comment/${props.comment.id}`,
      { content: text }
    )
    if (res.code === 0 && res.data) {
      emit('edited', res.data)
      editing.value = false
      useKunMessage('评论已更新', 'success')
    } else {
      useKunMessage(res.message || '更新失败', 'error')
    }
  } finally {
    savingEdit.value = false
  }
}

// ─── Delete ────────────────────────────────────────────
const deleteOpen = ref(false)
const deleting = ref(false)
const deleteReason = ref('')
// A moderator deleting SOMEONE ELSE'S comment → offer a reason, recorded in the
// author's notification + the admin audit log. Author self-deletes need none.
const isForeignDelete = computed(() => !isAuthor.value)

const askDelete = () => {
  deleteReason.value = ''
  deleteOpen.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const res = await api.delete(
      `/patch/comment/${props.comment.id}`,
      isForeignDelete.value ? { reason: deleteReason.value.trim() } : undefined
    )
    if (res.code === 0) {
      emit('removed', props.comment.id)
      useKunMessage('已删除', 'success')
    } else {
      useKunMessage(res.message || '删除失败', 'error')
    }
  } finally {
    deleting.value = false
    deleteOpen.value = false
  }
}

// Report → global report modal (patch_comment). Snapshot the content as
// evidence; the deep-link resolves on whichever surface the comment lives on.
const reportComment = () => {
  if (!requireLogin()) return
  openReport({
    subjectKind: 'patch_comment',
    subjectId: props.comment.id,
    subjectUrl: commentAbsoluteUrl(surface, props.comment.id),
    snapshot: props.comment.content
  })
}

// ─── ⋯ menu ────────────────────────────────────────────
// Every secondary action lives here, so the visible row stays uniform pills.
// Hidden entirely when it would be empty.
const showMenu = computed(
  () => canEdit.value || canDelete.value || !isAuthor.value
)
</script>

<template>
  <!-- Anchor for deep-linking from messages / home / the global comment feed.
       scroll-mt keeps the target clear of the sticky header when scrolled to. -->
  <div :id="commentAnchorId(comment.id)" class="flex scroll-mt-24 gap-3">
    <KunAvatar :user="comment.user" :size="depth === 0 ? 'md' : 'sm'" />

    <div class="min-w-0 flex-1">
      <!-- Meta line. gap-x is wider than gap-y so a wrapped line still reads as
           one strip, and the name carries the only strong weight here. -->
      <div
        class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs leading-5"
      >
        <span class="text-default-800 text-sm font-medium">
          {{ comment.user.name }}
        </span>
        <span class="text-default-400">
          {{ formatDate(comment.created, { isPrecise: true, isShowYear: true }) }}
        </span>
        <span v-if="isEdited" class="text-default-400 italic">已编辑</span>
      </div>

      <!-- View vs edit -->
      <KunContent
        v-if="!editing"
        class="mt-2"
        compact
        :content="comment.content_html"
      />
      <div v-else class="mt-2 space-y-2">
        <KunMarkdownEditor
          :key="`edit-${editKey}`"
          :model-value="editContent"
          @update:model-value="(val) => (editContent = val)"
        />
        <div class="flex justify-end gap-2">
          <KunButton
            variant="light"
            color="default"
            size="sm"
            @click="editing = false"
          >
            取消
          </KunButton>
          <KunButton
            color="primary"
            size="sm"
            :loading="savingEdit"
            :disabled="savingEdit"
            @click="submitEdit"
          >
            保存
          </KunButton>
        </div>
      </div>

      <!-- Action row: ONE strip of uniform KunReaction pills. Everything here is
           the same component in the same skin (`:toggle="false"` = a one-shot
           action in the like pill's clothing), so the like button sits flush with
           its neighbours instead of next to a taller icon button. -->
      <div v-if="!editing" class="mt-2.5 flex items-center gap-1">
        <KunTooltip text="回复">
          <KunReaction
            :toggle="false"
            size="sm"
            icon="lucide:reply"
            label="回复"
            @click="openReply"
          />
        </KunTooltip>

        <KunTooltip text="点赞">
          <KunReaction
            v-model="liked"
            v-model:count="likeCount"
            size="sm"
            icon="lucide:thumbs-up"
            color="primary"
            label="点赞"
            @change="onLikeChange"
          />
        </KunTooltip>

        <KunPopover v-if="showMenu" position="bottom-start">
          <template #trigger>
            <KunReaction
              :toggle="false"
              size="sm"
              icon="lucide:ellipsis"
              label="更多"
            />
          </template>

          <div class="flex w-44 flex-col gap-2 p-2">
            <KunButton
              v-if="canEdit"
              variant="light"
              color="default"
              size="sm"
              class-name="w-full justify-start gap-2 whitespace-nowrap"
              @click="startEdit"
            >
              <KunIcon name="lucide:pencil" class="size-4" />
              编辑评论
            </KunButton>

            <KunButton
              v-if="!isAuthor"
              variant="light"
              color="danger"
              size="sm"
              class-name="w-full justify-start gap-2 whitespace-nowrap"
              @click="reportComment"
            >
              <KunIcon name="lucide:flag" class="size-4" />
              举报评论
            </KunButton>

            <KunButton
              v-if="canDelete"
              variant="light"
              color="danger"
              size="sm"
              class-name="w-full justify-start gap-2 whitespace-nowrap"
              @click="askDelete"
            >
              <KunIcon name="lucide:trash-2" class="size-4" />
              删除评论
            </KunButton>
          </div>
        </KunPopover>
      </div>

      <!-- Reply composer -->
      <KunFadeCard>
        <CommentComposer
          v-if="replying"
          class="mt-3"
          :target="target"
          :parent-id="rootId"
          :seed="replySeed"
          is-reply
          @close="replying = false"
          @submitted="onReplySubmitted"
        />
      </KunFadeCard>

      <!-- Reply tier (root only). Replies render flush — the smaller avatar plus
           the tighter spacing inside the group (4 here against 8 between roots)
           is what marks them, not a rule or an indent. -->
      <div v-if="depth === 0 && visibleReplies.length" class="mt-4 space-y-4">
        <CommentRow
          v-for="r in visibleReplies"
          :key="r.id"
          :comment="r"
          :target="target"
          :depth="1"
          :can-moderate="canModerate"
          @liked="(id, l) => emit('liked', id, l)"
          @reply-added="(rr) => emit('replyAdded', rr)"
          @edited="(u) => emit('edited', u)"
          @removed="(id) => emit('removed', id)"
        />
      </div>

      <KunButton
        v-if="depth === 0 && canToggle"
        variant="light"
        color="primary"
        size="sm"
        class-name="mt-3"
        @click="emit('toggleExpand', comment.id)"
      >
        <KunIcon
          :name="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
          class="size-4"
        />
        {{
          expanded ? '收起回复' : `展开更多 ${replies.length - INLINE_LIMIT} 条回复`
        }}
      </KunButton>
    </div>

    <!-- Delete confirm -->
    <KunModal v-model="deleteOpen" inner-class-name="max-w-md">
      <div class="space-y-4 py-2">
        <h3 class="text-lg font-bold">删除评论？</h3>
        <p class="text-default-600 text-sm">
          此操作不可恢复{{
            depth === 0 ? '，该评论下的所有回复也会一并删除' : ''
          }}。
        </p>
        <div v-if="isForeignDelete" class="space-y-1">
          <label class="text-default-600 text-sm">
            删除原因（可选，会通知作者并记入管理日志）
          </label>
          <KunInput
            v-model="deleteReason"
            placeholder="例如：垃圾广告 / 人身攻击 / 违规内容"
          />
        </div>
        <div class="flex justify-end gap-2">
          <KunButton
            variant="light"
            :disabled="deleting"
            @click="deleteOpen = false"
          >
            取消
          </KunButton>
          <KunButton
            color="danger"
            :loading="deleting"
            :disabled="deleting"
            @click="confirmDelete"
          >
            确认删除
          </KunButton>
        </div>
      </div>
    </KunModal>
  </div>
</template>
