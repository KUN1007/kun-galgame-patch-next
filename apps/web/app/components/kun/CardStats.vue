<script setup lang="ts">
interface Props {
  patch: GalgameCard
  disableTooltip?: boolean
  isMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disableTooltip: true,
  isMobile: true
})
</script>

<template>
  <div
    :class="
      cn(
        'text-default-500 flex space-x-4 text-sm',
        props.isMobile ? 'sm:justify-start' : ''
      )
    "
  >
    <div class="flex items-center gap-1">
      <KunIcon name="lucide:eye" class="size-4" />
      <span>{{ formatNumber(props.patch.view) }}</span>
    </div>

    <div class="flex items-center gap-1">
      <KunIcon name="lucide:download" class="size-4" />
      <span>{{ formatNumber(props.patch.download) }}</span>
    </div>

    <div
      :class="
        cn(
          'hidden items-center gap-1',
          props.isMobile ? 'hidden sm:flex' : 'flex'
        )
      "
    >
      <KunIcon name="lucide:heart" class="size-4" />
      <span>{{ formatNumber(props.patch._count.favorite_by || 0) }}</span>
    </div>

    <div class="flex items-center gap-1">
      <KunIcon name="lucide:puzzle" class="size-4" />
      <span>{{ formatNumber(props.patch._count.resource || 0) }}</span>
    </div>

    <div
      :class="
        cn(
          'hidden items-center gap-1',
          props.isMobile ? 'hidden sm:flex' : 'flex'
        )
      "
    >
      <KunIcon name="lucide:message-square" class="size-4" />
      <span>{{ formatNumber(props.patch._count.comment || 0) }}</span>
    </div>
  </div>
</template>
