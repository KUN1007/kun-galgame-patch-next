<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    subjectKind: string
    subjectId: string | number
    snapshot?: string
    subjectUrl?: string
    label?: string
    menu?: boolean
  }>(),
  { snapshot: '', subjectUrl: '', label: '举报', menu: false }
)

const { requireLogin } = useAuthModal()
const { open } = useReportModal()

const trigger = () => {
  if (!requireLogin()) return
  open({
    subjectKind: props.subjectKind,
    subjectId: props.subjectId,
    snapshot: props.snapshot,
    subjectUrl: props.subjectUrl
  })
}
</script>

<template>
  <KunButton
    v-if="menu"
    variant="light"
    color="danger"
    size="sm"
    class-name="w-full justify-start gap-2 whitespace-nowrap"
    @click="trigger"
  >
    <KunIcon class-name="text-lg" name="lucide:flag" />{{ label }}
  </KunButton>

  <KunTooltip v-else :text="label">
    <KunButton
      :is-icon-only="true"
      color="danger"
      variant="light"
      size="sm"
      @click="trigger"
    >
      <KunIcon name="lucide:flag" />
    </KunButton>
  </KunTooltip>
</template>
