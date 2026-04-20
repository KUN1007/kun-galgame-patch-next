<script setup lang="ts">
interface Props {
  text: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex w-full items-center justify-center overflow-hidden">
    <div class="border-default/20 my-4 w-full border-t" />
    <span class="text-default-500 mx-4 text-sm whitespace-nowrap">
      {{ props.text }}
    </span>
    <div class="border-default/20 my-4 w-full border-t" />
  </div>
</template>
