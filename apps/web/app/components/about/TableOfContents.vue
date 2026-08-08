<script setup lang="ts">
interface Props {
  items: KunTOCItem[]
}

const props = defineProps<Props>()

const activeId = ref<string>('')

const scrollTo = (id: string, e: MouseEvent) => {
  e.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
  activeId.value = id
}

let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (!import.meta.client || !props.items.length) return
  observer?.disconnect()

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length && visible[0]?.target.id) {
        activeId.value = visible[0].target.id
      }
    },
    { rootMargin: '-80px 0px -65% 0px', threshold: 0 }
  )

  for (const item of props.items) {
    const el = document.getElementById(item.id)
    if (el) observer.observe(el)
  }
}

onMounted(() => {
  setupObserver()
  if (location.hash) activeId.value = decodeURIComponent(location.hash.slice(1))
})

watch(() => props.items, setupObserver)
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav v-if="props.items.length">
    <h3 class="text-default-500 mb-3 px-2 text-xs font-semibold uppercase">
      本页索引
    </h3>
    <ul class="space-y-1 text-sm">
      <li
        v-for="item in props.items"
        :key="item.id"
        :style="{ paddingLeft: `${(item.level - 1) * 0.75}rem` }"
      >
        <a
          :href="`#${item.id}`"
          :class="[
            'hover:text-primary block rounded px-2 py-1 transition-colors',
            activeId === item.id
              ? 'text-primary font-medium'
              : 'text-default-600'
          ]"
          @click="scrollTo(item.id, $event)"
        >
          {{ item.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>
