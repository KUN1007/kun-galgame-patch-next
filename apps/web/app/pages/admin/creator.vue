<script setup lang="ts">
import {
  APPLICANT_STATUS_MAP,
  APPLICANT_STATUS_COLOR_MAP
} from '~/constants/admin'

useKunSeoMeta({ title: '创作者管理' })

const api = useApi()
const page = ref(1)
const limit = 30

// /admin/creator returns the standard paginated envelope { items, total };
// see apps/api/pkg/response/response.go.
interface ListResponse {
  items: AdminCreator[]
  total: number
}

const { data, pending, refresh } = await useAsyncData<ListResponse>(
  'admin-creators',
  async () => {
    const res = await api.get<ListResponse>(
      `/admin/creator?page=${page.value}&limit=${limit}`
    )
    return res.code === 0 ? res.data : { items: [], total: 0 }
  },
  { default: () => ({ items: [], total: 0 }) }
)

watch(page, () => refresh())

const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / limit))

// Backend exposes /approve and /decline as separate endpoints, with different
// required bodies: approve takes { uid }, decline takes { reason }.
const handleApprove = async (c: AdminCreator) => {
  if (!c.sender) {
    useKunMessage('申请缺少用户信息，无法批准', 'error')
    return
  }
  const res = await api.put(`/admin/creator/${c.id}/approve`, {
    uid: c.sender.id
  })
  if (res.code === 0) {
    useKunMessage('已同意', 'success')
    await refresh()
  } else {
    useKunMessage(res.message || '操作失败', 'error')
  }
}

const handleDecline = async (c: AdminCreator) => {
  const reason = window.prompt('拒绝原因（可留空）') ?? ''
  const res = await api.put(`/admin/creator/${c.id}/decline`, { reason })
  if (res.code === 0) {
    useKunMessage('已拒绝', 'success')
    await refresh()
  } else {
    useKunMessage(res.message || '操作失败', 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">创作者申请管理</h1>

    <KunLoading v-if="pending" description="加载中..." />
    <div v-else class="space-y-3">
      <KunCard v-for="c in data?.items" :key="c.id" :bordered="true">
        <div class="flex flex-wrap items-start gap-3">
          <KunAvatar v-if="c.sender" :user="c.sender" size="md" />
          <div class="flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold">
                {{ c.sender?.name ?? '未知用户' }}
              </span>
              <KunBadge
                size="sm"
                variant="flat"
                :color="APPLICANT_STATUS_COLOR_MAP[c.status]"
              >
                {{ APPLICANT_STATUS_MAP[c.status] }}
              </KunBadge>
              <span class="text-default-500 text-xs">
                {{ formatDate(c.created, { isShowYear: true, isPrecise: true }) }}
              </span>
            </div>
            <p class="text-sm whitespace-pre-wrap">{{ c.content }}</p>
            <p class="text-default-500 text-xs">
              已发布资源数: {{ c.resource_count }}
            </p>
          </div>
          <div v-if="c.status === 0" class="flex gap-2">
            <KunButton color="success" size="sm" @click="handleApprove(c)">
              同意
            </KunButton>
            <KunButton
              color="danger"
              variant="light"
              size="sm"
              @click="handleDecline(c)"
            >
              拒绝
            </KunButton>
          </div>
        </div>
      </KunCard>
    </div>

    <KunNull
      v-if="!pending && !data?.items?.length"
      description="暂无创作者申请"
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
