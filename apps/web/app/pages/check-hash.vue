<script setup lang="ts">
useKunSeoMeta({
  title: 'BLAKE3 文件校验',
  description:
    '输入文件的 Hash, 然后上传文件以快速使用 BLAKE3 算法检查文件完好性'
})
</script>

<template>
  <div class="my-4 w-full">
    <KunHeader
      name="BLAKE3 文件校验"
      description="您可以输入文件的 Hash, 然后上传文件以快速使用 BLAKE3 算法检查文件完好性"
    />
    <div class="mt-6">
      <CheckHashContainer />
    </div>
  </div>
</template>
