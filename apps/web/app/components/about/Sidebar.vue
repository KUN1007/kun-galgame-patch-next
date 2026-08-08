<script setup lang="ts">
interface Props {
  tree: KunTreeNode
  activeSlug?: string
}

const props = withDefaults(defineProps<Props>(), { activeSlug: '' })

const children = computed(() =>
  props.tree.type === 'directory' ? props.tree.children ?? [] : []
)
</script>

<template>
  <nav class="border-default-200 pr-3 lg:border-r">
    <NuxtLink
      to="/doc"
      class="hover:bg-default-100 mb-2 flex items-center gap-2 rounded-md px-2 py-2 text-base font-semibold"
    >
      <KunIcon name="lucide:book-open-text" class="text-primary size-5" />
      目录
    </NuxtLink>

    <KunNull
      v-if="!children.length"
      description="暂无文章"
      class="px-2 py-4 text-xs"
    />

    <AboutSideTreeItem
      v-for="(child, i) in children"
      :key="i"
      :node="child"
      :level="0"
      :active-slug="props.activeSlug"
    />
  </nav>
</template>
