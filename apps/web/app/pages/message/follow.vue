<script setup lang="ts">
useKunSeoMeta({
  title: '关注消息',
  description: '查看关注相关的消息'
})

const api = useApi()
const { data, pending } = await useAsyncData<Message[]>(
  'message-follow',
  async () => {
    const res = await api.get<Message[]>('/message?type=follow&page=1&limit=50')
    return res.code === 0 ? res.data : []
  },
  { default: () => [] }
)
</script>

<template>
  <div class="space-y-3">
    <KunHeader name="关注消息" description="关注了您的用户" />
    <KunLoading v-if="pending" description="加载中..." />
    <template v-else-if="data?.length">
      <MessageCard v-for="m in data" :key="m.id" :msg="m" />
    </template>
    <KunNull v-else description="暂无关注消息" />
  </div>
</template>
