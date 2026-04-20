<script setup lang="ts">
useKunSeoMeta({
  title: '私聊',
  description: '您的私聊会话'
})

const route = useRoute()
</script>

<template>
  <div class="space-y-3">
    <KunHeader name="私聊" :description="`会话 ID: ${route.params.link}`" />
    <KunNull
      description="私聊功能正在接入 WebSocket, 暂未开放. 敬请期待."
    />
  </div>
</template>
