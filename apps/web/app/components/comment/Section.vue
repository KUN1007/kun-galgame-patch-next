<script setup lang="ts">
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

const composerSeed = computed(() => {
  const u = props.mentionUser
  if (!u?.id || u.id === userStore.user.id) return ''
  return `[@${u.name}](/user/${u.id}) `
})
</script>

<template>
  <div class="space-y-6">
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
