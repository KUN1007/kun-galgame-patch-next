<script setup lang="ts">
defineOptions({ name: 'galgame-list' })

useKunSeoMeta({
  title: 'Galgame 补丁资源库',
  description:
    '浏览本站已有补丁资源的全部 Galgame，按补丁更新时间、条目创建时间、浏览量、下载量排序，支持按翻译类型与发售日期筛选，免费下载 Windows / 安卓 / KRKR / Tyranor 等平台的 Galgame 中文汉化补丁。'
})
</script>

<template>
  <GalgameBrowser mode="resource" />
</template>
