<script setup lang="ts">
const userStore = useUserStore()
const { open } = useAuthModal()

onMounted(() => {
  if (!userStore.isLoggedIn) {
    open()
  }
})
watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn) {
      open()
    }
  }
)
</script>

<template>
  <template v-if="userStore.isLoggedIn">
    <slot />
  </template>
</template>
