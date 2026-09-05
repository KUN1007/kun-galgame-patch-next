<script setup lang="ts">
const props = defineProps<{
  type: SearchPagedType
  results: SearchResultItem[]
  keywords: string
}>()

const isGalgameResults = (results: unknown[]): results is GalgameCard[] =>
  props.type === 'galgame'
const isResourceResults = (results: unknown[]): results is PatchResource[] =>
  props.type === 'resource'
const isUserResults = (results: unknown[]): results is SearchUser[] =>
  props.type === 'user'
</script>

<template>
  <div>
    <GalgameList v-if="isGalgameResults(results)" :items="results" />

    <div
      v-if="isResourceResults(results)"
      class="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2"
    >
      <ResourceCard
        v-for="resource in results"
        :key="resource.id"
        :resource="resource"
      />
    </div>

    <div v-if="isUserResults(results)" class="grid gap-2 sm:grid-cols-2">
      <SearchUserCard
        v-for="user in results"
        :key="user.id"
        :user="user"
        :keywords="keywords"
      />
    </div>
  </div>
</template>
