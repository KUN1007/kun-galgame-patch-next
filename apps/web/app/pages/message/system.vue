<script setup lang="ts">
useKunSeoMeta({
  title: '系统消息',
  description: '查看系统消息'
})

const api = useApi()
const { data, pending } = await useAsyncData<Message[]>(
  'message-system',
  async () => {
    const res = await api.get<Message[]>('/message?type=system&page=1&limit=50')
    return res.code === 0 ? res.data : []
  },
  { default: () => [] }
)
</script>

<template>
  <div class="space-y-3">
    <KunHeader name="系统消息" description="站点广播和系统通知" />
    <KunLoading v-if="pending" description="加载中..." />
    <template v-else-if="data?.length">
      <MessageCard v-for="m in data" :key="m.id" :msg="m" />
    </template>
    <KunNull v-else description="暂无系统消息" />
  </div>
</template>
