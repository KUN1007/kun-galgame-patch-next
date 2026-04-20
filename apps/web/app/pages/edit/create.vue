<script setup lang="ts">
import localforage from 'localforage'

useKunSeoMeta({
  title: '创建 Galgame',
  description: '创建一个新的 Galgame 游戏条目'
})

const api = useApi()
const userStore = useUserStore()
const store = useCreatePatchStore()

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const VNDBRegex = /^v\d{1,6}$/

const handleSubmit = async () => {
  errors.value = {}
  const banner = await localforage.getItem<Blob>('kun-patch-banner')
  if (!banner) {
    useKunMessage('未检测到预览图片', 'error')
    errors.value = { banner: '请上传预览图片' }
    return
  }
  if (userStore.user.role < 2 && !VNDBRegex.test(store.data.vndbId)) {
    useKunMessage('为防止恶意发布, 仅限创作者可以不填写 VNDB ID', 'error')
    errors.value = { vndbId: '非创作者必须填写 VNDB ID' }
    return
  }

  submitting.value = true
  useKunMessage('正在发布中... 可能需要十秒左右', 'info', 10000)

  try {
    const formData = new FormData()
    formData.append('banner', banner)
    formData.append('name_en_us', store.data.name['en-us'] ?? '')
    formData.append('name_ja_jp', store.data.name['ja-jp'] ?? '')
    formData.append('name_zh_cn', store.data.name['zh-cn'] ?? '')
    formData.append('vndbId', store.data.vndbId)
    formData.append('introduction_en_us', store.data.introduction['en-us'] ?? '')
    formData.append('introduction_ja_jp', store.data.introduction['ja-jp'] ?? '')
    formData.append('introduction_zh_cn', store.data.introduction['zh-cn'] ?? '')
    formData.append('contentLimit', store.data.contentLimit)
    formData.append('alias', JSON.stringify(store.data.alias))
    formData.append('released', store.data.released)

    const config = useRuntimeConfig()
    const token = useCookie('access_token')
    const res = await $fetch<{ code: number; message: string; data: number }>(
      `${config.public.apiBase}/patch`,
      {
        method: 'POST',
        body: formData,
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
        credentials: 'include'
      }
    ).catch((err) => {
      return {
        code: err.statusCode ?? -1,
        message: err.data?.message ?? err.message ?? '请求失败',
        data: 0
      }
    })

    if (res.code === 0 && res.data) {
      store.resetData()
      await localforage.removeItem('kun-patch-banner')
      useKunMessage('发布完成, 正在跳转到游戏页面', 'success')
      await navigateTo(`/patch/${res.data}/introduction`)
    } else {
      useKunMessage(res.message || '发布失败', 'error')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto my-6 flex w-96 max-w-5xl flex-1 items-center justify-center md:w-full">
    <form class="mx-auto w-full flex-1" @submit.prevent="handleSubmit">
      <KunCard :bordered="true">
        <template #header>
          <div class="flex flex-col gap-2 px-1 pt-1">
            <h1 class="text-2xl">创建新游戏</h1>
            <p class="text-default-500">
              您需要创建一个新游戏, 稍后在游戏页面添加补丁资源
            </p>
            <NuxtLink
              to="/about/notice/galgame-tutorial"
              class="text-primary hover:underline"
            >
              如何在鲲 Galgame 补丁发布 Galgame
            </NuxtLink>
            <div class="bg-success/10 border-success/30 rounded-lg border p-3 text-sm">
              <p class="text-success font-bold">
                我们正在构建世界最大最全的 Galgame 数据库
              </p>
              <p class="text-default-600 mt-1">
                现在发布游戏仅需要填写 VNDB ID 和一张预览图片, 剩下的游戏数据我们会自动聚合
              </p>
            </div>
          </div>
        </template>

        <div class="mt-4 space-y-10">
          <EditCreateVNDBInput :errors="errors.vndbId" />
          <EditCreateBannerImage :errors="errors.banner" />
          <EditCreateContentLimit :errors="errors.contentLimit" />
          <KunButton
            type="submit"
            color="primary"
            full-width
            :loading="submitting"
            :disabled="submitting"
          >
            提交
          </KunButton>
        </div>
      </KunCard>
    </form>
  </div>
</template>
