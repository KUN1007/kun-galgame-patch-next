<script setup lang="ts">
const props = defineProps<{
  keywords: string
  overview: SearchLanes | null
  pending: boolean
  failed: boolean
}>()

const emit = defineEmits<{
  open: [value: SearchType]
}>()

const entityGroups = computed(
  () => props.overview?.entities.filter((group) => group.items.length) ?? []
)

const isEmpty = computed(() => {
  const totals = props.overview?.totals
  return (
    !props.pending &&
    !!totals &&
    Object.values(totals).every((value) => value === 0)
  )
})
</script>

<template>
  <div v-if="pending" class="space-y-8">
    <SearchSkeleton shape="card" :count="3" />
    <SearchSkeleton shape="row" :count="3" />
  </div>

  <KunNull v-else-if="failed" description="搜索没能完成, 请稍后重试" />

  <KunNull v-else-if="isEmpty" description="杂鱼杂鱼杂鱼~什么也没有搜索到" />

  <div v-else-if="overview" class="space-y-10">
    <SearchSection
      v-if="overview.galgames.length"
      type="galgame"
      :total="overview.totals.galgame"
      :shown="overview.galgames.length"
      @open="emit('open', $event)"
    >
      <GalgameList :items="overview.galgames" />
    </SearchSection>

    <SearchSection
      v-if="entityGroups.length"
      type="entity"
      :total="overview.totals.entity"
      :shown="entityGroups.reduce((sum, group) => sum + group.items.length, 0)"
      @open="emit('open', $event)"
    >
      <div class="space-y-5">
        <SearchEntityGroup
          v-for="group in entityGroups"
          :key="group.family"
          :group="group"
          :keywords="keywords"
          :show-header="true"
        />
      </div>
    </SearchSection>

    <SearchSection
      v-if="overview.resources.length"
      type="resource"
      :total="overview.totals.resource"
      :shown="overview.resources.length"
      @open="emit('open', $event)"
    >
      <div class="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
        <ResourceCard
          v-for="resource in overview.resources"
          :key="resource.id"
          :resource="resource"
        />
      </div>
    </SearchSection>

    <SearchSection
      v-if="overview.users.length"
      type="user"
      :total="overview.totals.user"
      :shown="overview.users.length"
      @open="emit('open', $event)"
    >
      <div class="grid gap-2 sm:grid-cols-2">
        <SearchUserCard
          v-for="user in overview.users"
          :key="user.id"
          :user="user"
          :keywords="keywords"
        />
      </div>
    </SearchSection>
  </div>
</template>
