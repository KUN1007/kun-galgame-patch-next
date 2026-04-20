<script setup lang="ts">
interface Props {
  resource: PatchResource
}

const props = defineProps<Props>()

const galgameName = computed(() =>
  getPreferredLanguageText(props.resource.patchName)
)

const userDescription = computed(() => {
  const when = formatDate(props.resource.created, {
    isShowYear: true,
    isPrecise: true
  })
  return `发布于 ${when} • 已发布补丁 ${props.resource.user.patchCount} 个`
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
        {{ galgameName }}
      </h2>

      <p
        v-if="props.resource.name || props.resource.note"
        class="text-small text-default-500 truncate line-clamp-2 break-all whitespace-pre-wrap"
      >
        {{ props.resource.name ? props.resource.name : props.resource.note }}
      </p>

      <KunPatchAttribute
        :types="props.resource.type"
        :languages="props.resource.language"
        :platforms="props.resource.platform"
        :model-name="props.resource.modelName"
        size="sm"
      />

      <div
        class="text-small text-default-500 flex items-center justify-between"
      >
        <div class="flex gap-4">
          <div class="flex items-center gap-1">
            <KunIcon name="lucide:heart" class="size-4" />
            {{ props.resource.likeCount }}
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
