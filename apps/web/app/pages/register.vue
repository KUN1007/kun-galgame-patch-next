<script setup lang="ts">
import { kunMoyuMoe } from '~/config/moyu-moe'

useKunSeoMeta({
  title: '注册',
  description: '注册 鲲 Galgame 补丁 账号'
})
</script>

<template>
  <div class="mx-auto flex items-center justify-center">
    <KunCard class-name="w-full max-w-md" :bordered="false">
      <template #header>
        <div class="flex flex-col items-center space-y-6 pt-8">
          <div
            class="text-default-500 text-medium flex cursor-default items-center space-x-2 font-medium"
          >
            <KunImage
              src="/favicon.webp"
              :alt="kunMoyuMoe.titleShort"
              :width="36"
              :height="36"
              class-name="rounded-2xl"
            />
            <span>{{ kunMoyuMoe.titleShort }}</span>
          </div>

          <h1 class="text-3xl font-bold">注册</h1>
        </div>
      </template>

      <div class="flex justify-center px-8 py-6">
        <RegisterForm />
      </div>
    </KunCard>
  </div>
</template>
