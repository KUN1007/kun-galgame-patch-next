<script setup lang="ts">
interface Props {
  unreadMessageTypes: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ readMessages: [] }>()

const userStore = useUserStore()

const hasUnread = computed(() =>
  props.unreadMessageTypes.some(
    (type) => !userStore.user.mutedMessageTypes?.includes(type)
  )
)

const handleClick = () => {
  if (hasUnread.value) emit('readMessages')
}
</script>

<template>
  <KunTooltip
    :text="hasUnread ? '您有新消息!' : '我的消息'"
    position="bottom"
  >
    <KunButton
      is-icon-only
      variant="light"
      color="default"
      aria-label="我的消息"
      href="/message/chat"
      class-name="relative"
      @click="handleClick"
    >
      <KunIcon
        :name="hasUnread ? 'lucide:bell-ring' : 'lucide:bell'"
        :class="hasUnread ? 'text-primary size-6' : 'text-default-500 size-6'"
      />
      <span
        v-if="hasUnread"
        class="bg-danger absolute right-1 bottom-1 size-2 rounded-full"
      />
    </KunButton>
  </KunTooltip>
</template>
