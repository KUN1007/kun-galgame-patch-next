<script setup lang="ts">
import { ROLE_LABELS } from '~/constants/character'

interface Props {
  character: PatchCharacter
}

const props = defineProps<Props>()

const displayName = computed(() =>
  getPreferredLanguageText(props.character.name)
)
</script>

<template>
  <NuxtLink
    :to="`/character/${props.character.id}`"
    class="relative block overflow-hidden rounded-lg shadow-sm"
  >
    <div class="bg-default-100 aspect-[3/4] overflow-hidden">
      <KunImage
        :src="props.character.image || '/kungalgame.webp'"
        :alt="displayName"
        :class="
          cn(
            'h-full w-full object-cover object-[50%_top] dark:opacity-70',
            !props.character.image && 'opacity-30!'
          )
        "
      />
    </div>
    <div
      class="bg-background/60 absolute right-1 bottom-1 left-1 z-10 flex items-center justify-between rounded-lg border border-white/20 px-2 py-1 overflow-hidden"
    >
      <h3 class="text-sm font-bold truncate">{{ displayName }}</h3>
      <KunBadge v-if="props.character.role" size="sm" color="secondary" variant="flat">
        {{ ROLE_LABELS[props.character.role] ?? props.character.role }}
      </KunBadge>
    </div>
  </NuxtLink>
</template>
