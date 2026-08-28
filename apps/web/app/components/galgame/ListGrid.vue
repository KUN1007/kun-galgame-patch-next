<script setup lang="ts">
defineSlots<{ default: () => unknown }>()
</script>

<template>
  <!-- Container queries, not viewport ones: the same list hangs in a full-width
       page and in the half-width column /user/:id/info gives it. -->
  <div class="@container">
    <div class="grid grid-cols-1 gap-3 @4xl:grid-cols-2 @4xl:gap-4">
      <slot />
    </div>
  </div>
</template>
