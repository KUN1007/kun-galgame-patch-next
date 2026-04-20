<script setup lang="ts">
useKunSeoMeta({
  title: '账户设置',
  description: '管理您的账户'
})

const api = useApi()
const userStore = useUserStore()

const usernameForm = reactive({ username: '' })
const usernameLoading = ref(false)
const handleSaveUsername = async () => {
  if (userStore.user.moemoepoint < 30) {
    useKunMessage('更改用户名最少需要 30 萌萌点, 您的萌萌点不足', 'warn')
    return
  }
  if (!usernameForm.username.trim()) {
    useKunMessage('请输入新的用户名', 'warn')
    return
  }
  usernameLoading.value = true
  try {
    const res = await api.put('/user/username', {
      username: usernameForm.username
    })
    if (res.code === 0) {
      userStore.setUser({
        ...userStore.user,
        name: usernameForm.username,
        moemoepoint: userStore.user.moemoepoint - 30
      })
      usernameForm.username = ''
      useKunMessage('更新用户名成功', 'success')
    } else {
      useKunMessage(res.message || '更新失败', 'error')
    }
  } finally {
    usernameLoading.value = false
  }
}

const bio = ref(userStore.user.bio)
const bioLoading = ref(false)
const handleSaveBio = async () => {
  bioLoading.value = true
  try {
    const res = await api.put('/user/bio', { bio: bio.value })
    if (res.code === 0) {
      userStore.setUser({ ...userStore.user, bio: bio.value })
      useKunMessage('更新简介成功', 'success')
    } else {
      useKunMessage(res.message || '更新失败', 'error')
    }
  } finally {
    bioLoading.value = false
  }
}

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordLoading = ref(false)
const handleSavePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    useKunMessage('两次输入的密码不一致', 'warn')
    return
  }
  passwordLoading.value = true
  try {
    const res = await api.put('/user/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    if (res.code === 0) {
      useKunMessage('修改密码成功', 'success')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      useKunMessage(res.message || '修改失败', 'error')
    }
  } finally {
    passwordLoading.value = false
  }
}

const emailForm = reactive({ newEmail: '', code: '' })
const sendingEmail = ref(false)
const savingEmail = ref(false)
const handleSendEmailCode = async () => {
  if (!emailForm.newEmail.trim()) {
    useKunMessage('请输入新邮箱', 'warn')
    return
  }
  sendingEmail.value = true
  try {
    const res = await api.post('/user/email/send-code', {
      newEmail: emailForm.newEmail
    })
    if (res.code === 0) {
      useKunMessage('验证码已发送至新邮箱', 'success')
    } else {
      useKunMessage(res.message || '发送失败', 'error')
    }
  } finally {
    sendingEmail.value = false
  }
}
const handleSaveEmail = async () => {
  if (!emailForm.code.trim()) {
    useKunMessage('请输入验证码', 'warn')
    return
  }
  savingEmail.value = true
  try {
    const res = await api.put('/user/email', {
      code: emailForm.code,
      newEmail: emailForm.newEmail
    })
    if (res.code === 0) {
      useKunMessage('邮箱修改成功', 'success')
      emailForm.newEmail = ''
      emailForm.code = ''
    } else {
      useKunMessage(res.message || '修改失败', 'error')
    }
  } finally {
    savingEmail.value = false
  }
}
</script>

<template>
  <div class="my-4 w-full">
    <KunHeader name="账户设置" description="您可以在此处设置您的账户信息" />

    <div class="mx-auto my-4 max-w-3xl space-y-6">
      <KunCard :bordered="true">
        <template #header>
          <h2 class="px-1 pt-1 text-xl font-medium">用户名</h2>
        </template>
        <p class="text-default-600 text-sm">
          当前用户名: <strong>{{ userStore.user.name || '未登录' }}</strong>
        </p>
        <KunInput
          v-model="usernameForm.username"
          label="新用户名"
          placeholder="输入新用户名"
          autocomplete="username"
        />
        <div class="flex items-center justify-between gap-2 pt-2">
          <p class="text-default-500 text-xs">
            用户名长度最大 17, 可以是任意字符, 更改需消耗 30 萌萌点
          </p>
          <KunButton
            color="primary"
            :loading="usernameLoading"
            :disabled="usernameLoading"
            @click="handleSaveUsername"
          >
            保存
          </KunButton>
        </div>
      </KunCard>

      <KunCard :bordered="true">
        <template #header>
          <h2 class="px-1 pt-1 text-xl font-medium">个人简介</h2>
        </template>
        <textarea
          v-model="bio"
          placeholder="写一些介绍..."
          rows="3"
          class="border-default/20 bg-background w-full rounded-lg border p-3 text-sm"
        />
        <div class="flex justify-end pt-2">
          <KunButton
            color="primary"
            :loading="bioLoading"
            :disabled="bioLoading"
            @click="handleSaveBio"
          >
            保存
          </KunButton>
        </div>
      </KunCard>

      <KunCard :bordered="true">
        <template #header>
          <h2 class="px-1 pt-1 text-xl font-medium">修改邮箱</h2>
        </template>
        <KunInput
          v-model="emailForm.newEmail"
          label="新邮箱"
          type="email"
          autocomplete="email"
        />
        <KunInput
          v-model="emailForm.code"
          label="验证码"
          autocomplete="one-time-code"
        >
          <template #suffix>
            <button
              type="button"
              class="text-primary disabled:text-default-400 text-xs whitespace-nowrap hover:underline"
              :disabled="sendingEmail"
              @click="handleSendEmailCode"
            >
              {{ sendingEmail ? '发送中...' : '发送验证码' }}
            </button>
          </template>
        </KunInput>
        <div class="flex justify-end pt-2">
          <KunButton
            color="primary"
            :loading="savingEmail"
            :disabled="savingEmail"
            @click="handleSaveEmail"
          >
            保存
          </KunButton>
        </div>
      </KunCard>

      <KunCard :bordered="true">
        <template #header>
          <h2 class="px-1 pt-1 text-xl font-medium">修改密码</h2>
        </template>
        <KunInput
          v-model="passwordForm.oldPassword"
          label="原密码"
          type="password"
          autocomplete="current-password"
        />
        <KunInput
          v-model="passwordForm.newPassword"
          label="新密码"
          type="password"
          autocomplete="new-password"
        />
        <KunInput
          v-model="passwordForm.confirmPassword"
          label="确认新密码"
          type="password"
          autocomplete="new-password"
        />
        <div class="flex justify-end pt-2">
          <KunButton
            color="primary"
            :loading="passwordLoading"
            :disabled="passwordLoading"
            @click="handleSavePassword"
          >
            保存
          </KunButton>
        </div>
      </KunCard>
    </div>
  </div>
</template>
