<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'

useKunSeoMeta({
  title: '聊天',
  description: '聊天会话'
})

const route = useRoute()
const api = useApi()
const userStore = useUserStore()

const link = computed(() => String(route.params.link))

const { data: room } = await useAsyncData<ChatRoomDetail | null>(
  () => `chat-room-${link.value}`,
  async () => {
    const res = await api.get<ChatRoomDetail>(`/chat-room/${link.value}`)
    return res.code === 0 ? res.data : null
  }
)

const messages = ref<ChatMessageItem[]>([])
const input = ref('')
const sending = ref(false)
const loading = ref(false)
const scrollArea = ref<HTMLElement | null>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }
}

const fetchMessages = async (silent = false) => {
  if (!room.value) return
  if (!silent) loading.value = true
  try {
    const res = await api.get<{ messages: ChatMessageItem[] }>(
      `/chat-room/${link.value}/message?limit=50`
    )
    if (res.code === 0) {
      const next = res.data.messages ?? []
      const wasAtBottom = scrollArea.value
        ? scrollArea.value.scrollHeight - scrollArea.value.scrollTop - scrollArea.value.clientHeight < 80
        : true
      messages.value = next
      if (wasAtBottom) scrollToBottom()
    }
  } finally {
    if (!silent) loading.value = false
  }
}

const sendMessage = async () => {
  const content = input.value.trim()
  if (!content || sending.value || !room.value) return
  sending.value = true
  try {
    const res = await api.post<ChatMessageItem>(
      `/chat-room/${link.value}/message`,
      { content }
    )
    if (res.code === 0) {
      input.value = ''
      if (res.data) {
        messages.value = [...messages.value, res.data]
        await scrollToBottom()
      } else {
        await fetchMessages(true)
      }
    } else {
      useKunMessage(res.message || '发送失败', 'error')
    }
  } finally {
    sending.value = false
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(async () => {
  if (room.value) {
    await fetchMessages()
  }
})

const { pause, resume } = useIntervalFn(
  () => {
    if (room.value) fetchMessages(true)
  },
  5000,
  { immediate: false }
)

onMounted(() => {
  if (room.value) resume()
})

onBeforeUnmount(() => pause())
</script>

<template>
  <div class="flex h-[calc(100vh-12rem)] flex-col">
    <template v-if="room">
      <div
        class="border-default/20 flex items-center gap-3 border-b px-3 py-2"
      >
        <NuxtLink to="/message/chat" class="md:hidden">
          <KunIcon name="lucide:chevron-left" class="size-5" />
        </NuxtLink>
        <img
          v-if="room.avatar"
          :src="room.avatar"
          :alt="room.name"
          class="bg-default-100 size-10 rounded-full object-cover"
        />
        <div
          v-else
          class="bg-default-100 flex size-10 items-center justify-center rounded-full"
        >
          <KunIcon
            :name="room.type === 'PRIVATE' ? 'lucide:user' : 'lucide:users'"
            class="text-default-500 size-5"
          />
        </div>
        <div>
          <div class="font-semibold">{{ room.name }}</div>
          <div class="text-default-500 text-xs">
            {{
              room.type === 'PRIVATE'
                ? '私聊'
                : `群聊 · ${room.member?.length ?? 0} 人`
            }}
          </div>
        </div>
      </div>

      <div
        ref="scrollArea"
        class="flex-1 space-y-3 overflow-y-auto px-3 py-4"
      >
        <KunLoading v-if="loading" description="加载消息中..." />
        <template v-else-if="messages.length">
          <div
            v-for="m in messages"
            :key="m.id"
            :class="
              cn(
                'flex gap-2',
                m.senderId === userStore.user.uid ? 'justify-end' : ''
              )
            "
          >
            <KunAvatar
              v-if="m.senderId !== userStore.user.uid"
              :user="m.sender"
              size="sm"
            />
            <div
              :class="
                cn(
                  'max-w-[70%] space-y-1',
                  m.senderId === userStore.user.uid ? 'text-right' : ''
                )
              "
            >
              <div
                class="text-default-500 flex items-center gap-2 text-xs"
                :class="{
                  'justify-end': m.senderId === userStore.user.uid
                }"
              >
                <span class="font-medium">{{ m.sender.name }}</span>
                <span>{{ formatDistanceToNow(m.created) }}</span>
              </div>
              <div
                :class="
                  cn(
                    'inline-block rounded-lg px-3 py-2 whitespace-pre-wrap',
                    m.senderId === userStore.user.uid
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-default-100 text-foreground'
                  )
                "
              >
                {{ m.content }}
              </div>
            </div>
            <KunAvatar
              v-if="m.senderId === userStore.user.uid"
              :user="m.sender"
              size="sm"
              :is-navigation="false"
            />
          </div>
        </template>
        <KunNull v-else description="暂无消息, 发一条吧!" />
      </div>

      <div class="border-default/20 border-t p-3">
        <div class="flex items-end gap-2">
          <textarea
            v-model="input"
            :placeholder="
              userStore.user.uid ? 'Ctrl + 回车 发送' : '请先登录'
            "
            :disabled="!userStore.user.uid"
            rows="2"
            class="border-default/20 bg-background flex-1 rounded-lg border p-2 text-sm"
            @keydown="handleKeydown"
          />
          <KunButton
            color="primary"
            is-icon-only
            :loading="sending"
            :disabled="sending || !input.trim() || !userStore.user.uid"
            aria-label="发送"
            @click="sendMessage"
          >
            <KunIcon name="lucide:send-horizontal" class="size-5" />
          </KunButton>
        </div>
      </div>
    </template>
    <KunNull v-else description="聊天会话不存在" />
  </div>
</template>
