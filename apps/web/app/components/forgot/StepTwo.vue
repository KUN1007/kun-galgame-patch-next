<script setup lang="ts">
import { stepTwoSchema } from '~/shared/validations/forgot'

interface Props {
  name: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelStep': [value: number]
}>()

const api = useApi()

const form = reactive({
  name: props.name,
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

watch(
  () => props.name,
  (v) => {
    form.name = v
  }
)

const errors = ref<Record<string, string>>({})
const loading = ref(false)

const validate = () => {
  const result = stepTwoSchema.safeParse(form)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    errors.value = fieldErrors
    return false
  }
  errors.value = {}
  return true
}

const handleReset = async () => {
  if (form.newPassword !== form.confirmPassword) {
    useKunMessage('您两次输入的密码不一致, 请重新输入', 'warn')
    return
  }
  if (!validate()) return

  loading.value = true
  try {
    const res = await api.post('/auth/forgot/reset', { ...form })
    if (res.code === 0) {
      useKunMessage('重置密码成功! 正在跳转到登录页', 'success')
      await navigateTo('/login')
    } else {
      useKunMessage(res.message || '重置失败', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleReset">
    <KunInput
      v-model="form.name"
      label="用户名"
      autocomplete="username"
      disabled
    />
    <KunInput
      v-model="form.verificationCode"
      label="验证码"
      placeholder="请输入验证码"
      autocomplete="one-time-code"
      :error="errors.verificationCode"
    >
      <template #prefix>
        <KunIcon name="lucide:key-round" class="text-default-400 size-4" />
      </template>
    </KunInput>
    <KunInput
      v-model="form.newPassword"
      label="新密码"
      type="password"
      placeholder="请输入新密码"
      autocomplete="new-password"
      :error="errors.newPassword"
    >
      <template #prefix>
        <KunIcon name="lucide:lock-keyhole" class="text-default-400 size-4" />
      </template>
    </KunInput>
    <KunInput
      v-model="form.confirmPassword"
      label="确认密码"
      type="password"
      placeholder="请再次输入新密码"
      autocomplete="new-password"
      :error="errors.confirmPassword"
    >
      <template #prefix>
        <KunIcon name="lucide:lock-keyhole" class="text-default-400 size-4" />
      </template>
    </KunInput>
    <div class="space-y-2">
      <KunButton
        type="submit"
        color="primary"
        full-width
        :loading="loading"
        :disabled="loading"
      >
        确认重置密码
      </KunButton>
      <KunButton
        variant="light"
        color="default"
        full-width
        type="button"
        @click="emit('update:modelStep', 1)"
      >
        返回
      </KunButton>
    </div>
  </form>
</template>
