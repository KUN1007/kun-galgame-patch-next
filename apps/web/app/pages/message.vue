<script setup lang="ts">
const route = useRoute()

const navItems = [
  { key: 'notice', title: '通知消息', href: '/message/notice', icon: 'lucide:bell' },
  { key: 'follow', title: '关注消息', href: '/message/follow', icon: 'lucide:users' },
  { key: 'mention', title: '@ 消息', href: '/message/mention', icon: 'lucide:at-sign' },
  {
    key: 'patch-resource-create',
    title: '新补丁通知',
    href: '/message/patch-resource-create',
    icon: 'lucide:plus-circle'
  },
  {
    key: 'patch-resource-update',
    title: '补丁更新通知',
    href: '/message/patch-resource-update',
    icon: 'lucide:refresh-cw'
  },
  { key: 'system', title: '系统消息', href: '/message/system', icon: 'lucide:monitor-cog' },
  { key: 'chat', title: '私聊', href: '/message/chat', icon: 'lucide:mail' }
]

const currentKey = computed(() => {
  const seg = route.path.split('/').filter(Boolean)
  return seg[1] ?? ''
})
</script>

<template>
  <div class="container mx-auto my-4">
    <div class="grid gap-4 lg:grid-cols-4">
      <aside class="lg:col-span-1">
        <KunCard :bordered="true">
          <nav class="flex flex-col gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.key"
              :to="item.href"
              :class="
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  currentKey === item.key
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-default-700 hover:bg-default-100'
                )
              "
            >
              <KunIcon :name="item.icon" class="size-4" />
              {{ item.title }}
            </NuxtLink>
          </nav>
        </KunCard>
      </aside>

      <div class="lg:col-span-3">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>
