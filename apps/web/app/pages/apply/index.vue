<script setup lang="ts">
useKunSeoMeta({
  title: '申请成为创作者',
  description: '申请成为创作者以获得使用本站存储的权限'
})

const api = useApi()
const userStore = useUserStore()

if (userStore.user.role > 1) {
  await navigateTo('/apply/success', { redirectCode: 302 })
}

const { data } = await useAsyncData<{ resource_count: number; role: number }>(
  'apply-status',
  async () => {
    const res = await api.get<{ resource_count: number; role: number }>(
      '/apply/status'
    )
    return res.code === 0 ? res.data : { resource_count: 0, role: 1 }
  },
  { default: () => ({ resource_count: 0, role: 1 }) }
)

const count = computed(() => data.value?.resource_count ?? 0)
const progress = computed(() => Math.min((count.value / 3) * 100, 100))
const canApply = computed(() => count.value >= 3)

const applying = ref(false)
const handleApply = async () => {
  applying.value = true
  try {
    const res = await api.post('/apply')
    if (res.code === 0) {
      useKunMessage('恭喜您, 您的申请已成功提交', 'success')
      await navigateTo('/apply/pending')
    } else {
      useKunMessage(res.message || '申请失败', 'error')
    }
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <div class="mx-auto my-4 w-full px-4">
    <KunHeader
      name="申请成为创作者"
      description="申请成为创作者以获得使用本站存储的权限"
    />

    <KunCard class-name="mx-auto mt-8 max-w-xl" :bordered="true">
      <template #header>
        <h2 class="flex items-center gap-2 px-1 pt-1 text-xl font-bold">
          <KunIcon name="lucide:trophy" class="text-warning size-5" />
          创作者申请进度
        </h2>
      </template>

      <div class="flex items-center justify-between">
        <p class="text-default-500">发布补丁进度: {{ count }}/3</p>
        <KunBadge :color="canApply ? 'success' : 'warning'" variant="flat">
          <KunIcon
            :name="canApply ? 'lucide:check-circle-2' : 'lucide:circle-slash'"
            class="size-4"
          />
          {{ canApply ? '已达到申请条件' : '请继续努力哦' }}
        </KunBadge>
      </div>

      <div class="bg-default-100 h-2 w-full overflow-hidden rounded">
        <div
          class="bg-gradient-to-r from-danger-500 to-warning-500 h-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <KunDivider color="default" />

      <div class="space-y-4">
        <div>
          <h3 class="mb-2 text-lg font-semibold">申请条件</h3>
          <p class="text-default-500">在本站合法发布三个补丁</p>
          <p class="text-default-500">
            详细信息请查看文档
            <NuxtLink
              to="/about/notice/creator"
              class="text-primary hover:underline"
            >
              关于鲲 Galgame 补丁创作者
            </NuxtLink>
          </p>
        </div>

        <div>
          <h3 class="mb-2 text-lg font-semibold">当前状态</h3>
          <p class="text-default-500">
            {{
              canApply
                ? '恭喜！您已经达到申请条件, 可以立即申请成为创作者'
                : `您还需要发布 ${3 - count} 个补丁才能申请成为创作者`
            }}
          </p>
        </div>
      </div>

      <KunButton
        color="primary"
        size="lg"
        full-width
        :loading="applying"
        :disabled="!canApply || applying"
        @click="handleApply"
      >
        <KunIcon name="lucide:badge-check" class="size-5" />
        {{ applying ? '申请处理中...' : '申请成为创作者' }}
      </KunButton>
    </KunCard>
  </div>
</template>
