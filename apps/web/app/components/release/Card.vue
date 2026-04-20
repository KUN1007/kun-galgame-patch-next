<script setup lang="ts">
interface Props {
  patch: GalgameReleaseCard
}

const props = defineProps<Props>()

const displayName = computed(() => getPreferredLanguageText(props.patch.name))

const bannerSrc = computed(() =>
  props.patch.banner
    ? props.patch.banner.replace(/\.avif$/, '-mini.avif')
    : '/kungalgame-trans.webp'
)
</script>

<template>
  <KunCard
    is-pressable
    :href="`/patch/${props.patch.patchId}/introduction`"
    class-name="border-default-100 dark:border-default-200 h-full w-full border"
    content-class="p-0 gap-0"
  >
    <div
      class="relative mx-auto w-full overflow-hidden rounded-t-lg text-center opacity-90"
    >
      <KunImage
        :alt="displayName"
        :src="bannerSrc"
        class-name="size-full object-cover"
        style="aspect-ratio: 16 / 9"
      />
    </div>
    <div class="justify-between space-y-2 p-3">
      <h2
        class="hover:text-primary-500 text-medium line-clamp-2 font-semibold transition-colors sm:text-lg"
      >
        {{ displayName }}
      </h2>

      <div class="flex items-center justify-between gap-2">
        <KunBadge size="sm" color="primary" variant="flat">
          发售于 {{ formatDate(props.patch.released) }}
        </KunBadge>

        <div class="flex items-center gap-1">
          <KunIcon name="lucide:puzzle" class="text-default-500 size-4" />
          <span class="text-default-500 text-sm">
            {{ props.patch.resourceCount }}
          </span>
        </div>
      </div>
    </div>
  </KunCard>
</template>
