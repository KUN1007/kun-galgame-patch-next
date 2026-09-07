<script setup lang="ts">
defineOptions({ name: 'user-folder' })

const route = useRoute()
const api = useApi()
const userStore = useUserStore()
const userId = computed(() => Number(route.params.id))
const isOwner = computed(() => userStore.user.id === userId.value)

const { data, pending, refresh } = await useAsyncData<{ folders: Folder[] }>(
  () => `user-${userId.value}-folders`,
  async () => {
    const res = await api.get<{ folders: Folder[] }>(
      `/user/${userId.value}/folder`
    )
    return res.code === 0 ? res.data : { folders: [] }
  },
  { default: () => ({ folders: [] }) }
)

// The default folder carries an empty name on purpose — every client derives
// the label, so a name invented at import time would freeze one language into
// everybody's view of somebody else's shelf.
const labelOf = (folder: Folder) =>
  folder.name.trim() || (folder.is_default ? '默认收藏夹' : '未命名收藏夹')

const creating = ref(false)
const newName = ref('')

const createFolder = async () => {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  const res = await api.post<Folder>('/folder', {
    name,
    description: '',
    visibility: 'public'
  })
  creating.value = false
  if (res.code !== 0) {
    useKunMessage(res.message || '创建收藏夹失败', 'error')
    return
  }
  newName.value = ''
  await refresh()
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="isOwner" class="flex items-center gap-2">
      <KunInput
        v-model="newName"
        placeholder="新建收藏夹..."
        class="max-w-xs flex-1"
        @keyup.enter="createFolder"
      />
      <KunButton
        color="primary"
        :loading="creating"
        :disabled="!newName.trim()"
        @click="createFolder"
      >
        新建
      </KunButton>
    </div>

    <KunLoading v-if="pending" description="加载中..." />

    <div
      v-else-if="data?.folders?.length"
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <KunLink
        v-for="folder in data.folders"
        :key="folder.id"
        :to="`/folder/${folder.id}`"
        class="border-default-200 hover:bg-default-100 block rounded-xl border p-4 transition-colors"
      >
        <div class="flex items-start gap-3">
          <KunIcon
            :name="folder.visibility === 'private' ? 'lucide:lock' : 'lucide:folder'"
            class="text-default-400 mt-0.5 size-5 shrink-0"
          />
          <div class="min-w-0 flex-1">
            <p class="text-foreground truncate font-medium">
              {{ labelOf(folder) }}
            </p>
            <p
              v-if="folder.description"
              class="text-default-500 mt-1 line-clamp-2 text-xs"
            >
              {{ folder.description }}
            </p>
            <p class="text-default-400 mt-1 text-xs">
              {{ folder.item_count }} 个游戏
            </p>
          </div>
        </div>
      </KunLink>
    </div>

    <KunNull
      v-else
      :description="isOwner ? '你还没有收藏夹' : '该用户没有公开的收藏夹'"
    />
  </div>
</template>
