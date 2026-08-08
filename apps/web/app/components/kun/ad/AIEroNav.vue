<script setup lang="ts">
import { kunMoyuMoe } from '~/config/moyu-moe'

const userStore = useUserStore()
</script>

<template>
  <KunTooltip v-if="!userStore.isAdFree" text="为什么现在的 AI 比人还要 H">
    <a :href="kunMoyuMoe.ad[0]?.url" target="_blank" rel="noopener noreferrer">
      <KunImage
        src="/a/moyumoe1-button.avif"
        alt=""
        provider="none"
        :skeleton="false"
        :width="500"
        :height="193"
        class-name="h-10 w-auto dark:opacity-80"
      />
    </a>
  </KunTooltip>
</template>
