<script setup lang="ts">
definePageMeta({
  middleware: (to) =>
    navigateTo(`/user/${to.params.id}/resource`, { redirectCode: 302 })
})
</script>

<template>
  <div />
</template>
