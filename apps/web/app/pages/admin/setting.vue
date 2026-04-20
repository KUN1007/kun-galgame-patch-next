<script setup lang="ts">
useKunSeoMeta({ title: '网站设置' })

const api = useApi()

interface SettingData {
  disableRegister: boolean
  enableCommentVerify: boolean
  enableOnlyCreatorCreate: boolean
}

const { data, pending, refresh } = await useAsyncData<SettingData>(
  'admin-setting',
  async () => {
    const res = await api.get<SettingData>('/admin/setting')
    return res.code === 0
      ? res.data
      : {
          disableRegister: false,
          enableCommentVerify: false,
          enableOnlyCreatorCreate: false
        }
  },
  {
    default: () => ({
      disableRegister: false,
      enableCommentVerify: false,
      enableOnlyCreatorCreate: false
    })
  }
)

const updating = reactive<Record<string, boolean>>({})

const toggle = async (key: keyof SettingData) => {
  updating[key] = true
  try {
    const res = await api.put('/admin/setting', {
      key,
      value: !(data.value as any)[key]
    })
    if (res.code === 0) {
      useKunMessage('已更新', 'success')
      await refresh()
    } else {
      useKunMessage(res.message || '更新失败', 'error')
    }
  } finally {
    updating[key] = false
  }
}

const settings = [
  {
    key: 'disableRegister' as const,
    name: '禁止注册',
    description: '开启后新用户将无法通过普通注册流程加入本站'
  },
  {
    key: 'enableCommentVerify' as const,
    name: '评论需要审核',
    description: '开启后新评论需要管理员审核通过才能显示'
  },
  {
    key: 'enableOnlyCreatorCreate' as const,
    name: '仅创作者可以发布 Galgame',
    description: '开启后非创作者无法发布新的 Galgame 条目'
  }
]
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">网站设置</h1>

    <KunLoading v-if="pending" description="加载中..." />
    <div v-else class="space-y-4">
      <KunCard
        v-for="s in settings"
        :key="s.key"
        :bordered="true"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <h3 class="text-lg font-medium">{{ s.name }}</h3>
            <p class="text-default-500 text-sm">{{ s.description }}</p>
          </div>
          <KunSwitch
            :model-value="!!data?.[s.key]"
            :disabled="updating[s.key]"
            @update:model-value="toggle(s.key)"
          />
        </div>
      </KunCard>
    </div>
  </div>
</template>
