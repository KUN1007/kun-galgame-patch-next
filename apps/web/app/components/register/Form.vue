<script setup lang="ts">
import { registerSchema } from '~/shared/validations/auth'
import type { UserState } from '~/stores/userStore'

const api = useApi()
const userStore = useUserStore()

const form = reactive({
  name: '',
  email: '',
  code: '',
  password: ''
})

const errors = ref<Record<string, string>>({})
const isAgree = ref(false)
const loading = ref(false)
const sendingCode = ref(false)

const validate = () => {
  const result = registerSchema.safeParse(form)
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

const handleSendCode = async () => {
  if (sendingCode.value) return
  if (!form.name || !form.email) {
    useKunMessage('请先填写用户名和邮箱', 'warn')
    return
  }
  sendingCode.value = true
  try {
    const res = await api.post('/auth/register/send-code', {
      name: form.name,
      email: form.email
    })
    if (res.code === 0) {
      useKunMessage('验证码已发送, 请查收邮箱', 'success')
    } else {
      useKunMessage(res.message || '发送失败', 'error')
    }
  } finally {
    sendingCode.value = false
  }
}

const handleRegister = async () => {
  if (!isAgree.value) {
    useKunMessage('请您勾选同意我们的用户协议', 'warn')
    return
  }
  if (!validate()) return

  loading.value = true
  try {
    const res = await api.post<UserState>('/auth/register', form)
    if (res.code === 0) {
      userStore.setUser(res.data)
      useKunMessage('注册成功!', 'success')
      await navigateTo(`/user/${res.data.uid}`)
    } else {
      useKunMessage(res.message || '注册失败', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="flex w-72 flex-col gap-4" @submit.prevent="handleRegister">
    <KunInput
      v-model="form.name"
      label="用户名"
      type="text"
      required
      autocomplete="username"
      :error="errors.name"
    />
    <KunInput
      v-model="form.email"
      label="邮箱"
      type="email"
      required
      autocomplete="email"
      :error="errors.email"
    />
    <KunInput
      v-model="form.code"
      label="验证码"
      type="text"
      required
      autocomplete="one-time-code"
      :error="errors.code"
    >
      <template #suffix>
        <button
          type="button"
          class="text-primary disabled:text-default-400 text-xs whitespace-nowrap hover:underline disabled:no-underline"
          :disabled="sendingCode"
          @click="handleSendCode"
        >
          {{ sendingCode ? '发送中...' : '发送验证码' }}
        </button>
      </template>
    </KunInput>
    <KunInput
      v-model="form.password"
      label="密码"
      type="password"
      required
      autocomplete="new-password"
      :error="errors.password"
    />

    <KunCheckBox v-model="isAgree" color="primary">
      <span class="ml-2 text-sm">
        我同意
        <NuxtLink to="/about/notice/privacy" class="text-primary ml-1">
          鲲 Galgame 补丁用户协议
        </NuxtLink>
      </span>
    </KunCheckBox>

    <KunButton
      type="submit"
      color="primary"
      full-width
      :loading="loading"
      :disabled="loading"
    >
      注册
    </KunButton>

    <KunTextDivider text="或" />

    <KunButton
      color="primary"
      variant="bordered"
      full-width
      href="/auth/forgot"
    >
      忘记密码
    </KunButton>

    <div class="flex items-center">
      <span class="mr-2">已经有账号了?</span>
      <NuxtLink to="/login" class="text-primary">登录账号</NuxtLink>
    </div>
  </form>
</template>
