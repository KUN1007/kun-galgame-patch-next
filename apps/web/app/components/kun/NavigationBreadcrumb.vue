<script setup lang="ts">
import { createBreadcrumbItem } from '~/constants/routes/routes'
import { dynamicRoutes } from '~/constants/routes/constants'
import type { KunBreadcrumbItem } from '~/constants/routes/constants'

const route = useRoute()
const breadcrumbStore = useBreadcrumbStore()

const handleRoutes = () => {
  const newItem = createBreadcrumbItem(route.path, route.params)
  if (!newItem) return

  const merged = [...breadcrumbStore.items, newItem]
  const map = new Map<string, KunBreadcrumbItem>()

  for (const item of merged) {
    if (map.has(item.key)) {
      const existing = map.get(item.key)!
      map.delete(item.key)
      if (dynamicRoutes.some((r) => item.key.startsWith(`/${r}`))) {
        map.set(item.key, item)
      } else {
        map.set(item.key, existing)
      }
    } else {
      map.set(item.key, item)
    }
  }

  breadcrumbStore.setItems(Array.from(map.values()))
}

watch(() => route.path, handleRoutes, { immediate: true })
</script>

<template>
  <div class="z-10 my-4 w-full">
    <div class="mx-auto max-w-7xl px-3">
      <ol class="flex flex-wrap items-center gap-1 text-sm">
        <template
          v-for="(item, index) in breadcrumbStore.items"
          :key="item.key"
        >
          <li class="flex items-center">
            <NuxtLink
              :to="item.href"
              :class="
                cn(
                  'hover:bg-default-100 rounded px-2 py-1 break-all hover:underline',
                  index === breadcrumbStore.items.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-foreground/60'
                )
              "
            >
              {{ item.label }}
            </NuxtLink>
          </li>
          <li
            v-if="index < breadcrumbStore.items.length - 1"
            class="text-foreground/40"
          >
            <KunIcon name="lucide:chevron-right" class="size-4" />
          </li>
        </template>
      </ol>
    </div>
  </div>
</template>
