<script setup lang="ts">
// A whole comment area: composer on top, one flat list of root comments (each
// carrying its reply tier), paginator at the bottom. Used unchanged by every
// comment surface on the site — the patch comment tab and a resource's comment
// area — which is what keeps them looking identical.
//
// Presentational: the fetch, the optimistic handlers and the deep-link jump all
// live in useCommentList, which the PAGE calls (the resource page needs the count
// before it can label its tab). See that file.
import type { CommentTarget } from '~/shared/utils/commentTarget'
import { commentSurface } from '~/shared/utils/commentTarget'

const props = withDefaults(
  defineProps<{
    target: CommentTarget
    items: PatchPageComment[]
    totalPages: number
    expandedRoots: Set<number>
    pending?: boolean
    canModerate?: boolean
    // Pre-@mentioned in the root composer as a placeholder. The resource area
    // passes the resource's publisher so a comment reaches them by default —
    // nothing else notifies them, and @mentions are the one channel that does
    // (CreateMentionMessages on the server reads the ids out of the body).
    mentionUser?: KunUser | null
  }>(),
  { pending: false, canModerate: false, mentionUser: null }
)

const emit = defineEmits<{
  commentAdded: [comment: PatchPageComment]
  liked: [id: number, liked: boolean]
  replyAdded: [reply: PatchPageComment]
  edited: [updated: PatchPageComment]
  removed: [id: number]
  toggleExpand: [rootId: number]
}>()

const page = defineModel<number>('page', { required: true })

const userStore = useUserStore()
const surface = commentSurface(props.target)

// The composer's starting body. Markdown [@name](/user/id) is what the renderer
// turns into a kun-mention link AND what the server's mention extractor reads,
// so the placeholder is a real mention, not decorative text.
//
// Skipped when the viewer IS that user: nobody needs to @ themselves (the server
// drops a self-mention anyway, so it would only be noise in the editor).
const composerSeed = computed(() => {
  const u = props.mentionUser
  if (!u?.id || u.id === userStore.user.id) return ''
  return `[@${u.name}](/user/${u.id}) `
})
</script>

<template>
  <div class="space-y-6">
    <!-- Standing notice (resource area only). Solid palette colours, no
         gradient. Shown to everyone including logged-out readers — the point is
         that someone hitting a broken link knows where to say so BEFORE they
         decide whether it's worth logging in. -->
    <div
      v-if="surface.notice"
      class="border-primary/30 bg-primary/10 flex gap-3 rounded-2xl border p-4"
    >
      <KunIcon
        name="lucide:megaphone"
        class="text-primary mt-0.5 size-5 shrink-0"
      />
      <div class="min-w-0 space-y-1">
        <p class="text-primary text-sm font-semibold">
          {{ surface.notice.title }}
        </p>
        <p class="text-default-600 text-sm leading-relaxed">
          {{ surface.notice.body }}
        </p>
      </div>
    </div>

    <!-- Composer. Logged out → the login prompt in its place; the editor itself
         is pointless without an identity to post as. -->
    <div
      v-if="userStore.user.id"
      class="border-default/20 bg-content1 shadow-kun-sm flex gap-3 rounded-2xl border p-4"
    >
      <KunAvatar :user="userStore.user" size="md" :is-navigation="false" />
      <div class="min-w-0 flex-1">
        <CommentComposer
          :target="target"
          :seed="composerSeed"
          @submitted="(c) => emit('commentAdded', c)"
        />
      </div>
    </div>
    <div
      v-else
      class="border-default/20 bg-default-50 rounded-2xl border p-5 text-center text-sm"
    >
      请
      <button
        type="button"
        class="text-primary font-medium hover:underline"
        @click="() => startOAuthLogin()"
      >
        登录
      </button>
      后发表评论
    </div>

    <KunLoading v-if="pending" description="加载评论中..." />

    <!-- space-y-8 between roots against space-y-4 inside a reply group: that
         contrast is what separates the two tiers (see CommentRow). -->
    <div v-else-if="items.length" class="space-y-8">
      <CommentRow
        v-for="c in items"
        :key="c.id"
        :comment="c"
        :target="target"
        :depth="0"
        :can-moderate="canModerate"
        :expanded="expandedRoots.has(c.id)"
        @liked="(id, l) => emit('liked', id, l)"
        @reply-added="(r) => emit('replyAdded', r)"
        @edited="(u) => emit('edited', u)"
        @removed="(id) => emit('removed', id)"
        @toggle-expand="(id) => emit('toggleExpand', id)"
      />
    </div>

    <KunNull v-else :description="surface.emptyDescription" />

    <KunPagination
      v-if="totalPages > 1"
      v-model:current-page="page"
      :total-page="totalPages"
      :is-loading="pending"
    />
  </div>
</template>
