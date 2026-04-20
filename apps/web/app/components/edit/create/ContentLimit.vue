<script setup lang="ts">
import { GALGAME_AGE_LIMIT_MAP } from '~/constants/galgame'

interface Props {
  errors?: string
}

defineProps<Props>()

const store = useCreatePatchStore()

const isNsfw = computed({
  get: () => store.data.contentLimit === 'nsfw',
  set: (v: boolean) => store.setData({ contentLimit: v ? 'nsfw' : 'sfw' })
})
</script>

<template>
  <div class="space-y-2">
    <h2 class="text-xl">页面内容分级</h2>
    <div
      class="border-danger/30 bg-danger/5 rounded-lg border p-3 text-sm"
    >
      <p class="text-danger font-bold">再次请大家注意 NSFW 问题</p>
      <p class="text-default-600 mt-1">
        封面需要打码才能放上去的一律算 NSFW, 看起来不能在公司报告大会上放在 PPT 里展示的游戏都是 NSFW, 可以错杀不可以放过
      </p>
    </div>

    <KunCard :bordered="true">
      <p v-if="errors" class="text-danger-500 text-xs">{{ errors }}</p>
      <p class="text-default-500 text-sm">
        默认页面是 SFW (内容安全), 如果觉得游戏名/预览图/介绍过于虎狼, 完全无法在公共场合展示, 请设置为 NSFW
      </p>
      <p class="text-default-500 text-sm">
        SFW 的浏览量会高两到三倍, 请尽量保证游戏封面、游戏名、游戏介绍等可以在公共场合展示
      </p>
    </KunCard>

    <p>注意这个 NSFW 开关, 越严越好, 只要有一点不对立即设置为 NSFW</p>
    <KunSwitch v-model="isNsfw" :label="GALGAME_AGE_LIMIT_MAP[store.data.contentLimit]" />
  </div>
</template>
