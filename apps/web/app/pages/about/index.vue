<script setup lang="ts">
useKunSeoMeta({
  title: '关于我们',
  description: '鲲 Galgame 补丁的关于页面、公告与帮助文档'
})

const { data: posts } = await useAsyncData<KunPostMetadata[]>(
  'about-posts',
  () => $fetch('/api/about/posts'),
  { default: () => [] }
)
</script>

<template>
  <div class="w-full px-6 pb-6">
    <AboutHeader />

    <div
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      <AboutCard v-for="post in posts" :key="post.slug" :post="post" />
    </div>

    <KunNull v-if="!posts?.length" description="暂无文章" />
  </div>
</template>
