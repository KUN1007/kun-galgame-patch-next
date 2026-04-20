<script setup lang="ts">
import { roleLabel } from '~/constants/character'

interface Props {
  person: PatchPerson
}

const props = defineProps<Props>()

const displayName = computed(() => getPreferredLanguageText(props.person.name))
</script>

<template>
  <div class="flex gap-3">
    <div
      class="bg-default-100 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-16"
    >
      <KunImage
        :src="props.person.image || '/kungalgame.webp'"
        :alt="displayName"
        class-name="h-full w-full object-cover"
      />
    </div>

    <div>
      <h3 class="font-semibold truncate">
        <NuxtLink
          :to="`/person/${props.person.id}`"
          class="hover:text-primary-500"
        >
          {{ displayName }}
        </NuxtLink>
      </h3>

      <div class="flex flex-wrap gap-2">
        <span
          v-for="r in props.person.roles.slice(0, 3)"
          :key="r"
          class="text-default-500 text-sm"
        >
          {{ roleLabel(r) }}
        </span>
      </div>
    </div>
  </div>
</template>
