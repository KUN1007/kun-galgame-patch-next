<script setup lang="ts">
import { SEARCH_AI_MODEL_FAMILIES, isSearchResourceScope } from './items'

const props = defineProps<{ keywords: string }>()

const route = useRoute()
const router = useRouter()

const scope = computed<SearchResourceScope>(() =>
  isSearchResourceScope(route.query.scope) ? 'model' : 'all'
)

const setScope = (value: SearchResourceScope) => {
  if (value === scope.value) {
    return
  }
  const query = { ...route.query }
  if (value === 'model') {
    query.scope = 'model'
  } else {
    delete query.scope
  }
  router.replace({ query })
}

// A family chip is a search, not a filter: it writes the model name into the
// box the reader is already looking at, so what is being matched stays visible.
const pickFamily = (family: string) => {
  const query = { ...route.query }
  query.scope = 'model'
  query.q = family
  router.replace({ query })
}

const activeFamily = computed(() =>
  scope.value === 'model'
    ? SEARCH_AI_MODEL_FAMILIES.find(
        (family) => family.toLowerCase() === props.keywords.toLowerCase()
      )
    : undefined
)

const chipClass = (active: boolean) => [
  'shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-sm whitespace-nowrap transition-colors',
  active
    ? 'bg-primary/15 text-primary font-medium'
    : 'text-default-600 hover:bg-default-100'
]
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex flex-wrap items-center gap-1.5">
      <span class="text-default-500 shrink-0 text-sm">匹配</span>
      <button
        type="button"
        :class="chipClass(scope === 'all')"
        @click="setScope('all')"
      >
        全部内容
      </button>
      <button
        type="button"
        :class="chipClass(scope === 'model')"
        @click="setScope('model')"
      >
        仅 AI 模型
      </button>
      <span
        v-if="scope === 'model'"
        class="text-default-400 text-xs"
      >
        只匹配发布者填写的模型名, 可直接输入 gemini-3-pro-preview 这样的完整名字
      </span>
    </div>

    <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
      <button
        v-for="family in SEARCH_AI_MODEL_FAMILIES"
        :key="family"
        type="button"
        :class="chipClass(activeFamily === family)"
        @click="pickFamily(family)"
      >
        {{ family }}
      </button>
    </div>
  </div>
</template>
