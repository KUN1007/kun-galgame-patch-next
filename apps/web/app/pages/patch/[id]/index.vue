<script setup lang="ts">
const route = useRoute()

definePageMeta({
  middleware: (to) =>
    navigateTo(`/patch/${to.params.id}/introduction`, { redirectCode: 302 })
})
</script>

<template>
  <div />
</template>
