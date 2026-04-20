<script setup lang="ts">
import { stepOneSchema } from '~/shared/validations/forgot'

interface Props {
  modelStep: number
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelStep': [value: number]
  'update:email': [value: string]
}>()

const api = useApi()

const form = reactive({ name: '' })
const errors = ref<Record<string, string>>({})
const loading = ref(false)

const validate = () => {
  const result = stepOneSchema.safeParse(form)
  if (!result.success) {
    errors.value = { name: result.error.issues[0]?.message ?? '' }
    return false
  }
  errors.value = {}
  return true
}

const handleSendCode = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const res = await api.post('/auth/forgot/send-code', { name: form.name })
    if (res.code === 0) {
      emit('update:email', form.name)
      emit('update:modelStep', 2)
      useKunMessage('重置验证码发送成功!', 'success')
    } else {
      useKunMessage(res.message || '发送失败', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="w-full space-y-4" @submit.prevent="handleSendCode">
    <KunInput
      v-model="form.name"
      label="邮箱"
      placeholder="请输入您的邮箱"
      autocomplete="email"
      :error="errors.name"
    >
      <template #prefix>
        <KunIcon name="lucide:user" class="text-default-400 size-4" />
      </template>
    </KunInput>
    <KunButton
      type="submit"
      color="primary"
      full-width
      :loading="loading"
      :disabled="loading"
    >
      发送验证码
    </KunButton>
  </form>
</template>
