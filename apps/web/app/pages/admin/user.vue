<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { USER_ROLE_MAP, USER_STATUS_MAP, USER_STATUS_COLOR_MAP } from '~/constants/user'

useKunSeoMeta({ title: '用户管理' })

const api = useApi()

const page = ref(1)
const searchQuery = ref('')
const limit = 30

interface ListResponse {
  users: AdminUser[]
  total: number
}

const { data, pending, refresh } = await useAsyncData<ListResponse>(
  'admin-users',
  async () => {
    const res = await api.get<ListResponse>(
      `/admin/user?page=${page.value}&limit=${limit}&search=${encodeURIComponent(searchQuery.value)}`
    )
    return res.code === 0 ? res.data : { users: [], total: 0 }
  },
  { default: () => ({ users: [], total: 0 }) }
)

const debouncedRefresh = useDebounceFn(() => {
  page.value = 1
  refresh()
}, 400)

watch(searchQuery, () => debouncedRefresh())
watch(page, () => refresh())

const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / limit))
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">用户管理</h1>
      <KunBadge color="primary" variant="flat">
        杂鱼! 不许视奸!
      </KunBadge>
    </div>

    <KunInput
      v-model="searchQuery"
      placeholder="使用用户名搜索用户"
    >
      <template #prefix>
        <KunIcon name="lucide:search" class="text-default-400 size-4" />
      </template>
    </KunInput>

    <KunLoading v-if="pending" description="正在获取用户数据..." />
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-default/20 border-b">
          <tr>
            <th class="px-3 py-2 text-left">用户</th>
            <th class="px-3 py-2 text-left">角色</th>
            <th class="px-3 py-2 text-left">状态</th>
            <th class="px-3 py-2 text-left">发布量</th>
            <th class="px-3 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in data?.users"
            :key="u.id"
            class="border-default/20 hover:bg-default-50 border-b"
          >
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <KunAvatar :user="u" size="sm" />
                <div>
                  <div class="font-medium">{{ u.name }}</div>
                  <div class="text-default-500 text-xs">ID {{ u.id }}</div>
                </div>
              </div>
            </td>
            <td class="px-3 py-2">
              <KunBadge size="sm" variant="flat">
                {{ USER_ROLE_MAP[u.role] ?? '用户' }}
              </KunBadge>
            </td>
            <td class="px-3 py-2">
              <KunBadge
                size="sm"
                variant="flat"
                :color="USER_STATUS_COLOR_MAP[u.status]"
              >
                {{ USER_STATUS_MAP[u.status] ?? '正常' }}
              </KunBadge>
            </td>
            <td class="text-default-500 px-3 py-2 text-xs">
              补丁 {{ u._count.patch }} / 资源 {{ u._count.patch_resource }}
            </td>
            <td class="px-3 py-2">
              <NuxtLink
                :to="`/user/${u.id}/resource`"
                class="text-primary hover:underline"
              >
                查看
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <KunNull
      v-if="!pending && !data?.users?.length"
      description="暂无用户数据"
    />

    <div v-if="totalPages > 1" class="flex justify-center">
      <KunPagination
        :current-page="page"
        :total-page="totalPages"
        :is-loading="pending"
        @update:current-page="(v) => (page = v)"
      />
    </div>
  </div>
</template>
