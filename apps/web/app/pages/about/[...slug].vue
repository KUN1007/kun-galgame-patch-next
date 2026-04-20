<script setup lang="ts">
const route = useRoute()

const slugParam = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw.join('/') : String(raw ?? '')
})

const { data, error } = await useAsyncData<KunPostDetail>(
  () => `about-post-${slugParam.value}`,
  () => $fetch('/api/about/post', { query: { slug: slugParam.value } })
)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '文章未找到',
    fatal: true
  })
}

useKunSeoMeta({
  title: data.value?.frontmatter.title ?? slugParam.value,
  description: data.value?.frontmatter.description ?? ''
})
</script>

<template>
  <div v-if="data" class="mx-auto w-full max-w-3xl px-4 py-6">
    <AboutBlogHeader :frontmatter="data.frontmatter" />
    <article class="kun-prose" v-html="data.html" />
    <AboutNavigation :prev="data.prev" :next="data.next" />
  </div>
</template>

<style>
.kun-prose {
  line-height: 1.75;
}
.kun-prose h1,
.kun-prose h2,
.kun-prose h3,
.kun-prose h4 {
  margin-top: 1.5em;
  margin-bottom: 0.6em;
  font-weight: 700;
}
.kun-prose h1 {
  font-size: 1.875rem;
}
.kun-prose h2 {
  font-size: 1.5rem;
}
.kun-prose h3 {
  font-size: 1.25rem;
}
.kun-prose p {
  margin: 1em 0;
}
.kun-prose a {
  color: var(--color-primary);
  text-decoration: underline;
}
.kun-prose ul,
.kun-prose ol {
  margin: 1em 0;
  padding-left: 1.5rem;
}
.kun-prose ul {
  list-style: disc;
}
.kun-prose ol {
  list-style: decimal;
}
.kun-prose code {
  padding: 0.15em 0.4em;
  border-radius: 0.25rem;
  background: color-mix(in oklab, var(--color-default) 20%, transparent);
  font-size: 0.9em;
}
.kun-prose pre {
  margin: 1em 0;
  padding: 1em;
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--color-default) 15%, transparent);
  overflow: auto;
}
.kun-prose pre code {
  background: none;
  padding: 0;
}
.kun-prose blockquote {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 3px solid var(--color-primary);
  color: var(--color-foreground);
  opacity: 0.85;
}
.kun-prose img {
  margin: 1em auto;
  max-width: 100%;
  border-radius: 0.5rem;
}
.kun-prose table {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}
.kun-prose th,
.kun-prose td {
  padding: 0.5rem 0.75rem;
  border: 1px solid color-mix(in oklab, var(--color-default) 30%, transparent);
}
</style>
