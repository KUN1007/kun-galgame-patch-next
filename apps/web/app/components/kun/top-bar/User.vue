<script setup lang="ts">
import type { UserState } from '~/stores/userStore'

const userStore = useUserStore()
const api = useApi()

const unreadMessageTypes = ref<string[]>([])
const mounted = ref(false)

const fetchUserStatus = async () => {
  const res = await api.get<UserState>('/auth/me')
  if (res.code === 0) {
    // setUser merges into the existing state and preserves muted_message_types.
    userStore.setUser(res.data)
  } else {
    userStore.logout()
  }
}

const fetchUnread = async () => {
  const res = await api.get<string[]>('/message/unread')
  if (res.code === 0) {
    unreadMessageTypes.value = res.data ?? []
  }
}

onMounted(async () => {
  mounted.value = true
  if (userStore.user.uid) {
    await Promise.all([fetchUserStatus(), fetchUnread()])
  }
})
</script>

<template>
  <div class="ml-auto flex items-center gap-2">
    <template v-if="mounted">
      <template v-if="!userStore.user.name">
        <KunButton size="sm" color="primary" variant="flat" href="/login">
          登录
        </KunButton>
        <KunButton
          size="sm"
          color="primary"
          href="/register"
          class-name="hidden lg:inline-flex"
        >
          注册
        </KunButton>
      </template>

      <KunTopBarNSFWSwitcher />

      <KunTopBarSearch />

      <div class="hidden sm:flex">
        <KunTopBarRandomGalgameButton
          is-icon-only
          variant="light"
          size="sm"
        />
      </div>

      <div class="hidden sm:flex">
        <KunTopBarThemeSwitcher />
      </div>

      <template v-if="userStore.user.name">
        <KunTopBarUserMessageBell
          :unread-message-types="unreadMessageTypes"
          @read-messages="unreadMessageTypes = []"
        />
        <KunTopBarUserDropdown />
      </template>
    </template>

    <template v-else>
      <div class="bg-default-100 h-10 w-32 animate-pulse rounded-lg" />
    </template>
  </div>
</template>
