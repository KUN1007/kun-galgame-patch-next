<script setup lang="ts">
import {
  SEARCH_ENTITY_FAMILIES,
  SEARCH_ENTITY_LIMIT,
  isSearchEntityFamily
} from './items'

const props = defineProps<{
  keywords: string
}>()

const route = useRoute()
const router = useRouter()
const api = useApi()

const family = computed<SearchEntityFamily | 'all'>(() => {
  const value = route.query.family
  const raw = Array.isArray(value) ? value[0] : value
  return isSearchEntityFamily(raw) ? raw : 'all'
})

const setFamily = (value: SearchEntityFamily | 'all') => {
  if (value === family.value) {
    return
  }
  const query = { ...route.query }
  if (value === 'all') {
    delete query.family
  } else {
    query.family = value
  }
  router.replace({ query })
}

const familyItems = computed(() => [
  { value: 'all', textValue: '全部', icon: 'lucide:layout-grid' },
  ...SEARCH_ENTITY_FAMILIES
])

const groups = ref<SearchEntityGroup[]>([])
const pending = ref(!!props.keywords)
const failed = ref(false)
const page = ref(1)
const top = useTemplateRef<HTMLElement>('top')

const isAll = computed(() => family.value === 'all')
const limit = computed(() =>
  isAll.value ? SEARCH_ENTITY_LIMIT.all : SEARCH_ENTITY_LIMIT.one
)

let latest = 0

const load = async () => {
  const current = ++latest
  if (!props.keywords) {
    groups.value = []
    pending.value = false
    return
  }
  pending.value = true
  const query = new URLSearchParams({
    keywords: props.keywords,
    page: String(page.value),
    limit: String(limit.value)
  })
  if (!isAll.value) {
    query.set('family', family.value)
  }
  const res = await api.get<SearchEntityResult>(
    `/search/entity?${query.toString()}`
  )
  if (current !== latest) {
    return
  }
  failed.value = res.code !== 0
  groups.value = res.data?.groups ?? []
  pending.value = false
}

watch(page, async () => {
  await load()
  top.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

watch(
  [() => props.keywords, family],
  () => {
    page.value = 1
    groups.value = []
    load()
  },
  { immediate: true }
)

const isEmpty = computed(
  () =>
    !pending.value &&
    !failed.value &&
    groups.value.every((group) => !group.items.length)
)

// One family per request, so the single-family tab is the only one with a page
// count to divide: 全部 is a preview of every family at once.
const totalPage = computed(() =>
  isAll.value
    ? 0
    : Math.ceil((groups.value[0]?.total ?? 0) / SEARCH_ENTITY_LIMIT.one)
)
</script>

<template>
  <div ref="top" class="scroll-mt-40 space-y-5">
    <KunTab
      :items="familyItems"
      :model-value="family"
      variant="light"
      size="sm"
      name="search-entity-family"
      @update:model-value="
        (value) => setFamily(value as SearchEntityFamily | 'all')
      "
    />

    <SearchSkeleton v-if="pending && !groups.length" shape="entity" />

    <template v-else>
      <KunLoading :loading="pending">
        <div class="space-y-5">
          <SearchEntityGroup
            v-for="group in groups"
            :key="group.family"
            :group="group"
            :keywords="keywords"
            :show-header="isAll"
            :show-cap="isAll"
            @open="setFamily"
          />
        </div>
      </KunLoading>

      <KunNull v-if="failed" description="资料库搜索没能完成, 请稍后重试" />
      <KunNull v-else-if="isEmpty" description="资料库里没有找到匹配的条目" />

      <div v-if="totalPage > 1" class="flex justify-center">
        <KunPagination
          v-model:current-page="page"
          :total-page="totalPage"
          :is-loading="pending"
        />
      </div>
    </template>
  </div>
</template>
