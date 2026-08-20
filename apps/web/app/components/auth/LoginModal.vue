<script setup lang="ts">
const { isOpen } = useAuthModal()
</script>

<template>
  <KunModal
    v-model="isOpen"
    inner-class-name="max-w-sm"
    aria-label="登录或注册"
  >
    <div class="flex flex-col items-center gap-6 py-4">
      <h2 class="text-2xl font-bold">登录或注册</h2>
      <AuthEntry />
      <!-- components/auth/Ecosystem.vue and the whole backend chain behind it
           (/auth/oauth/ecosystem, AuthService.ListEcosystem, auto_consent) are
           PARKED, not dead: 1b9c4a4c hid the strip until the OAuth app directory
           is ready, and 7532e219 then swept away the note saying so. A dead-code
           audit found the component with zero references and nearly deleted it.
           Re-enable by rendering <AuthEcosystem /> here. -->
    </div>
  </KunModal>
</template>
