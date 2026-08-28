<script setup lang="ts">
const props = defineProps<{
  item: CalendarItem
}>()

const api = useApi()
const settingStore = useSettingStore()
const { requireLogin } = useAuthModal()

// GalgameCard paints the age-rating triangle into this same corner once the
// reader turns that badge on, so the star steps below it rather than over it.
const showNsfwBadge = computed(() => settingStore.data.showNsfwBadge ?? false)

const favorited = ref(props.item.is_favorite)
const favPending = ref(false)
watch(
  () => props.item.is_favorite,
  (v) => (favorited.value = v)
)

const toggleFavorite = async () => {
  if (!requireLogin()) return
  if (favPending.value) return
  favPending.value = true
  const next = !favorited.value
  favorited.value = next
  const res = await api.put<{ favorited: boolean }>(
    `/patch/${props.item.id}/favorite`
  )
  favPending.value = false
  if (res.code === 0) {
    favorited.value = res.data.favorited
    useKunMessage(
      favorited.value ? '已收藏，有补丁时第一时间通知你' : '已取消收藏',
      'success'
    )
  } else {
    favorited.value = !next
    useKunMessage(res.message || '操作失败', 'error')
  }
}
</script>

<template>
  <div class="relative">
    <GalgameCard :patch="props.item" class="h-full" />
    <KunButton
      is-icon-only
      variant="flat"
      color="default"
      size="sm"
      rounded="full"
      :aria-label="favorited ? '取消收藏' : '收藏, 有补丁时通知你'"
      :class-name="
        cn(
          'bg-background/85 hover:bg-background absolute right-1.5 backdrop-blur',
          showNsfwBadge ? 'top-7' : 'top-1.5'
        )
      "
      @click="toggleFavorite"
    >
      <KunIcon
        name="lucide:star"
        :class="
          cn(
            'size-4',
            favorited ? 'text-warning fill-current' : 'text-default-500'
          )
        "
      />
    </KunButton>
  </div>
</template>
