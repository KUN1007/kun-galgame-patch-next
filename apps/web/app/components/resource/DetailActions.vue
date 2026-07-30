<script setup lang="ts">
// Kebab (⋮) actions for the resource DETAIL page: 编辑 / 分享 / 删除.
//
// The game detail page already has this affordance for the galgame it owns
// (PatchHeaderActions); this is the resource-scoped counterpart. It matters
// because /resource/:id is a real entry point — search hits and shared links
// land here directly — and until now managing that resource meant detouring
// through /patch/:id/resource to find the same row in the list.
//
// The actions are deliberately the same ones the resource LIST rows expose, and
// they reuse the list's contracts verbatim so the two surfaces cannot drift:
//   - 编辑:     ResourcePublish in edit mode (PUT /patch/resource/:id), which
//               returns the server-rendered row — handed straight back up.
//   - 禁用下载: PUT /patch/resource/:id/disable, a toggle.
//   - 分享:     copy `<游戏名><资源名>资源下载: <url>`, the list's exact text.
//   - 举报:     the global report modal, subject kind `patch_resource`.
//   - 删除:     DELETE /patch/resource/:id, with the moderator reason field.
// 更改历史 is the one list item not mirrored here yet.
//
// Gating is owner-or-moderator, and it is a NOISE gate only: the server's
// UpdateResource / DeleteResource / disable handlers enforce the same predicate,
// so hiding an item just avoids showing an affordance that would come back 400.
// 举报 inverts that — it is offered to everyone EXCEPT the author, who has the
// management actions instead (same rule as the list rows and the comment items).
//
// 分享 is unconditional (logged-out included) — copying a URL needs no rights
// — so the kebab always carries at least one item and never opens empty.

import { kunMoyuMoe } from '~/config/moyu-moe'

interface Props {
  resource: PatchResource
  // Owning game's display name, used only to compose the share text. Optional
  // because the owning patch can be absent (an orphaned resource still renders).
  galgameName?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  // The server-canonical updated row (note_html / update_time re-resolved
  // server-side), so the page can swap it in without a refetch.
  edited: [resource: PatchResource]
  // Re-fetch the detail. Used after the disable toggle rather than patching
  // `status` in place: the server WITHHOLDS content / code / password for a
  // disabled resource, so the payload already in memory no longer matches what
  // this resource is. Flipping only the flag would show the "已禁用" banner with
  // the download links still listed underneath it.
  refresh: []
}>()

const api = useApi()
const userStore = useUserStore()
const { requireLogin } = useAuthModal()
const { open: openReport } = useReportModal()

// Owner or moderator. A missing user_id falls through to moderator-only rather
// than granting access — the detail face does send it, and guessing the other
// way would hand the owner's menu to everyone if it ever stopped.
const canManage = computed(
  () =>
    userStore.isModerator ||
    (!!props.resource.user_id && props.resource.user_id === userStore.user.id)
)

// ─── 分享 ─────────────────────────────────────────────
const handleShare = () => {
  const name = props.resource.name || '补丁资源'
  const url = `${location.origin}/resource/${props.resource.id}`
  // navigator.clipboard rather than useKunCopy: the latter echoes the whole
  // long link back into the toast. Same choice, and same text, as the list's 分享.
  navigator.clipboard
    .writeText(`${props.galgameName ?? ''}${name}资源下载: ${url}`)
    .then(() => useKunMessage('链接复制成功', 'success'))
    .catch(() => useKunMessage('复制失败，请手动复制', 'error'))
}

// ─── 编辑 ─────────────────────────────────────────────
const editOpen = ref(false)

// ─── 禁用下载 ─────────────────────────────────────────
// status != 0 → download disabled (e.g. the file was pulled for a virus report).
// The row stays visible; only its payload is withheld.
const isDisabled = computed(() => (props.resource.status ?? 0) !== 0)

const toggling = ref(false)
const toggleDisable = async () => {
  toggling.value = true
  try {
    const res = await api.put<{ status: number }>(
      `/patch/resource/${props.resource.id}/disable`
    )
    if (res.code === 0) {
      useKunMessage(
        res.data.status !== 0 ? '已禁用该资源下载' : '已恢复该资源下载',
        'success'
      )
      emit('refresh')
    } else {
      useKunMessage(res.message || '操作失败', 'error')
    }
  } finally {
    toggling.value = false
  }
}

// ─── 举报 ─────────────────────────────────────────────
// Deep-link + snapshot the resource name so the moderator console opens it in
// context. Same payload the list rows send.
const reportResource = () => {
  if (!requireLogin()) return
  openReport({
    subjectKind: 'patch_resource',
    subjectId: props.resource.id,
    subjectUrl: `${kunMoyuMoe.domain.main}/resource/${props.resource.id}`,
    snapshot: props.resource.name
  })
}

// ─── 删除 ─────────────────────────────────────────────
const deleteOpen = ref(false)
const deleting = ref(false)
const deleteReason = ref('')

// A moderator deleting SOMEONE ELSE'S resource → offer a reason, which the
// backend puts in the author's notification and the admin audit log. Owner
// self-deletes need none.
const isForeignDelete = computed(
  () => props.resource.user_id !== userStore.user.id
)

const askDelete = () => {
  deleteReason.value = ''
  deleteOpen.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const res = await api.delete(
      `/patch/resource/${props.resource.id}`,
      isForeignDelete.value ? { reason: deleteReason.value.trim() } : undefined
    )
    if (res.code === 0) {
      useKunMessage('已删除资源', 'success')
      deleteOpen.value = false
      // This page IS the row that just went away — staying would re-render as
      // 资源不存在. Leave for the owning game's resource list, where the rest of
      // its patches are.
      await navigateTo(`/patch/${props.resource.galgame_id}/resource`)
    } else {
      useKunMessage(res.message || '删除失败', 'error')
    }
  } finally {
    deleting.value = false
  }
}

// ─── The menu ─────────────────────────────────────────
// Local item shape rather than KunDropdownItem, mirroring the resource list
// page — it keeps its own copy to avoid a cross-layer type import path.
interface ResourceActionItem {
  key: 'edit' | 'disable' | 'share' | 'report' | 'delete'
  label: string
  icon: string
  color?: 'default' | 'success' | 'warning' | 'danger'
  disabled?: boolean
}

const menuItems = computed<ResourceActionItem[]>(() => {
  const items: ResourceActionItem[] = []
  if (canManage.value) {
    items.push({ key: 'edit', label: '编辑资源', icon: 'lucide:pencil' })
    items.push({
      key: 'disable',
      label: isDisabled.value ? '恢复下载' : '禁用下载',
      icon: isDisabled.value ? 'lucide:download' : 'lucide:ban',
      color: isDisabled.value ? 'success' : 'warning',
      disabled: toggling.value
    })
  }
  items.push({ key: 'share', label: '复制分享链接', icon: 'lucide:share-2' })
  // Everyone but the author — reporting your own resource is meaningless, and
  // the author already has the management items above.
  if (props.resource.user_id !== userStore.user.id) {
    items.push({
      key: 'report',
      label: '举报资源',
      icon: 'lucide:flag',
      color: 'danger'
    })
  }
  if (canManage.value) {
    items.push({
      key: 'delete',
      label: '删除资源',
      icon: 'lucide:trash-2',
      color: 'danger'
    })
  }
  return items
})

const onMenuSelect = (item: { key: string }) => {
  switch (item.key) {
    case 'edit':
      editOpen.value = true
      break
    case 'disable':
      toggleDisable()
      break
    case 'share':
      handleShare()
      break
    case 'report':
      reportResource()
      break
    case 'delete':
      askDelete()
      break
  }
}
</script>

<template>
  <div class="shrink-0">
    <KunDropdown :items="menuItems" position="bottom-end" @select="onMenuSelect">
      <template #trigger>
        <KunButton
          is-icon-only
          variant="light"
          color="default"
          size="sm"
          rounded="full"
          aria-label="更多操作"
        >
          <KunIcon name="lucide:ellipsis-vertical" class="size-4" />
        </KunButton>
      </template>
    </KunDropdown>

    <!-- isDismissable=false: the form holds an uploaded file and many fields;
         a click-outside would silently throw all of it away. -->
    <KunModal
      v-model="editOpen"
      inner-class-name="max-w-3xl"
      :is-dismissable="false"
    >
      <ResourcePublish
        v-if="editOpen"
        :patch-id="props.resource.galgame_id"
        :resource="props.resource"
        @close="editOpen = false"
        @success="(updated) => emit('edited', updated)"
      />
    </KunModal>

    <!-- isDismissable=false: destructive and irreversible — a backdrop click
         must not be able to stand in for 确认删除. -->
    <KunModal
      v-model="deleteOpen"
      inner-class-name="max-w-md"
      :is-dismissable="false"
    >
      <div class="space-y-4 py-2">
        <h3 class="text-lg font-bold">删除补丁资源？</h3>
        <p class="text-default-600 text-sm">
          此操作不可撤销。资源记录会从数据库移除，对应的下载文件也会一并删除。
        </p>
        <p v-if="props.resource.name" class="text-default-500 text-sm">
          <span class="text-default-400">资源名称：</span>
          <strong class="text-foreground">{{ props.resource.name }}</strong>
        </p>
        <div v-if="isForeignDelete" class="space-y-1">
          <label class="text-default-600 text-sm">
            删除原因（可选，会通知作者并记入管理日志）
          </label>
          <KunInput
            v-model="deleteReason"
            placeholder="例如：转载自付费站 / 违规内容 / 重复发布"
          />
        </div>
        <div class="flex justify-end gap-2">
          <KunButton
            variant="light"
            color="default"
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
            <KunIcon v-if="!deleting" name="lucide:trash-2" class="size-4" />
            确认删除
          </KunButton>
        </div>
      </div>
    </KunModal>
  </div>
</template>
