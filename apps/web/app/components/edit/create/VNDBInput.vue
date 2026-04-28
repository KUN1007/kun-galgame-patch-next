<script setup lang="ts">
import { kunMoyuMoe } from '~/config/moyu-moe'

interface Props {
  errors?: string
}

defineProps<Props>()

const api = useApi()
const store = useCreatePatchStore()

const existPatchId = ref(0)
const checking = ref(false)

const VNDBRegex = /^v\d{1,6}$/

// Local camelCase name for the v-model binding; the underlying store uses
// snake_case to align with the backend wire format.
const vndbId = computed({
  get: () => store.data.vndb_id,
  set: (v: string) => store.setData({ vndb_id: v })
})

const handleCheckDuplicate = async () => {
  if (!VNDBRegex.test(vndbId.value)) {
    useKunMessage('您输入的 VNDB ID 格式无效', 'error')
    return
  }
  checking.value = true
  try {
    // DTO tag is `json:"vndb_id"` — match that on the query string.
    const res = await api.get<{ exists: boolean }>(
      `/patch/duplicate?vndb_id=${vndbId.value}`
    )
    if (res.code === 0 && res.data?.exists) {
      useKunMessage(
        '游戏重复, 该游戏已经有人发布过了, 请在 Galgame 详情页添加补丁资源',
        'error'
      )
      existPatchId.value = 1
    } else {
      useKunMessage('检测完成, 该游戏并未重复!', 'success')
      existPatchId.value = 0
    }
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <div class="flex w-full flex-col space-y-2">
    <h2 class="text-xl">VNDB ID</h2>
    <KunInput
      v-model="vndbId"
      placeholder="请输入 VNDB ID, 例如 v19658"
      :error="errors"
    />
    <p class="text-sm font-bold">
      提示: VNDB ID 需要进入
      <a
        href="https://vndb.org/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary inline-flex items-center gap-1 hover:underline"
      >
        VNDB 官网 (vndb.org)
        <KunIcon name="lucide:external-link" class="size-3.5" />
      </a>
      获取, 游戏页面 URL (形如 https://vndb.org/v19658) 中的 v19658 就是 VNDB ID
    </p>
    <p class="text-default-500 text-sm">
      您可以不填写 VNDB ID 发布游戏, 但是您需要自行检查游戏是否重复
    </p>
    <p class="text-danger text-lg font-bold">
      目前 VNDB ID 发布后暂时无法更改, 请务必在发布游戏之前检查 VNDB ID 的正确性
    </p>

    <div v-if="vndbId" class="flex items-center gap-4 text-sm">
      <KunButton
        color="primary"
        size="sm"
        :loading="checking"
        @click="handleCheckDuplicate"
      >
        检查重复
      </KunButton>
    </div>

    <KunCard v-if="existPatchId !== 0" :bordered="true">
      <p class="text-danger-600 font-bold">
        游戏重复, 该游戏已经有人发布过了, 请直接点击下面的链接前往游戏页面创建补丁资源即可
      </p>
      <NuxtLink
        :to="`/patch/${existPatchId}/resource`"
        class="text-primary hover:underline"
      >
        {{ `${kunMoyuMoe.domain.main}/patch/${existPatchId}/resource` }}
      </NuxtLink>
    </KunCard>
  </div>
</template>
