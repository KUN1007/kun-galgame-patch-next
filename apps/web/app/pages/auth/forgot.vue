<script setup lang="ts">
useKunSeoMeta({
  title: '忘记密码',
  description: '重置您的鲲 Galgame 补丁账号密码'
})

const step = ref(1)
const username = ref('')
</script>

<template>
  <div class="m-auto">
    <KunCard class-name="w-80" :bordered="false">
      <template #header>
        <div class="flex flex-col gap-2 p-6">
          <div class="bg-primary/10 mx-auto rounded-full p-3">
            <KunIcon name="lucide:lock-keyhole" class="text-primary size-6" />
          </div>
          <h1 class="text-center text-2xl font-bold">重置密码</h1>
          <p class="text-default-500 text-center text-sm">
            {{
              step === 1
                ? '输入您的邮箱以发送邮箱验证码'
                : '请输入您收到的验证码和新密码'
            }}
          </p>
        </div>
      </template>

      <KunDivider color="default" />

      <div class="space-y-4 p-6">
        <ForgotStepOne
          v-if="step === 1"
          :model-step="step"
          @update:model-step="step = $event"
          @update:email="username = $event"
        />
        <ForgotStepTwo
          v-else
          :name="username"
          @update:model-step="step = $event"
        />
      </div>
    </KunCard>
  </div>
</template>
