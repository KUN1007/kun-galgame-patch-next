<script setup lang="ts">
useKunSeoMeta({
  title: '成为创作者',
  description: '恭喜您成为创作者'
})
</script>

<template>
  <div class="m-auto w-full">
    <KunCard class-name="mx-auto max-w-96" :bordered="true">
      <div class="flex flex-col items-center gap-6 py-8">
        <div class="flex size-20 items-center justify-center rounded-full">
          <KunIcon
            name="lucide:badge-check"
            class="text-primary size-20"
          />
        </div>

        <div class="space-y-2 text-center">
          <h1 class="text-3xl font-bold">恭喜成为创作者！</h1>
          <p class="text-default-500">您现在可以使用创作者专属功能了</p>
        </div>

        <div class="flex gap-3">
          <KunButton
            color="primary"
            variant="shadow"
            size="lg"
            href="/edit/create"
          >
            <KunIcon name="lucide:rocket" class="size-4" />
            发布补丁
          </KunButton>
          <KunButton variant="bordered" color="default" size="lg" href="/">
            <KunIcon name="lucide:home" class="size-4" />
            返回首页
          </KunButton>
        </div>
      </div>
    </KunCard>
  </div>
</template>
