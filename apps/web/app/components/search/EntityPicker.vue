<script setup lang="ts">
import type { KunAutocompleteOption } from '@kungal/ui-vue'

const props = defineProps<{
  family: Extract<SearchEntityFamily, 'company' | 'tag'>
  label: string
  placeholder: string
  description?: string
}>()

const emit = defineEmits<{ select: [item: SearchEntityItem] }>()

const api = useApi()

const draft = ref('')
const items = ref<SearchEntityItem[]>([])
const pending = ref(false)

let latest = 0

// KunAutocomplete emits @search with the value the box held BEFORE the
// keystroke that scheduled it — typing k-e-y searched "", "k", "ke" and the
// list sat one letter behind the box forever. draft is this component's own
// ref, written synchronously by the same v-model update, so it is the text the
// reader can actually see by the time the debounce fires.
const search = async () => {
  const current = ++latest
  const keywords = draft.value.trim()
  if (!keywords) {
    items.value = []
    pending.value = false
    return
  }
  pending.value = true
  const query = new URLSearchParams({
    keywords,
    family: props.family,
    page: '1',
    limit: '10'
  })
  const res = await api.get<SearchEntityResult>(
    `/search/entity?${query.toString()}`
  )
  if (current !== latest) {
    return
  }
  items.value = res.code === 0 ? (res.data?.groups[0]?.items ?? []) : []
  pending.value = false
}

const options = computed(() =>
  items.value.map((item) => ({
    value: String(item.id),
    label: getPreferredLanguageText(item.name),
    workCount: item.work_count
  }))
)

const handleSelect = (option: KunAutocompleteOption) => {
  const picked = items.value.find((item) => String(item.id) === option.value)
  if (!picked) {
    return
  }
  emit('select', picked)
  draft.value = ''
  items.value = []
}
</script>

<template>
  <KunAutocomplete
    v-model="draft"
    :options="options"
    :manual-filter="true"
    :loading="pending"
    :debounce="300"
    :label="label"
    :description="description"
    :placeholder="placeholder"
    size="sm"
    no-result-text="没有找到匹配的条目"
    loading-text="正在检索资料库…"
    @search="search"
    @select="handleSelect"
  >
    <template #option="{ option }">
      <span class="flex w-full items-center justify-between gap-2">
        <span class="truncate">{{ option.label }}</span>
        <span
          v-if="option.workCount"
          class="text-default-400 shrink-0 text-xs tabular-nums"
        >
          {{ option.workCount }} 部
        </span>
      </span>
    </template>
  </KunAutocomplete>
</template>
