<script setup lang="ts">
interface Props {
  tag: Tag
}

const props = defineProps<Props>()
</script>

<template>
  <KunCard
    is-pressable
    :href="`/tag/${props.tag.id}`"
    class-name="w-full"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2
        class="hover:text-primary-500 text-lg font-semibold transition-colors line-clamp-2"
      >
        {{ props.tag.name }}
      </h2>
      <KunBadge size="sm" variant="flat">
        {{ props.tag.count }} 个补丁
      </KunBadge>
    </div>
    <div
      v-if="props.tag.alias && props.tag.alias.length > 0"
      class="mt-2 flex flex-wrap gap-1"
    >
      <KunBadge
        v-for="alias in props.tag.alias"
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
