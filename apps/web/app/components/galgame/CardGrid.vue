<script setup lang="ts">
defineSlots<{ default: () => unknown }>()
</script>

<template>
  <!-- Container queries, not viewport ones: /user/:id/info hangs this grid in a
       column roughly half the page wide, and viewport breakpoints drew six
       ~90px posters in it. -->
  <div class="@container">
    <div
      class="grid grid-cols-2 gap-2 @lg:grid-cols-3 @lg:gap-3 @2xl:grid-cols-4 @4xl:grid-cols-5 @5xl:grid-cols-6"
    >
      <slot />
    </div>
  </div>
</template>
