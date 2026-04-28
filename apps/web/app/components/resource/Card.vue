<script setup lang="ts">
interface Props {
  resource: PatchResource
}

const props = defineProps<Props>()

// Resource rows come back without an owning patch object (see
// apps/api/internal/common/handler.go GetGlobalResources). We display the
// resource name as the headline and let the user follow through to /resource/:id
// for the full patch context.
const title = computed(
  () => props.resource.name || props.resource.note || '补丁资源'
)

const userDescription = computed(() => {
  const when = formatDate(props.resource.created, {
    isShowYear: true,
    isPrecise: true
  })
  return `发布于 ${when}`
})
</script>

<template>
  <KunCard
    is-pressable
    :href="`/resource/${props.resource.id}`"
    class-name="w-full"
  >
    <div class="flex flex-col justify-between space-y-2">
      <div class="flex">
        <KunUser :user="props.resource.user" :description="userDescription" />
      </div>

      <h2
        class="hover:text-primary-500 text-lg font-semibold transition-colors line-clamp-2"
      >
        {{ title }}
      </h2>

      <KunPatchAttribute
        :types="props.resource.type"
        :languages="props.resource.language"
        :platforms="props.resource.platform"
        :model-name="props.resource.model_name"
        size="sm"
      />

      <div
        class="text-small text-default-500 flex items-center justify-between"
      >
        <div class="flex gap-4">
          <div class="flex items-center gap-1">
            <KunIcon name="lucide:heart" class="size-4" />
            {{ props.resource.like_count }}
          </div>
          <div class="flex items-center gap-1">
            <KunIcon name="lucide:download" class="size-4" />
            {{ props.resource.download }}
          </div>
        </div>
        <KunBadge size="sm" variant="flat">
          {{ props.resource.size }}
        </KunBadge>
      </div>
    </div>
  </KunCard>
</template>
