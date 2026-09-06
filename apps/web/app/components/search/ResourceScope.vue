<script setup lang="ts">
import { SEARCH_AI_MODEL_FAMILIES, isSearchResourceScope } from './items'

const props = defineProps<{
  keywords: string
  total: number
  pending: boolean
}>()

const route = useRoute()
const router = useRouter()

const scope = computed<SearchResourceScope>(() =>
  isSearchResourceScope(route.query.scope) ? 'model' : 'all'
)

const scopeOptions: FilterOption[] = [
  { value: 'all', label: '全部内容', hint: '含游戏名与备注' },
  { value: 'model', label: '仅 AI 模型', hint: '只看模型名' }
]

const familyOptions: FilterOption[] = SEARCH_AI_MODEL_FAMILIES.map(
  (family) => ({ value: family, label: family })
)

const activeFamily = computed(
  () =>
    (scope.value === 'model' &&
      SEARCH_AI_MODEL_FAMILIES.find(
        (family) => family.toLowerCase() === props.keywords.toLowerCase()
      )) ||
    ''
)

const setScope = (value: string) => {
  const query = { ...route.query }
  if (value === 'model') {
    query.scope = 'model'
  } else {
    delete query.scope
  }
  router.replace({ query })
}

// Picking a family is a search, not a filter: it writes the model name into the
// box the reader is already looking at, so what is being matched stays visible.
const pickFamily = (family: string) =>
  router.replace({ query: { ...route.query, scope: 'model', q: family } })
</script>

<template>
  <FilterBar
    :chips="[]"
    :total="total"
    :pending="pending"
    unit="个补丁资源"
  >
    <FilterMenu
      icon="lucide:scan-search"
      label="匹配范围"
      :options="scopeOptions"
      :model-value="scope"
      empty-value="all"
      @update:model-value="setScope($event as string)"
    />

    <KunTooltip
      text="选择后会把模型名填进搜索框; 也可以直接输入 gemini-3-pro-preview 这样的完整名字。"
      position="bottom"
    >
      <FilterMenu
        icon="lucide:bot"
        label="常用模型"
        :options="familyOptions"
        :model-value="activeFamily"
        @update:model-value="pickFamily($event as string)"
      />
    </KunTooltip>
  </FilterBar>
</template>
