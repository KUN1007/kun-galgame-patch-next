<script setup lang="ts">
const kunKeepaliveConfig = {
  include: [
    'home-page',
    'galgame-list',
    'resource-list',
    'comment-feed',
    'search-page',
    'calendar-page',
    'tag-detail',
    'label-detail',
    'user-galgame',
    'user-resource',
    'user-favorite',
    'user-contribute',
    'user-comment'
  ]
}

onMounted(() => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem(
      '__VUE_DEVTOOLS_NEXT_PLUGIN_SETTINGS__dev.esm.pinia__',
      '{"logStoreChanges":false}'
    )
    localStorage.setItem('umami.disabled', '1')
  }
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator color="var(--color-primary, oklch(var(--primary-500)))" />
    <NuxtRouteAnnouncer />
    <KunMessageProvider />
    <KunAlertProvider />
    <LazyReportModal />
    <NuxtLayout>
      <NuxtPage :keepalive="kunKeepaliveConfig" />
    </NuxtLayout>
  </div>
</template>
