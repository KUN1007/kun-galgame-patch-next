<script setup lang="ts">
import {
  SUPPORTED_TYPE_SHORT_MAP,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP
} from '~/constants/resource'

const props = defineProps<{
  resource: PatchResource
  keywords?: string
}>()

const galgameName = computed(() =>
  props.resource.patch?.name
    ? getPreferredLanguageText(props.resource.patch.name)
    : ''
)

const title = computed(
  () => props.resource.name || galgameName.value || '补丁资源'
)

// Uploaders write the note in markdown, so the raw string is full of ###, **
// and bare links — three lines of syntax before the sentence that matched.
const note = computed(() => markdownToText(props.resource.note))

const labels = computed(() =>
  [
    ...props.resource.type.map((t) => SUPPORTED_TYPE_SHORT_MAP[t] ?? t),
    ...props.resource.language.map((l) => SUPPORTED_LANGUAGE_MAP[l] ?? l),
    ...props.resource.platform.map((p) => SUPPORTED_PLATFORM_MAP[p] ?? p)
  ].filter(Boolean)
)
</script>

<template>
  <KunLink
    color="default"
    underline="none"
    class-name="flex-col items-start w-full gap-1.5"
    :to="`/resource/${resource.id}`"
  >
    <div class="flex w-full items-baseline gap-2">
      <h3 class="hover:text-primary min-w-0 flex-1 truncate font-medium">
        <SearchHighlight :text="title" :keywords="keywords" />
      </h3>
      <span class="text-default-400 shrink-0 text-xs">
        {{ formatDate(resource.created, { isShowYear: true }) }}
      </span>
    </div>

    <p
      v-if="galgameName && galgameName !== title"
      class="text-default-500 flex w-full min-w-0 items-center gap-1 text-xs"
    >
      <KunIcon name="lucide:gamepad-2" class="size-3.5 shrink-0" />
      <span class="truncate">
        <SearchHighlight :text="galgameName" :keywords="keywords" />
      </span>
    </p>

    <p v-if="note" class="text-default-600 line-clamp-2 w-full text-xs">
      <SearchHighlight :text="note" :keywords="keywords" />
    </p>

    <div
      class="text-default-500 flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-xs"
    >
      <span v-for="label in labels" :key="label">{{ label }}</span>
      <span v-if="resource.model_name" class="flex items-center gap-1">
        <KunIcon name="lucide:bot" class="size-3.5" />
        <SearchHighlight :text="resource.model_name" :keywords="keywords" />
      </span>

      <span class="ml-auto flex shrink-0 items-center gap-3 tabular-nums">
        <span v-if="resource.size" class="flex items-center gap-1">
          <KunIcon name="lucide:database" class="size-3.5" />
          {{ resource.size }}
        </span>
        <span class="flex items-center gap-1">
          <KunIcon name="lucide:download" class="size-3.5" />
          {{ formatNumber(resource.download) }}
        </span>
        <span class="flex items-center gap-1">
          <KunIcon name="lucide:heart" class="size-3.5" />
          {{ resource.like_count }}
        </span>
      </span>
    </div>
  </KunLink>
</template>
