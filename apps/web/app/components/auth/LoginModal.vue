<script setup lang="ts">
const { isOpen } = useAuthModal()
</script>

<template>
  <KunModal v-model="isOpen" inner-class-name="max-w-sm">
    <div class="flex flex-col items-center gap-6 py-4">
      <h2 class="text-2xl font-bold">登录或注册</h2>
      <AuthEntry />
    </div>
  </KunModal>
</template>
