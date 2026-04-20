<script setup lang="ts">
useKunSeoMeta({
  title: '新补丁通知',
  description: '订阅的补丁新资源通知'
})

const api = useApi()
const { data, pending } = await useAsyncData<Message[]>(
  'message-patch-create',
  async () => {
    const res = await api.get<Message[]>(
      '/message?type=patchResourceCreate&page=1&limit=50'
    )
    return res.code === 0 ? res.data : []
  },
  { default: () => [] }
)
</script>

<template>
  <div class="space-y-3">
    <KunHeader name="新补丁通知" description="您关注的作者发布了新补丁" />
    <KunLoading v-if="pending" description="加载中..." />
    <template v-else-if="data?.length">
      <MessageCard v-for="m in data" :key="m.id" :msg="m" />
    </template>
    <KunNull v-else description="暂无新补丁通知" />
  </div>
</template>
