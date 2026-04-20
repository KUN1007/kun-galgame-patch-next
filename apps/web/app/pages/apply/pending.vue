<script setup lang="ts">
useKunSeoMeta({
  title: '申请已提交',
  description: '您的创作者申请已提交, 等待审核'
})
</script>

<template>
  <div class="m-auto flex flex-col items-center justify-center">
    <KunCard class-name="mx-auto max-h-80 w-full max-w-md p-8 text-center" :bordered="true">
      <div class="mb-4 flex justify-center">
        <KunIcon name="lucide:check-circle-2" class="text-success-500 size-16" />
      </div>
      <h1 class="mb-4 text-2xl font-bold">申请已经提交</h1>
      <div class="text-default-500 mb-6">
        <p>感谢您申请成为创作者!</p>
        <p>我们会在数小时内审核您的请求!</p>
      </div>
      <KunButton href="/" color="primary" full-width>
        返回主页
      </KunButton>
    </KunCard>
  </div>
</template>
