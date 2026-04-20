<script setup lang="ts">
interface Props {
  company: Company
}

const props = defineProps<Props>()
</script>

<template>
  <KunCard
    is-pressable
    :href="`/company/${props.company.id}`"
    class-name="w-full"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2
        class="hover:text-primary-500 text-lg font-semibold transition-colors line-clamp-2"
      >
        {{ props.company.name }}
      </h2>
      <KunBadge size="sm" variant="flat">
        {{ props.company.count }} 个补丁
      </KunBadge>
    </div>
    <div
      v-if="props.company.alias && props.company.alias.length > 0"
      class="mt-2 flex flex-wrap gap-1"
    >
      <KunBadge
        v-for="alias in props.company.alias"
        :key="alias"
        size="sm"
        variant="flat"
        color="secondary"
      >
        {{ alias }}
      </KunBadge>
    </div>
  </KunCard>
</template>
