<script setup lang="ts">
useKunSeoMeta({
  title: '通知消息',
  description: '查看您的通知消息'
})

const api = useApi()
const { data, pending } = await useAsyncData<Message[]>(
  'message-notice',
  async () => {
    const res = await api.get<Message[]>('/message?type=all&page=1&limit=50')
    return res.code === 0 ? res.data : []
  },
  { default: () => [] }
)
</script>

<template>
  <div class="space-y-3">
    <KunHeader name="通知消息" description="全部通知消息" />
    <KunLoading v-if="pending" description="加载中..." />
    <template v-else-if="data?.length">
      <MessageCard v-for="m in data" :key="m.id" :msg="m" />
    </template>
    <KunNull v-else description="暂无消息" />
  </div>
</template>
